/* eslint-disable react-hooks/set-state-in-effect */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Edit2,
  Repeat,
  UserX,
  Clock,
  ClipboardList,
  Edit,
  Users,
  ArrowLeft,
  Save,
  Calendar,
  Eye,
  List,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";
import { v4 as uuidv4 } from "uuid";
import {
  DateShiftGroup,
  RecurringCadence,
  ScheduleDefinition,
  ScheduleMode,
  SecurityUser,
  ShiftPeriod,
} from "../services/types";
import { securityDb } from "../services/database";
import { showAccessDeniedToast } from "./Users";
import {
  GuardAssignmentDropdown,
  RecurringGuardDropdown,
} from "./ScheduleGuardSelect";

interface InteractiveCalendarTabProps {
  selectedSchedule: ScheduleDefinition | null;
  onBack?: () => void;
}

export default function SecuritySchedulesPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "calendar">("builder");
  const [schedules, setSchedules] = useState<ScheduleDefinition[]>([]);
  const [selectedScheduleForCalendar, setSelectedScheduleForCalendar] =
    useState<ScheduleDefinition | null>(null);
  const { user, contextEstateId } = useUser();
  const canView =
    user?.permissions?.includes("security_management") ||
    user?.permissions?.includes("view_security_schedules") ||
    user?.permissions?.includes("all-access");

  const fetchSchedules = useCallback(async () => {
    if (!contextEstateId) return;

    try {
      const res = await securityDb.getSchedules(contextEstateId!);
      if (res.success) {
        const schedules: ScheduleDefinition[] = res.schedules.map((s: any) => ({
          id: s.id,
          name: s.name,
          mode: s.mode,
          specificDateGroups: s.specific_date_groups,
          recurringCadence: s.recurring_cadence,
          startDate: s.start_date,
          endDate: s.end_date,
          recurringPeriods: s.recurring_periods,
          useSingleGuardThroughout: s.use_single_guard_throughout,
          singleGuardId: s.single_guard_id, // Fixed space typo here
        }));

        setSchedules(schedules);
      }
    } catch (err) {
      toast.error("Failed to load schedules");
    }
  }, [contextEstateId]);

  useEffect(() => {
    if (!canView) {
      showAccessDeniedToast();
      return;
    }

    fetchSchedules();
  }, [fetchSchedules, canView]);

  return (
    <div className="space-y-6 font-sans">
      {activeTab === "builder" ? (
        <ScheduleBuilderTab
          schedules={schedules}
          setSchedules={setSchedules}
          onViewCalendar={(sch) => {
            setSelectedScheduleForCalendar(sch);
            setActiveTab("calendar");
          }}
        />
      ) : (
        <InteractiveCalendarTab
          selectedSchedule={selectedScheduleForCalendar}
          onBack={() => {
            setActiveTab("builder");
            setSelectedScheduleForCalendar(null);
          }}
        />
      )}
    </div>
  );
}

