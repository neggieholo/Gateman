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
  Loader,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";
import { v4 as uuidv4 } from "uuid";
import {
  DateShiftGroup,
  FetchedSecuritySchedule,
  FetchSchedulesResponse,
  RecurringCadence,
  ScheduleDefinition,
  ScheduleGuard,
  ScheduleMode,
  SecurityUser,
  ShiftPeriod,
} from "../services/types";
import { securityDb } from "../services/database";
import { showAccessDeniedToast } from "./Users";
import {
  GuardAssignmentDropdown,
  RecurringGuardDropdown,
  UnifiedGuardComboDropdown,
} from "./ScheduleGuardSelect";
import { formatDate, getShiftEndDateLabel } from "../services/apis";
import SecurityScheduleDetailView from "./SecurityScheduleDetailView";
import { DeletePromptModal } from "./DeletePromptModal";
import { DAY_NAMES } from "../services/data";

export default function SecuritySchedulesPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "calendar">("builder");
  const [schedules, setSchedules] = useState<FetchedSecuritySchedule[]>([]);
  const [scheduleGuards, setScheduleGuards] = useState<ScheduleGuard[]>([]);
  const [fetchingSchedules, setFetchingSchedues] = useState(false);
  const [selectedScheduleForCalendar, setSelectedScheduleForCalendar] =
    useState<FetchedSecuritySchedule | null>(null);
  const { user, contextEstateId } = useUser();
  const canView =
    user?.permissions?.includes("security_management") ||
    user?.permissions?.includes("view_security_schedules") ||
    user?.permissions?.includes("all-access");

  const fetchSchedules = useCallback(async () => {
    if (!contextEstateId) return;

    try {
      setFetchingSchedues(true);
      const res: FetchSchedulesResponse =
        await securityDb.getSchedules(contextEstateId);
      if (res.success) {
        const schedules: FetchedSecuritySchedule[] = res.schedules;
        const scheduleGuards: ScheduleGuard[] = res.guardList;
        setSchedules(schedules);
        setScheduleGuards(scheduleGuards);

        if (activeTab === "calendar") {
          setSelectedScheduleForCalendar((prevSelected) => {
            if (!prevSelected) return null;
            return schedules.find((s) => s.id === prevSelected.id) || null;
          });
        }
      }
    } catch (err) {
      toast.error("Failed to load schedules");
    } finally {
      setFetchingSchedues(false);
    }
  }, [contextEstateId, activeTab]);

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
        <SecurityScheduleDetailView
          selectedSchedule={selectedScheduleForCalendar}
          guards={scheduleGuards}
          onSuccess={fetchSchedules}
          onBack={() => {
            setActiveTab("builder");
            setSelectedScheduleForCalendar(null);
          }}
          loading={fetchingSchedules}
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
  schedules: FetchedSecuritySchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<FetchedSecuritySchedule[]>>;
  onViewCalendar: (sch: FetchedSecuritySchedule) => void;
}) {
  const { user, contextEstateId } = useUser();
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [presetShiftType, setPresetShiftType] = useState<
    "day" | "night" | "standard"
  >("standard");
  const [dayPresetStart, setDayPresetStart] = useState("");
  const [dayPresetEnd, setDayPresetEnd] = useState("");

  // Night Shift preset state
  const [nightPresetStart, setNightPresetStart] = useState("");
  const [nightPresetEnd, setNightPresetEnd] = useState("");

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
  const [useUnifiedGuardCombo, setUseUnifiedGuardCombo] = useState(false);
  const [unifiedGuardIds, setUnifiedGuardIds] = useState<string[]>([]);
  const [recurringPeriods, setRecurringPeriods] = useState<ShiftPeriod[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const recurringbottomRef = useRef(null as HTMLDivElement | null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  const canAdd =
    user?.permissions?.includes("security_management") ||
    user?.permissions?.includes("add_security_schedule") ||
    user?.permissions?.includes("all-access");

  const canDelete =
    user?.permissions?.includes("security_management") ||
    user?.permissions?.includes("delete_security_schedule") ||
    user?.permissions?.includes("all-access");

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

  const createPeriodsFromSelectedDays = (
    dayOffsets: number[],
  ): ShiftPeriod[] => {
    return dayOffsets
      .sort((a, b) => a - b) // Keep them in chronological order
      .map((offset) => ({
        id: uuidv4(),
        label: `${DAY_NAMES[offset]} Shift`,
        startTime: "08:00",
        endTime: "16:00",
        startTimeDayOffset: offset,
        endTimeDayOffset: offset,
        assignedGuardIds: [],
      }));
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
      label: `Day ${i + 1} Shift`,
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
    if (newCadence === "weekday") {
      setIsDayPickerOpen(true);
    } else {
      if (startDate) {
        setEndDate(calculateEndDateForCadence(startDate, newCadence));
      }
      setRecurringPeriods(createInitialPeriodsForCadence(newCadence));
    }
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

    if (presetShiftType === "day") {
      newStartTime = dayPresetStart;
      newEndTime = dayPresetEnd;
    } else if (presetShiftType === "night") {
      newStartTime = nightPresetStart;
      newEndTime = nightPresetEnd;
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
            ? `Day ${prev.length + 1} Shift`
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

  const handleDeleteSchedule = async () => {
    if (!deleteId || !contextEstateId) return;

    if (!canDelete) {
      showAccessDeniedToast();
      return;
    }

    try {
      setIsDeleting(true);
      const res = await securityDb.deleteSchedule(deleteId, contextEstateId!);
      if (res?.success) {
        toast.success("Schedule deleted successfully");
        setSchedules(schedules.filter((s) => s.id !== deleteId));
      } else {
        toast.error("Failed to delete schedule");
      }
    } catch (err) {
      toast.error("Failed to delete schedule");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
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

    if (!canAdd) {
      showAccessDeniedToast();
      return;
    }

    if (!scheduleName) return toast.error("Schedule title is required");

    setIsSaving(true);

    try {
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
                : (prev.endTimeDayOffset ?? prev.startTimeDayOffset ?? 0) *
                    1440 +
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
          const [currStartH, currStartM] = curr.startTime
            .split(":")
            .map(Number);

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

          const isSundayMondayWrap =
            cadence === "weekday" &&
            first.startTimeDayOffset === 0 &&
            last.startTimeDayOffset === 6;

          // Determine if the final shift extends past midnight
          const isLastOvernight =
            last.endTimeDayOffset > last.startTimeDayOffset ||
            (last.startTime >= last.endTime && last.endTime !== "00:00") ||
            last.endTime === "00:00";

          // Only check rollover boundary overlaps if it's applicable and the last shift is overnight
          if (
            (cadence !== "weekday" || isSundayMondayWrap) &&
            isLastOvernight
          ) {
            const [firstStartH, firstStartM] = first.startTime
              .split(":")
              .map(Number);
            const [lastEndH, lastEndM] = last.endTime.split(":").map(Number);

            const totalCycleDays =
              maxDays > 0
                ? maxDays
                : last.endTimeDayOffset - first.startTimeDayOffset;

            const firstStartAbs =
              first.startTimeDayOffset * 1440 +
              (firstStartH * 60 + firstStartM);
            const lastEndAbs =
              (last.endTimeDayOffset - totalCycleDays) * 1440 +
              (lastEndH * 60 + lastEndM);

            if (lastEndAbs > firstStartAbs) {
              return toast.error(
                `Cycle Rollover Overlap: Shift "${last.label}" ends at ${last.endTime}, which overlaps with Shift "${first.label}" starting at ${first.startTime} in the next repeating cycle.`,
              );
            }
          }
        }

        const maxOffset = Math.max(
          ...recurringPeriods.map(
            (p) => p.endTimeDayOffset ?? p.startTimeDayOffset ?? 0,
          ),
        );
        const requiredDays = Math.max(1, maxOffset + 1);

        const [startY, startM, startD] = startDate.split("-").map(Number);
        const minRequiredEndDate = new Date(
          Date.UTC(startY, startM - 1, startD),
        );
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

      if (useUnifiedGuardCombo && unifiedGuardIds.length === 0) {
        return toast.error("Please select guards for the unified allocation.");
      }

      // Map unified guard combo to all periods if checkbox is checked
      const finalRecurringPeriods =
        mode === "recurring"
          ? recurringPeriods.map((period) => ({
              ...period,
              assignedGuardIds: useUnifiedGuardCombo
                ? unifiedGuardIds
                : period.assignedGuardIds || [],
            }))
          : [];

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
              recurringPeriods: finalRecurringPeriods,
            }),
      };

      const res = await securityDb.createSecuritySchedule(
        contextEstateId!,
        newSchedule,
      );

      if (res.success) {
        setSchedules([...schedules, res.schedule]);
        setIsModalOpen(false);
        resetForm();
        toast.success("Schedule created successfully!");
      } else {
        toast.error(
          res.message || "Failed to create schedule. Please try again.",
        );
      }
    } catch (error: any) {
      console.error("Error creating security schedule:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "An unexpected error occurred while saving.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDayPreset = () => {
    if (presetShiftType === "day") {
      setPresetShiftType("standard");
      return;
    }
    if (!dayPresetStart || !dayPresetEnd) {
      return toast.error(
        "Please set both Start and End times for Day Shift preset before selecting it.",
        {
          id: "day_preset_error",
        },
      );
    }
    setPresetShiftType("day");
  };

  const handleToggleNightPreset = () => {
    if (presetShiftType === "night") {
      setPresetShiftType("standard");
      return;
    }
    if (!nightPresetStart || !nightPresetEnd) {
      return toast.error(
        "Please set both Start and End times for Night Shift preset before selecting it.",
        {
          id: "night_preset_error",
        },
      );
    }
    setPresetShiftType("night");
  };

  const resetForm = () => {
    setScheduleName("");
    setSelectedDays([]);

    // Specific Dates State
    setSpecificGroups([]);
    setDateInput("");

    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setUseUnifiedGuardCombo(false);
    setUnifiedGuardIds([]);
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
            <div className="w-full justify-between flex">
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
              {cadence === "weekday" && (
                <button
                  type="button"
                  onClick={() => setIsDayPickerOpen(true)}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                >
                  Edit Selected Days ({selectedDays.length} active)
                </button>
              )}
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
                            🗓️ {formatDate(group.date)}
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
                                <div className="flex flex-col gap-1">
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
                                  {period.endTimeDayOffset >
                                    period.startTimeDayOffset && (
                                    <span className="text-[10px] font-bold text-indigo-600">
                                      Ends:{" "}
                                      {getShiftEndDateLabel(
                                        startDate,
                                        period.endTimeDayOffset,
                                      )}
                                    </span>
                                  )}
                                </div>
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
                    <option value="weekday">Day of Week</option>
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
                    Assign Single Combo Throughout
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Automatically attaches one guard to all generated periods.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={useUnifiedGuardCombo}
                  onChange={(e) => setUseUnifiedGuardCombo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {useUnifiedGuardCombo && (
                <UnifiedGuardComboDropdown
                  guards={guards}
                  selectedGuardIds={unifiedGuardIds}
                  onChange={setUnifiedGuardIds}
                />
              )}

              {/* Shift Periods Sequence */}
              <div className="space-y-3 pt-2">
                <div className="sticky top-0 z-10 bg-slate-50 py-2 backdrop-blur-xs flex justify-between items-center border-b border-slate-200/60">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Shift Periods Sequence ({recurringPeriods.length} Shifts)
                  </label>
                  {cadence !== "weekday" && (
                    <div className="flex flex-wrap items-center gap-3">
                      {cadence === "daily" && (
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Set Preset Time (Optional)
                          </label>
                          {/* Day Shift Preset Box */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                            <input
                              type="checkbox"
                              checked={presetShiftType === "day"}
                              onChange={handleToggleDayPreset}
                              className="w-3.5 h-3.5 text-amber-500 rounded focus:ring-amber-400 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-600">
                              Day:
                            </span>
                            <input
                              type="time"
                              value={dayPresetStart}
                              onChange={(e) =>
                                setDayPresetStart(e.target.value)
                              }
                              className="px-1 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md"
                            />
                            <span className="text-[10px] text-slate-400">
                              -
                            </span>
                            <input
                              type="time"
                              value={dayPresetEnd}
                              onChange={(e) => setDayPresetEnd(e.target.value)}
                              className="px-1 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md"
                            />
                          </div>

                          {/* Night Shift Preset Box */}
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                            <input
                              type="checkbox"
                              checked={presetShiftType === "night"}
                              onChange={handleToggleNightPreset}
                              className="w-3.5 h-3.5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-slate-600">
                              Night:
                            </span>
                            <input
                              type="time"
                              value={nightPresetStart}
                              onChange={(e) =>
                                setNightPresetStart(e.target.value)
                              }
                              className="px-1 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md"
                            />
                            <span className="text-[10px] text-slate-400">
                              -
                            </span>
                            <input
                              type="time"
                              value={nightPresetEnd}
                              onChange={(e) =>
                                setNightPresetEnd(e.target.value)
                              }
                              className="px-1 py-0.5 text-[10px] bg-slate-50 border border-slate-200 rounded-md"
                            />
                          </div>
                        </div>
                      )}

                      {/* Add Period Slot Button */}
                      <button
                        type="button"
                        onClick={() => {
                          addRecurringPeriod();
                          updateDailyEndDate();
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-slate-700 shadow-xs"
                      >
                        <Plus size={12} /> Add Period Slot
                      </button>
                    </div>
                  )}
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

                  const isOvernight =
                    period.startTime >= period.endTime &&
                    period.endTime !== "00:00";

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

                    const isSundayMondayWrap =
                      cadence === "weekday" &&
                      firstPeriod.startTimeDayOffset === 0 &&
                      period.startTimeDayOffset === 6;

                    if (cadence === "weekday") {
                      hasRolloverOverlap =
                        currEndNormalized > firstStartNormalized &&
                        isSundayMondayWrap &&
                        isOvernight;
                    } else {
                      hasRolloverOverlap =
                        currEndNormalized > firstStartNormalized && isOvernight;
                    }
                  }

                  const hasOverlap = hasSequentialOverlap || hasRolloverOverlap;

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
                            max={
                              cadence !== "daily" && cadence !== "weekday"
                                ? maxDays || 7
                                : undefined
                            }
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
                      {!useUnifiedGuardCombo && (
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
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-all cursor-pointer shadow-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                "Save Schedule"
              )}
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
                    <>
                      <p className="text-xs text-slate-500 font-medium">
                        📅 {schedule.specific_date_groups?.length || 0} Date
                        Group(s) configured
                      </p>
                      {schedule.specific_date_groups?.[0]?.date && (
                        <p className="text-[11px] text-slate-400">
                          Starts: {schedule.specific_date_groups[0].date}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-xs text-slate-500 space-y-1 font-medium">
                      <p>
                        🔄 Cadence:{" "}
                        <span className="capitalize font-semibold text-slate-700">
                          {schedule.recurring_cadence}
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(schedule.start_date)} →{" "}
                        {formatDate(schedule.end_date)}
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
                    onClick={() => setDeleteId(schedule.id)}
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

      <DeletePromptModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => handleDeleteSchedule()}
        loading={isDeleting}
        title="Delete this Schedule?"
        message="This will permanently remove this schedule and all related shifts."
      />

      {isDayPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Select Recurrence Days
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Choose which days of the week this shift schedule applies to.
              </p>
            </div>

            {/* DAY CHECKBOXES / TOGGLES */}
            <div className="grid grid-cols-2 gap-2">
              {DAY_NAMES.map((dayName, index) => {
                const isSelected = selectedDays.includes(index);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => {
                      setSelectedDays((prev) =>
                        isSelected
                          ? prev.filter((d) => d !== index)
                          : [...prev, index],
                      );
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{dayName}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {isSelected && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDayPickerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedDays.length === 0}
                onClick={() => {
                  setRecurringPeriods(
                    createPeriodsFromSelectedDays(selectedDays),
                  );
                  setIsDayPickerOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm"
              >
                Confirm ({selectedDays.length} Days)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