// ==========================================
// TAB 1: ADVANCED SCHEDULE BUILDER
// ==========================================
export function ScheduleBuilderTab({
  schedules,
  setSchedules,
  onViewCalendar,
}: {
  schedules: ScheduleDefinition[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleDefinition[]>>;
  onViewCalendar: (sch: ScheduleDefinition) => void;
}) {
  const { contextEstateId } = useUser();
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Basic Info
  const [scheduleName, setScheduleName] = useState("");
  const [mode, setMode] = useState<ScheduleMode>("specific");

  // Specific Dates State
  const [specificGroups, setSpecificGroups] = useState<DateShiftGroup[]>([]);
  const [dateInput, setDateInput] = useState("");

  // Recurring State
  const [cadence, setCadence] = useState<RecurringCadence>("daily");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  const [useSingleGuard, setUseSingleGuard] = useState(false);
  const [singleGuardId, setSingleGuardId] = useState("");
  const [recurringPeriods, setRecurringPeriods] = useState<ShiftPeriod[]>([]);
  const recurringbottomRef = useRef(null as HTMLDivElement | null);

  useEffect(() => {
    if (!contextEstateId) return;
    securityDb
      .getAllSecurity(contextEstateId)
      .then(setGuards)
      .catch(console.error);
  }, [contextEstateId]);

  const maxDays = useMemo(() => {
    const days =
      cadence === "weekly"
        ? 7
        : cadence === "bi-weekly"
          ? 14
          : cadence === "tri-weekly"
            ? 21
            : 0;
    return days;
  }, [cadence]);

  // Handle Adding Specific Dates
  const handleAddDateGroup = () => {
    if (!dateInput) {
      return toast.error("Please select a date before adding", {
        id: "no_date_warning",
      });
    }
    if (specificGroups.some((g) => g.date === dateInput)) {
      return toast.error("Date already added", {
        id: "duplicate_date_warning",
      });
    }
    setSpecificGroups([
      ...specificGroups,
      {
        date: dateInput,
        periods: [
          {
            id: uuidv4(),
            label: "Shift 1",
            startTime: "08:00",
            endTime: "16:00",
            assignedGuardIds: [],
            startTimeDayOffset: 0,
            endTimeDayOffset: 0,
          },
        ],
      },
    ]);
    setDateInput("");
    setTimeout(() => {
      recurringbottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  };

  const getNextPeriodTimes = (periods: any[]) => {
    if (periods.length === 0) {
      return { startTime: "08:00", endTime: "16:00", startOffset: 0 };
    }

    const lastPeriod = periods[periods.length - 1];
    const lastEnd = lastPeriod.endTime;

    // The start offset of the NEW shift is the end offset of the LAST shift
    const startOffset = lastPeriod.endTimeDayOffset ?? 0;

    const [hours, mins] = lastEnd.split(":").map(Number);
    const totalMins = hours * 60 + mins;

    const nextStartMins = totalMins % (24 * 60);
    const nextEndMins = (nextStartMins + 480) % (24 * 60);

    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60)
        .toString()
        .padStart(2, "0");
      const m = (minutes % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    return {
      startTime: formatTime(nextStartMins),
      endTime: formatTime(nextEndMins),
      startOffset,
    };
  };

  // Helper to calculate next start/end times safely
  const addPeriodToDateGroup = (dateStr: string) => {
    setSpecificGroups((prev) =>
      prev.map((group) => {
        if (group.date !== dateStr) return group;

        const { startTime, endTime, startOffset } = getNextPeriodTimes(
          group.periods,
        );

        const isOvernight =
          (startTime >= endTime && endTime !== "00:00") || endTime === "00:00";

        const newEndOffset = isOvernight ? startOffset + 1 : startOffset;

        return {
          ...group,
          periods: [
            ...group.periods,
            {
              id: uuidv4(),
              label: `Shift ${group.periods.length + 1}`,
              startTime,
              endTime,
              assignedGuardIds: [],
              startTimeDayOffset: startOffset, // Starts on the offset inherited from previous shift end
              endTimeDayOffset: newEndOffset,
            },
          ],
        };
      }),
    );
    setTimeout(() => {
      recurringbottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 100);
  };

  const createInitialPeriodsForCadence = (
    selectedCadence: RecurringCadence,
  ): ShiftPeriod[] => {
    const count =
      selectedCadence === "weekly"
        ? 7
        : selectedCadence === "bi-weekly"
          ? 14
          : selectedCadence === "tri-weekly"
            ? 21
            : 1;

    return Array.from({ length: count }, (_, i) => ({
      id: uuidv4(),
      label:
        selectedCadence === "daily" ? `Period ${i + 1}` : `Day ${i + 1} Shift`,
      startTime: "08:00",
      endTime: "16:00",
      startTimeDayOffset: i,
      endTimeDayOffset: i,
      assignedGuardIds: [],
    }));
  };

  // Handle Cadence Change & update End Date automatically
  const handleCadenceChange = (newCadence: RecurringCadence) => {
    resetForm();
    setCadence(newCadence);
    if (startDate) {
      setEndDate(calculateEndDateForCadence(startDate, newCadence));
    }
    setRecurringPeriods(createInitialPeriodsForCadence(newCadence));
  };

  const handleDeleteRecurringPeriod = (id: string) => {
    setRecurringPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const calculateEndDateForCadence = (
    start: string,
    currentCadence: RecurringCadence,
    periods: ShiftPeriod[] = recurringPeriods,
  ): string => {
    if (!start) return "";
    const date = new Date(start);
    if (isNaN(date.getTime())) return "";

    let daysToAdd = 1;
    if (currentCadence === "weekly") daysToAdd = 7;
    else if (currentCadence === "bi-weekly") daysToAdd = 14;
    else if (currentCadence === "tri-weekly") daysToAdd = 21;
    else if (currentCadence === "daily") daysToAdd = 1;

    date.setDate(date.getDate() + daysToAdd - 1);
    return date.toISOString().split("T")[0];
  };

  // Call this whenever setRecurringPeriods updates slots in daily mode
  const updateDailyEndDate = () => {
    if (cadence === "daily" && startDate) {
      setEndDate(calculateEndDateForCadence(startDate, "daily"));
    }
  };

  // Handle Start Date Change & update End Date automatically
  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    if (newStartDate && cadence) {
      setEndDate(calculateEndDateForCadence(newStartDate, cadence));
    }
  };

  // Add new recurring period with smart time/dayOffset calculation
  const addRecurringPeriod = () => {
    let newStartTime = "08:00";
    let newEndTime = "16:00";
    let newStartOffset = 0;

    if (recurringPeriods.length > 0) {
      const last = recurringPeriods[recurringPeriods.length - 1];

      // Starts on the exact day offset where the last shift finished
      newStartOffset = last.endTimeDayOffset;
      newStartTime = last.endTime;

      // Auto-calculate default 8-hour window
      const startMins =
        Number(newStartTime.split(":")[0]) * 60 +
        Number(newStartTime.split(":")[1]);
      const endMins = (startMins + 480) % (24 * 60);
      newEndTime = `${Math.floor(endMins / 60)
        .toString()
        .padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`;
    }

    // Check overnight wrap
    const isOvernight =
      (newStartTime >= newEndTime && newEndTime !== "00:00") ||
      newEndTime === "00:00";
    const newEndOffset = isOvernight ? newStartOffset + 1 : newStartOffset;

    // --- BOUNDARY VALIDATION ---
    // If the new shift starts past or extends beyond the cadence cycle limit
    if (
      cadence !== "daily" &&
      (newStartOffset >= maxDays || newEndOffset >= maxDays)
    ) {
      return toast.error(
        `Cannot add period slot: Shift extends to Day ${newEndOffset}, which exceeds your ${cadence} cycle (${maxDays} days).`,
      );
    }

    setRecurringPeriods((prev) => [
      ...prev,
      {
        id: uuidv4(),
        label:
          cadence === "daily"
            ? `Period ${prev.length + 1}`
            : `Day ${newStartOffset} Shift`,
        startTime: newStartTime,
        endTime: newEndTime,
        startTimeDayOffset: newStartOffset,
        endTimeDayOffset: newEndOffset,
        assignedGuardIds: [],
      },
    ]);
    setTimeout(() => {
      recurringbottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end", 
      });
    }, 100);
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!id || !contextEstateId) return;
    const schedule = schedules.find((s) => s.id === id);
    if (!confirm(`Are you sure you want to delete "${schedule?.name}"?`))
      return;

    try {
      const res = await securityDb.deleteSchedule(contextEstateId, id);
      if (res?.success) {
        toast.success("Schedule deleted successfully");
        setSchedules(schedules.filter((s) => s.id !== id));
      } else {
        toast.error("Failed to delete schedule");
      }
    } catch (err) {
      toast.error("Failed to delete schedule");
    }
  };

  const updateSpecificPeriod = (
    gIndex: number,
    pIndex: number,
    val: any,
    field: string,
  ) => {
    setSpecificGroups((prev) =>
      prev.map((g, gIdx) => {
        if (gIdx !== gIndex) return g;

        const isTimeField = field === "startTime" || field === "endTime";

        // Simple update for non-time fields (label, guards, etc.)
        if (!isTimeField) {
          return {
            ...g,
            periods: g.periods.map((p, pIdx) =>
              pIdx === pIndex ? { ...p, [field]: val } : p,
            ),
          };
        }

        // Cascade offset recalculation across all periods when a time changes
        let currentOffset = 0;
        const updatedPeriods = g.periods.map((p, pIdx) => {
          const updated = pIdx === pIndex ? { ...p, [field]: val } : { ...p };

          const startTimeDayOffset = currentOffset;

          const isOvernight =
            (updated.startTime >= updated.endTime &&
              updated.endTime !== "00:00") ||
            updated.endTime === "00:00";

          const endTimeDayOffset = isOvernight
            ? currentOffset + 1
            : currentOffset;

          // Carry forward the end offset to the next period in line
          currentOffset = endTimeDayOffset;

          return {
            ...updated,
            startTimeDayOffset,
            endTimeDayOffset,
          };
        });

        return {
          ...g,
          periods: updatedPeriods,
        };
      }),
    );
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleName) return toast.error("Schedule title is required");

    // --- 1. SPECIFIC DATES MODE VALIDATION ---
    if (mode === "specific") {
      if (specificGroups.length === 0) {
        return toast.error("Please add at least one date");
      }

      // Check for overlapping periods within each specific date group
      for (const group of specificGroups) {
        for (let i = 1; i < group.periods.length; i++) {
          const prev = group.periods[i - 1];
          const curr = group.periods[i];

          const [prevStartH, prevStartM] = prev.startTime
            .split(":")
            .map(Number);
          const [prevEndH, prevEndM] = prev.endTime.split(":").map(Number);
          const [currStartH, currStartM] = curr.startTime
            .split(":")
            .map(Number);

          // Convert times to absolute minutes from Day 0 00:00
          const prevStartAbs =
            (prev.startTimeDayOffset ?? 0) * 1440 +
            (prevStartH * 60 + prevStartM);

          // If end time is 00:00, it marks the exact start of the next day (endTimeDayOffset * 1440)
          const prevEndAbs =
            prev.endTime === "00:00"
              ? (prev.endTimeDayOffset ?? 0) * 1440
              : (prev.startTimeDayOffset ?? 0) * 1440 +
                (prevEndH * 60 + prevEndM);

          const currStartAbs =
            (curr.startTimeDayOffset ?? 0) * 1440 +
            (currStartH * 60 + currStartM);

          if (currStartAbs < prevEndAbs) {
            return toast.error(
              `Time overlap detected on ${group.date}: Shift "${curr.label}" starts before Shift "${prev.label}" ends.`,
            );
          }
        }
      }
    }

    // --- 2. RECURRING MODE VALIDATION ---
    if (mode === "recurring") {
      if (!startDate || !endDate) {
        return toast.error(
          "Please specify both Start and End dates for recurring schedule",
        );
      }

      if (recurringPeriods.length === 0) {
        return toast.error("Please add at least one recurring period slot");
      }

      // A. Check if ANY shift exceeds the current cadence window
      for (const period of recurringPeriods) {
        if (
          maxDays > 0 &&
          (period.startTimeDayOffset >= maxDays ||
            period.endTimeDayOffset >= maxDays)
        ) {
          return toast.error(
            `Shift "${period.label}" extends to Day ${period.endTimeDayOffset}, which exceeds the ${cadence} limit (${maxDays} days).`,
          );
        }
      }

      // B. Check for shift overlaps using absolute minute comparisons
      for (let i = 1; i < recurringPeriods.length; i++) {
        const prev = recurringPeriods[i - 1];
        const curr = recurringPeriods[i];

        const [prevEndH, prevEndM] = prev.endTime.split(":").map(Number);
        const [currStartH, currStartM] = curr.startTime.split(":").map(Number);

        const prevEndAbs =
          prev.endTimeDayOffset * 1440 + (prevEndH * 60 + prevEndM);
        const currStartAbs =
          curr.startTimeDayOffset * 1440 + (currStartH * 60 + currStartM);

        if (currStartAbs < prevEndAbs) {
          return toast.error(
            `Time overlap detected: Shift "${curr.label}" starts before Shift "${prev.label}" ends.`,
          );
        }
      }

      if (recurringPeriods.length > 1) {
        const first = recurringPeriods[0];
        const last = recurringPeriods[recurringPeriods.length - 1];

        const [firstStartH, firstStartM] = first.startTime
          .split(":")
          .map(Number);
        const [lastEndH, lastEndM] = last.endTime.split(":").map(Number);

        const totalCycleDays =
          maxDays > 0
            ? maxDays
            : last.endTimeDayOffset - first.startTimeDayOffset;

        const firstStartAbs =
          first.startTimeDayOffset * 1440 + (firstStartH * 60 + firstStartM);
        const lastEndAbs =
          (last.endTimeDayOffset - totalCycleDays) * 1440 +
          (lastEndH * 60 + lastEndM);

        if (lastEndAbs > firstStartAbs) {
          return toast.error(
            `Cycle Rollover Overlap: Shift "${last.label}" ends at ${last.endTime}, which overlaps with Shift "${first.label}" starting at ${first.startTime} in the next repeating cycle.`,
          );
        }
      }

      const maxOffset = Math.max(
        ...recurringPeriods.map(
          (p) => p.endTimeDayOffset ?? p.startTimeDayOffset ?? 0,
        ),
      );
      const requiredDays = Math.max(1, maxOffset + 1);

      const [startY, startM, startD] = startDate.split("-").map(Number);
      const minRequiredEndDate = new Date(Date.UTC(startY, startM - 1, startD));
      minRequiredEndDate.setUTCDate(
        minRequiredEndDate.getUTCDate() + requiredDays - 1,
      );
      const minEndDateStr = minRequiredEndDate.toISOString().split("T")[0];

      if (endDate < minEndDateStr) {
        return toast.error(
          `Selected End Date (${endDate}) does not cover the full shift sequence. The schedule extends to Day ${
            maxOffset + 1
          }, requiring an End Date of at least ${minEndDateStr}.`,
        );
      }
    }

    // --- 3. PAYLOAD PREPARATION & DATABASE DISPATCH ---
    const newSchedule: Omit<ScheduleDefinition, "id"> = {
      name: scheduleName,
      mode,
      ...(mode === "specific"
        ? { specificDateGroups: specificGroups }
        : {
            recurringCadence: cadence,
            startDate,
            endDate,
            recurringPeriods,
            useSingleGuardThroughout: useSingleGuard,
            singleGuardId: useSingleGuard ? singleGuardId : undefined,
          }),
    };

    const res = await securityDb.createSecuritySchedule(
      contextEstateId!,
      newSchedule,
    );

    if (res.success) {
      setSchedules([...schedules, res.schedule]);
      setIsModalOpen(false);
      toast.success("Schedule created successfully!");
    } else {
      toast.error("Failed to create schedule. Please try again.");
    }
  };

  const resetForm = () => {
    setScheduleName("");

    // Specific Dates State
    setSpecificGroups([]);
    setDateInput("");

    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setUseSingleGuard(false);
    setSingleGuardId("");
    setRecurringPeriods([]);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs gap-4">
        <div>
          <h3 className="font-montserrat font-black text-slate-800 text-base">
            Security Roster Engine
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Configure multi-period daily shifts, recurring cycles, and guard
            allocations.
          </p>
        </div>
        {!isModalOpen && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
          >
            <Plus size={16} /> Create Schedule
          </button>
        )}
      </div>

      {/* MODE 1: CREATE SCHEDULE FORM MODAL (SHOW ONLY FORM) */}
      {isModalOpen ? (
        <form
          onSubmit={handleSaveSchedule}
          className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl space-y-6 shadow-md animate-in fade-in zoom-in-95 duration-200 pb-12"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h4 className="font-montserrat font-black text-slate-800 text-base uppercase tracking-wide">
              New Shift Schedule
            </h4>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Schedule Title */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Schedule Title
            </label>
            <input
              type="text"
              placeholder="e.g. Estate Gate Patrol Roster"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white"
            />
          </div>

          {/* Mode Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Schedule Mode
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={mode === "specific"}
                  onChange={() => {
                    setMode("specific");
                    resetForm();
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Specific Dates
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scheduleMode"
                  checked={mode === "recurring"}
                  onChange={() => {
                    setMode("recurring");
                    resetForm();
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  Recurring Cycle
                </span>
              </label>
            </div>
          </div>

          {/* SPECIFIC DATES MODE */}
          {mode === "specific" && (
            <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Add Specific Date
                  </label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddDateGroup}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-slate-800"
                >
                  Add Date Slot
                </button>
              </div>

              {/* Index used as key for currently being created groups */}
              <div className="space-y-4 pt-2">
                {specificGroups.map((group, groupIdx) => {
                  const addedDays = group.periods.reduce((acc, p) => {
                    return p.startTime && p.endTime && p.startTime >= p.endTime
                      ? acc + 1
                      : acc;
                  }, 0);

                  return (
                    <div
                      key={group.date || groupIdx}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-montserrat font-black text-xs text-blue-600">
                            🗓️ {group.date}
                          </span>
                          {addedDays > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full flex items-center gap-1">
                              Spans {addedDays} extra day
                              {addedDays > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setSpecificGroups((prev) =>
                              prev.filter((_, idx) => idx !== groupIdx),
                            )
                          }
                          className="text-slate-300 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {group.periods.map((period, periodIdx) => {
                        const prevPeriod = group.periods[periodIdx - 1];
                        const hasOverlap =
                          prevPeriod && period.startTime < prevPeriod.endTime;

                        return (
                          <div
                            key={periodIdx}
                            className={`p-3 rounded-xl border space-y-2 text-xs transition-colors ${
                              hasOverlap
                                ? "bg-rose-50/50 border-rose-200"
                                : "bg-slate-50 border-slate-100"
                            }`}
                          >
                            {/* Header row with period label and delete action */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                                <input
                                  type="text"
                                  placeholder="Shift Label"
                                  value={period.label}
                                  onChange={(e) =>
                                    updateSpecificPeriod(
                                      groupIdx,
                                      periodIdx,
                                      e.target.value,
                                      "label",
                                    )
                                  }
                                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                />
                                <input
                                  type="time"
                                  value={period.startTime}
                                  min={
                                    prevPeriod ? prevPeriod.endTime : undefined
                                  }
                                  onChange={(e) =>
                                    updateSpecificPeriod(
                                      groupIdx,
                                      periodIdx,
                                      e.target.value,
                                      "startTime",
                                    )
                                  }
                                  className={`px-2 py-1 bg-white border rounded-lg text-xs ${
                                    hasOverlap
                                      ? "border-rose-400 text-rose-600 font-bold"
                                      : "border-slate-200"
                                  }`}
                                />
                                <input
                                  type="time"
                                  value={period.endTime}
                                  onChange={(e) =>
                                    updateSpecificPeriod(
                                      groupIdx,
                                      periodIdx,
                                      e.target.value,
                                      "endTime",
                                    )
                                  }
                                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                                />
                              </div>

                              {/* Delete Period Button */}
                              <button
                                type="button"
                                title="Delete Shift Period"
                                onClick={() => {
                                  setSpecificGroups((prev) =>
                                    prev.map((g, gIdx) => {
                                      if (gIdx !== groupIdx) return g;
                                      return {
                                        ...g,
                                        periods: g.periods.filter(
                                          (_, pIdx) => pIdx !== periodIdx,
                                        ),
                                      };
                                    }),
                                  );
                                }}
                                className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            {/* Validation Warnings */}
                            {hasOverlap && (
                              <p className="text-[10px] text-rose-600 font-bold">
                                ⚠️ Shift overlaps with the previous shift (ends
                                at {prevPeriod.endTime}).
                              </p>
                            )}

                            {period.startTime >= period.endTime &&
                              !hasOverlap && (
                                <p className="text-[10px] text-purple-600 font-bold">
                                  🌙 Overnight Shift (+1 Day)
                                </p>
                              )}

                            <GuardAssignmentDropdown
                              guards={guards}
                              period={period}
                              groupIdx={groupIdx}
                              periodIdx={periodIdx}
                              setSpecificGroups={setSpecificGroups}
                            />
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => addPeriodToDateGroup(group.date)}
                        className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} /> Add Shift Period to {group.date}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* RECURRING CADENCE MODE */}
          {mode === "recurring" && (
            <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Recurrence Cycle
                  </label>
                  <select
                    value={cadence}
                    onChange={(e) =>
                      handleCadenceChange(e.target.value as RecurringCadence)
                    }
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="daily">Daily (Freestyle)</option>
                    <option value="weekly">Weekly (7-Day Cycle)</option>
                    <option value="bi-weekly">Bi-Weekly (14-Day Cycle)</option>
                    <option value="tri-weekly">
                      Tri-Weekly (21-Day Cycle)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cycle Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Cycle End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">
                    Assign Single Guard Throughout
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Automatically attaches one guard to all generated periods.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useSingleGuard}
                  onChange={(e) => setUseSingleGuard(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {useSingleGuard && (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Select Single Guard
                  </label>
                  <select
                    value={singleGuardId}
                    onChange={(e) => setSingleGuardId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="">-- Choose Guard --</option>
                    {guards.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Shift Periods Sequence */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Shift Periods Sequence ({recurringPeriods.length} Shifts)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      addRecurringPeriod();
                      updateDailyEndDate();
                    }}
                    className="px-3 py-1 bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700"
                  >
                    <Plus size={12} /> Add Period Slot
                  </button>
                </div>

                {recurringPeriods.map((period, idx) => {
                  const prevPeriod = recurringPeriods[idx - 1];
                  const firstPeriod = recurringPeriods[0];
                  const isLastPeriod = idx === recurringPeriods.length - 1;

                  // 1. Check Sequential Overlap (Current Shift vs Previous Shift)
                  let hasSequentialOverlap = false;
                  if (prevPeriod) {
                    const [pEndH, pEndM] = prevPeriod.endTime
                      .split(":")
                      .map(Number);
                    const [cStartH, cStartM] = period.startTime
                      .split(":")
                      .map(Number);

                    const prevEndAbs =
                      prevPeriod.endTimeDayOffset * 1440 + (pEndH * 60 + pEndM);
                    const currStartAbs =
                      period.startTimeDayOffset * 1440 +
                      (cStartH * 60 + cStartM);

                    hasSequentialOverlap = currStartAbs < prevEndAbs;
                  }

                  let hasRolloverOverlap = false;
                  if (
                    isLastPeriod &&
                    firstPeriod &&
                    recurringPeriods.length > 1
                  ) {
                    const totalCycleDays =
                      maxDays > 0
                        ? maxDays
                        : period.endTimeDayOffset -
                          firstPeriod.startTimeDayOffset;

                    const [currEndH, currEndM] = period.endTime
                      .split(":")
                      .map(Number);
                    const [firstStartH, firstStartM] = firstPeriod.startTime
                      .split(":")
                      .map(Number);

                    const currEndNormalized =
                      (period.endTimeDayOffset - totalCycleDays) * 1440 +
                      (currEndH * 60 + currEndM);
                    const firstStartNormalized =
                      firstPeriod.startTimeDayOffset * 1440 +
                      (firstStartH * 60 + firstStartM);

                    hasRolloverOverlap =
                      currEndNormalized > firstStartNormalized;
                  }

                  const hasOverlap = hasSequentialOverlap || hasRolloverOverlap;

                  const isOvernight =
                    period.startTime >= period.endTime &&
                    period.endTime !== "00:00";

                  return (
                    <div
                      key={period.id || idx}
                      className={`p-3 rounded-xl border space-y-2 relative transition-colors ${
                        hasOverlap
                          ? "bg-rose-50/50 border-rose-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          placeholder="Period Label"
                          value={period.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecurringPeriods((prev) =>
                              prev.map((p, i) =>
                                i === idx ? { ...p, label: val } : p,
                              ),
                            );
                          }}
                          className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteRecurringPeriod(period.id || `${idx}`)
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={period.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecurringPeriods((prev) =>
                                prev.map((p, i) => {
                                  if (i !== idx) return p;
                                  const checkOvernight =
                                    val >= p.endTime && p.endTime !== "00:00";
                                  return {
                                    ...p,
                                    startTime: val,
                                    endTimeDayOffset: checkOvernight
                                      ? p.startTimeDayOffset + 1
                                      : p.startTimeDayOffset,
                                  };
                                }),
                              );
                            }}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">
                            End Time
                          </label>
                          <input
                            type="time"
                            value={period.endTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setRecurringPeriods((prev) =>
                                prev.map((p, i) => {
                                  if (i !== idx) return p;
                                  const checkOvernight =
                                    p.startTime >= val && val !== "00:00";
                                  return {
                                    ...p,
                                    endTime: val,
                                    endTimeDayOffset: checkOvernight
                                      ? p.startTimeDayOffset + 1
                                      : p.startTimeDayOffset,
                                  };
                                }),
                              );
                            }}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">
                            Start Day Number
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={cadence !== "daily" ? maxDays : undefined}
                            value={(period.startTimeDayOffset ?? 0) + 1}
                            onChange={(e) => {
                              const rawUserVal =
                                parseInt(e.target.value, 10) || 1;
                              const internalOffset = Math.max(
                                0,
                                rawUserVal - 1,
                              );

                              setRecurringPeriods((prev) =>
                                prev.map((p, i) => {
                                  if (i !== idx) return p;
                                  const checkOvernight =
                                    p.startTime >= p.endTime &&
                                    p.endTime !== "00:00";
                                  return {
                                    ...p,
                                    startTimeDayOffset: internalOffset,
                                    endTimeDayOffset: checkOvernight
                                      ? internalOffset + 1
                                      : internalOffset,
                                  };
                                }),
                              );
                            }}
                            className="w-full mt-0.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase text-slate-400">
                            End Day Number
                          </label>
                          <input
                            type="number"
                            readOnly
                            /* Shows Day 1 visually if offset equals maxDays (Day 8 internal offset = 7) */
                            value={
                              maxDays > 0 && period.endTimeDayOffset >= maxDays
                                ? 1
                                : (period.endTimeDayOffset ?? 0) + 1
                            }
                            className="w-full mt-0.5 px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Validation Warnings */}
                      {hasSequentialOverlap && (
                        <p className="text-[10px] text-rose-600 font-bold">
                          ⚠️ Shift overlaps with the previous shift.
                        </p>
                      )}

                      {hasRolloverOverlap && (
                        <p className="text-[10px] text-rose-600 font-bold">
                          ⚠️ Shift ends at {period.endTime} on Day 1 of the next
                          cycle, overlapping with Shift 1 starting at{" "}
                          {firstPeriod?.startTime}.
                        </p>
                      )}

                      {isOvernight && !hasOverlap && (
                        <p className="text-[10px] text-purple-600 font-bold">
                          🌙 Overnight Shift (Ends on Day{" "}
                          {period.endTimeDayOffset >= maxDays
                            ? 1
                            : period.endTimeDayOffset + 1}{" "}
                          {period.endTimeDayOffset >= maxDays
                            ? "of Next Cycle"
                            : ""}
                          )
                        </p>
                      )}

                      {/* Guard Selection Dropdown Component */}
                      {!useSingleGuard && (
                        <RecurringGuardDropdown
                          guards={guards}
                          period={period}
                          periodIdx={idx}
                          setRecurringPeriods={setRecurringPeriods}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Form Controls */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsModalOpen(false);
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
            >
              Save Schedule
            </button>
          </div>

          <div ref={recurringbottomRef} className="h-4 w-full" />
        </form>
      ) : (
        /* MODE 2: SCHEDULES LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {schedules.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
              <Calendar className="mx-auto text-slate-300" size={40} />
              <p className="text-sm font-semibold text-slate-500">
                No security schedules found
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Get started by creating a new specific date or recurring shift
                roster for your security staff.
              </p>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white border border-slate-200/80 hover:border-slate-300 p-5 rounded-2xl shadow-2xs flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-montserrat font-bold text-slate-800 text-sm">
                      {schedule.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md ${
                        schedule.mode === "specific"
                          ? "bg-purple-50 text-purple-600 border border-purple-100"
                          : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      }`}
                    >
                      {schedule.mode}
                    </span>
                  </div>

                  {schedule.mode === "specific" ? (
                    <p className="text-xs text-slate-500 font-medium">
                      📅 {schedule.specificDateGroups?.length || 0} Date
                      Group(s) configured
                    </p>
                  ) : (
                    <div className="text-xs text-slate-500 space-y-1 font-medium">
                      <p>
                        🔄 Cadence:{" "}
                        <span className="capitalize font-semibold text-slate-700">
                          {schedule.recurringCadence}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {schedule.startDate} → {schedule.endDate}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onViewCalendar(schedule)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    <Eye size={14} /> View Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// TAB 2: INTERACTIVE CALENDAR & GUARD SWAPPER
// ==========================================

export function InteractiveCalendarTab({
  selectedSchedule: initialSchedule,
  onBack,
}: InteractiveCalendarTabProps) {
  const { contextEstateId } = useUser();
  const [guards, setGuards] = useState<SecurityUser[]>([]);

  // Internal state for managing view/edit modes and active schedule data
  const [schedule, setSchedule] = useState<ScheduleDefinition | null>(
    initialSchedule,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editingSlot, setEditingSlot] = useState<{
    dateStr: string;
    periodId: string;
    currentGuardIds: string[];
  } | null>(null);

  // Sync state if prop changes externally
  useEffect(() => {
    setSchedule(initialSchedule);
  }, [initialSchedule]);

  useEffect(() => {
    if (!contextEstateId) return;
    securityDb
      .getAllSecurity(contextEstateId)
      .then(setGuards)
      .catch(console.error);
  }, [contextEstateId]);

  const handleDelete = async () => {
    if (!schedule || !contextEstateId) return;
    if (!confirm(`Are you sure you want to delete "${schedule.name}"?`)) return;

    try {
      const res = await securityDb.deleteSchedule(contextEstateId, schedule.id);
      if (res?.success) {
        toast.success("Schedule deleted successfully");
        if (onBack) onBack();
      } else {
        toast.error("Failed to delete schedule");
      }
    } catch (err) {
      toast.error("Failed to delete schedule");
    }
  };

  const handleSaveInternalEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule || !contextEstateId) return;

    try {
      // Update local storage/database directly
      await securityDb.updateSchedule(schedule.id, contextEstateId!, schedule);
      toast.success("Schedule updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  if (!schedule) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-4 shadow-2xs">
        <CalendarIcon size={32} className="mx-auto text-slate-300" />
        <h4 className="font-montserrat font-black text-slate-700">
          No Schedule Selected
        </h4>
        <p className="text-xs text-slate-400">
          Select a schedule from the roster list to view its spread and details.
        </p>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  // Extract all distinct guards attached to this schedule
  const allAttachedGuardIds = Array.from(
    new Set(
      schedule.mode === "specific"
        ? schedule.specificDateGroups?.flatMap((g) =>
            g.periods.flatMap((p) => p.assignedGuardIds),
          ) || []
        : schedule.recurringPeriods?.flatMap((p) => p.assignedGuardIds) || [],
    ),
  );

  return (
    <div className="space-y-6">
      {/* TOP NAVIGATION BAR */}
      <div className="flex items-center justify-between">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-montserrat font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>

      {/* INTERNAL EDIT MODE FORM */}
      {isEditing ? (
        <form
          onSubmit={handleSaveInternalEdit}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-montserrat font-black text-slate-800 text-base uppercase">
              Edit Schedule Details
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Schedule Title
            </label>
            <input
              type="text"
              value={schedule.name}
              onChange={(e) =>
                setSchedule({ ...schedule, name: e.target.value })
              }
              className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-slate-100 text-slate-600 font-montserrat font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 text-white font-montserrat font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-blue-700"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY DISPLAY MODE */
        <>
          {/* HEADER CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  {schedule.mode === "specific"
                    ? "Specific Dates"
                    : "Recurring Cycle"}
                </span>
                <h3 className="font-montserrat font-black text-slate-800 text-xl mt-1">
                  {schedule.name}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Clock size={12} />
                  {schedule.mode === "recurring"
                    ? `${schedule.startDate} to ${schedule.endDate}`
                    : `${schedule.specificDateGroups?.length || 0} scheduled day(s)`}
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-600 font-bold text-xs rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            {/* ATTACHED GUARDS SUMMARY */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Users size={12} /> Attached Guards (
                {allAttachedGuardIds.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allAttachedGuardIds.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    No guards assigned to this roster
                  </span>
                ) : (
                  allAttachedGuardIds.map((gId) => {
                    const guard = guards.find((g) => g.id === gId);
                    return (
                      <span
                        key={gId}
                        className="text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-lg"
                      >
                        👤 {guard ? guard.name : "Unknown Guard"}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* CALENDAR DISPLAY SPREAD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-6">
            <h4 className="font-montserrat font-black text-xs uppercase tracking-widest text-slate-400">
              Shift Spread & On-Call Personnel
            </h4>

            {schedule.mode === "specific" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schedule.specificDateGroups?.map((group) => (
                  <div
                    key={group.date}
                    className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <span className="font-montserrat font-black text-xs text-slate-800">
                        🗓️ {group.date}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {group.periods.length} Shift Period(s)
                      </span>
                    </div>

                    {group.periods.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white rounded-xl border border-slate-100 space-y-2 shadow-2xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">
                            {p.label || "Shift"} ({p.startTime} - {p.endTime})
                          </span>
                          <button
                            onClick={() =>
                              setEditingSlot({
                                dateStr: group.date,
                                periodId: p.id,
                                currentGuardIds: p.assignedGuardIds,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {p.assignedGuardIds.length === 0 ? (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <UserX size={10} /> No Guard Assigned
                            </span>
                          ) : (
                            p.assignedGuardIds.map((gId) => {
                              const guard = guards.find((g) => g.id === gId);
                              return (
                                <span
                                  key={gId}
                                  className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-100"
                                >
                                  👤 {guard ? guard.name : "Guard"}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {schedule.mode === "recurring" && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <p className="text-xs font-bold text-slate-700">
                  Recurring Pattern Active between {schedule.startDate} and{" "}
                  {schedule.endDate}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {schedule.recurringPeriods?.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white rounded-xl border border-slate-200"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-800">
                          {p.label} ({p.startTime} - {p.endTime})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {schedule.useSingleGuardThroughout ? (
                          <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                            Single Guard Locked
                          </span>
                        ) : p.assignedGuardIds.length === 0 ? (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                            Unassigned Cycle Slot
                          </span>
                        ) : (
                          p.assignedGuardIds.map((gId) => {
                            const guard = guards.find((g) => g.id === gId);
                            return (
                              <span
                                key={gId}
                                className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                              >
                                👤 {guard?.name}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* QUICK GUARD REASSIGNMENT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-montserrat font-black text-sm text-slate-800 uppercase">
                Swap Guard / Edit Shift Position
              </h4>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Update guard assignments for shift slot on{" "}
              <strong className="text-slate-800">{editingSlot.dateStr}</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {guards.map((g) => {
                const isSelected = editingSlot.currentGuardIds.includes(g.id);
                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      const updatedIds = isSelected
                        ? editingSlot.currentGuardIds.filter(
                            (id) => id !== g.id,
                          )
                        : [...editingSlot.currentGuardIds, g.id];
                      setEditingSlot({
                        ...editingSlot,
                        currentGuardIds: updatedIds,
                      });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-100 text-slate-500"
                    }`}
                  >
                    <span>{g.name}</span>
                    {isSelected && (
                      <CheckCircle2 size={14} className="text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setEditingSlot(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown Checkbox List Component
