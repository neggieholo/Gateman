/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Edit2,
  Trash2,
  Users,
  ArrowLeft,
  X,
  Save,
  CheckCircle2,
  UserX,
  Eye,
  Grid,
} from "lucide-react";
import {
  FetchedSecuritySchedule,
  ProjectionShift,
  ScheduleGuard,
} from "../services/types";
import { useUser } from "../UserContext";
import { securityDb } from "../services/database";
import toast from "react-hot-toast";
import { formatUtcDate } from "../services/apis";

interface InteractiveCalendarTabProps {
  selectedSchedule: FetchedSecuritySchedule | null;
  guards: ScheduleGuard[];
  onBack?: () => void;
}

export default function SecurityScheduleDetailView({
  selectedSchedule: initialSchedule,
  guards: initialGuards,
  onBack,
}: InteractiveCalendarTabProps) {
  const { contextEstateId } = useUser();
  const [guards, setGuards] = useState<ScheduleGuard[] | null>(null);
  const [schedule, setSchedule] = useState<FetchedSecuritySchedule | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<"details" | "projection">("details");
  const [newEndDate, setNewEndDate] = useState("");
  const [newScheduleName, setNewScheduleName] = useState("");

  const [editingSlot, setEditingSlot] = useState<{
    dateStr: string;
    periodId: string;
    currentGuardIds: string[];
  } | null>(null);

  useEffect(() => {
    setSchedule(initialSchedule);
    setGuards(initialGuards || null);
  }, [initialSchedule, initialGuards]);

  const guardList = guards || [];

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
      await securityDb.updateSchedule(schedule.id, contextEstateId, {
        new_name: newScheduleName,
        new_end_date: newEndDate,
      });
      toast.success("Schedule updated successfully");
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  // Save modified guard assignments for a specific slot/period
  const handleSaveSlotReassignment = async (updatedGuardIds: string[]) => {
    if (!schedule || !contextEstateId || !editingSlot) return;

    try {
      const response = await securityDb.assignSlotGuard({
        scheduleId: schedule.id,
        estate_id: contextEstateId,
        periodId: editingSlot.periodId,
        assignedGuardIds: updatedGuardIds,
        dateStr: editingSlot.dateStr,
      });

      if (response.success) {
        setSchedule((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            specific_date_groups:
              response.specific_date_groups ?? prev.specific_date_groups,
            recurring_periods:
              response.recurring_periods ?? prev.recurring_periods,
            projection: response.projection ?? prev.projection,
          };
        });

        toast.success("Guard assignment updated");
      }
    } catch (err) {
      toast.error("Failed to update guard assignment");
    } finally {
      setEditingSlot(null);
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
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const allAttachedGuardIds = !schedule.use_single_guard_throughout
    ? Array.from(
        new Set(
          schedule.mode === "specific"
            ? schedule.specific_date_groups?.flatMap((g) =>
                g.periods.flatMap((p) => p.assignedGuardIds),
              ) || []
            : schedule.recurring_periods?.flatMap((p) => p.assignedGuardIds) ||
                [],
        ),
      )
    : schedule.single_guard_id
      ? [schedule.single_guard_id]
      : [];

  return (
    <div className="space-y-6 pb-12">
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

        {schedule.mode === "recurring" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("details")}
              className={`flex items-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
                viewMode === "details"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Grid size={14} /> Roster Details
            </button>
            <button
              onClick={() => setViewMode("projection")}
              className={`flex items-center gap-1.5 px-3 py-2 font-bold text-xs rounded-xl cursor-pointer transition-all ${
                viewMode === "projection"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Eye size={14} /> Calendar Projection
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* EDIT FORM MODE */
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

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Schedule Title
              </label>
              <input
                type="text"
                value={newScheduleName || ""}
                onChange={(e) => setNewScheduleName(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white"
              />
            </div>

            {schedule.mode === "recurring" && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  End Date
                </label>
                <input
                  type="date"
                  value={newEndDate || ""}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:bg-white"
                />
              </div>
            )}
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
        <>
          {/* HEADER SUMMARY CARD */}
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
                    ? `${formatUtcDate(schedule.start_date)} to ${formatUtcDate(schedule.end_date) || "Ongoing"}`
                    : `Start Date: ${formatUtcDate(schedule.specific_date_groups?.[0]?.date) || "N/A"}`}
                </p>
              </div>

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
            <div className="space-y-1.5 w-full max-w-full overflow-hidden">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Users size={12} /> Assigned Guards (
                {allAttachedGuardIds.length})
              </span>

              {/* Horizontal scrolling container */}
              <div className="flex flex-nowrap gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {allAttachedGuardIds.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">
                    No guards assigned to this roster
                  </span>
                ) : (
                  allAttachedGuardIds.map((gId) => {
                    const guard = guardList.find((g) => g.id === gId);
                    return (
                      <span
                        key={gId}
                        className="text-xs font-bold bg-slate-50 text-slate-700 border border-slate-200/60 px-2.5 py-1 rounded-lg shrink-0"
                      >
                        👤 {guard ? guard.name : "Unknown Guard"}
                      </span>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* VIEW MODE: DETAILED ROSTER SPREAD */}
          {viewMode === "details" && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-6">
              <h4 className="font-montserrat font-black text-xs uppercase tracking-widest text-slate-400">
                Shift Spread & On-Call Personnel
              </h4>

              {schedule.mode === "specific" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                    {schedule.specific_date_groups?.map((group) => {
                      const baseDate = new Date(group.date);

                      return (
                        <div
                          key={group.date}
                          className="p-3 bg-white rounded-xl border border-slate-200 space-y-3 shadow-2xs h-full flex flex-col justify-start"
                        >
                          {/* Header: Specific Date & Period Count */}
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <span className="font-montserrat font-black text-xs text-slate-800">
                              🗓️ {group.date}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {group.periods.length} Shift(s)
                            </span>
                          </div>

                          {/* List of Shift Periods under this date (Pins to top) */}
                          <div className="space-y-2 flex-1">
                            {group.periods.map((p) => {
                              // Shift dates based on day offsets relative to parent date
                              const startDateObj = new Date(baseDate);
                              startDateObj.setDate(
                                startDateObj.getDate() +
                                  (p.startTimeDayOffset || 0),
                              );
                              const startDateStr = startDateObj
                                .toISOString()
                                .split("T")[0];

                              const endDateObj = new Date(baseDate);
                              endDateObj.setDate(
                                endDateObj.getDate() +
                                  (p.endTimeDayOffset || 0),
                              );
                              const endDateStr = endDateObj
                                .toISOString()
                                .split("T")[0];

                              return (
                                <div
                                  key={p.id}
                                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      {/* Display offset range if shift spans beyond base date */}
                                      {(p.startTimeDayOffset !== 0 ||
                                        p.endTimeDayOffset !== 0) && (
                                        <span className="text-[9px] font-black uppercase text-blue-600 block tracking-wide">
                                          {startDateStr}{" "}
                                          {startDateStr !== endDateStr &&
                                            `➔ ${endDateStr}`}
                                        </span>
                                      )}
                                      <span className="text-xs font-bold text-slate-700">
                                        {p.label || "Shift"} ({p.startTime} -{" "}
                                        {p.endTime})
                                      </span>
                                    </div>

                                    <button
                                      onClick={() =>
                                        setEditingSlot({
                                          dateStr: group.date,
                                          periodId: p.id,
                                          currentGuardIds: p.assignedGuardIds,
                                        })
                                      }
                                      className="text-blue-600 hover:text-blue-800 cursor-pointer p-0.5"
                                    >
                                      <Edit2 size={12} />
                                    </button>
                                  </div>

                                  {/* Assigned Guards */}
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {schedule.use_single_guard_throughout ? (
                                      <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                                        👤{" "}
                                        {guardList.find(
                                          (g) =>
                                            g.id === schedule.single_guard_id,
                                        )?.name || "Assigned Guard"}
                                      </span>
                                    ) : p.assignedGuardIds?.length === 0 ? (
                                      <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                        <UserX size={10} /> Unassigned Slot
                                      </span>
                                    ) : (
                                      p.assignedGuardIds.map((gId) => {
                                        const guard = guardList.find(
                                          (g) => g.id === gId,
                                        );
                                        return (
                                          <span
                                            key={gId}
                                            className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                                          >
                                            👤 {guard ? guard.name : "Guard"}
                                          </span>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {schedule.mode === "recurring" && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {schedule.recurring_periods?.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 space-y-2"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">
                            {p.label} ({p.startTime} - {p.endTime})
                          </span>
                          <button
                            onClick={() =>
                              setEditingSlot({
                                dateStr: "Recurring Cycle",
                                periodId: p.id,
                                currentGuardIds: p.assignedGuardIds,
                              })
                            }
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {schedule.use_single_guard_throughout ? (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-md">
                              👤{" "}
                              {guardList.find(
                                (g) => g.id === schedule.single_guard_id,
                              )?.name || "Assigned Guard"}
                            </span>
                          ) : p.assignedGuardIds?.length === 0 ? (
                            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                              Unassigned Cycle Slot
                            </span>
                          ) : (
                            p.assignedGuardIds.map((gId) => {
                              const guard = guardList.find((g) => g.id === gId);
                              return (
                                <span
                                  key={gId}
                                  className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
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
                </div>
              )}
            </div>
          )}

          {/* VIEW MODE: CALENDAR PROJECTION */}
          {viewMode === "projection" && (
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-6">
              <h4 className="font-montserrat font-black text-xs uppercase tracking-widest text-slate-400">
                Scheduled Dates & Assigned Personnel Projection
              </h4>

              {(() => {
                const proj = schedule.projection;

                if (!proj) {
                  return (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs font-bold text-slate-400">
                        No projection data available for this schedule.
                      </p>
                    </div>
                  );
                }

                // Safely parse shift arrays in case backend sends stringified JSON
                const parseShifts = (
                  shiftsData: ProjectionShift[] | string | undefined,
                ): ProjectionShift[] => {
                  if (!shiftsData) return [];
                  if (typeof shiftsData === "string") {
                    try {
                      return JSON.parse(shiftsData);
                    } catch {
                      return [];
                    }
                  }
                  return shiftsData;
                };

                const currentShifts = parseShifts(proj.current_cycle_shifts);
                const nextShifts = parseShifts(proj.next_cycle_shifts);

                const renderShiftCard = (
                  shift: ProjectionShift,
                  index: number,
                ) => {
                  // Handle single guard override vs multi-guard array
                  const guardIds = schedule.use_single_guard_throughout
                    ? schedule.single_guard_id
                      ? [schedule.single_guard_id]
                      : []
                    : shift.assigned_guard_ids || [];

                  return (
                    <div
                      key={shift.period_id || index}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5"
                    >
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-slate-800">
                          🗓️ {shift.start_date}
                          {shift.start_date !== shift.end_date &&
                            ` ➔ ${shift.end_date}`}
                        </span>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {shift.label || "Shift"}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-slate-500">
                        ⏰ {shift.start_time} - {shift.end_time}
                      </p>

                      <div className="space-y-1 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">
                          Assigned Personnel:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {guardIds.length === 0 ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                              Unassigned
                            </span>
                          ) : (
                            guardIds.map((id) => {
                              const guard = guardList.find((g) => g.id === id);
                              return (
                                <span
                                  key={id}
                                  className="text-[10px] font-bold bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md"
                                >
                                  👤 {guard ? guard.name : "Guard"}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-8">
                    {/* CURRENT CYCLE */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h5 className="font-montserrat font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          Current Shift Cycle
                        </h5>
                        <span className="text-xs font-bold text-slate-500">
                          {formatUtcDate(proj.current_cycle_start_date)} to{" "}
                          {formatUtcDate(proj.current_cycle_end_date)}
                        </span>
                      </div>

                      {currentShifts.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">
                          No current cycle shifts generated.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {currentShifts.map((shift, idx) =>
                            renderShiftCard(shift, idx),
                          )}
                        </div>
                      )}
                    </div>

                    {/* NEXT CYCLE (Hidden for specific mode or empty next cycle) */}
                    {schedule.mode !== "specific" && nextShifts.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <h5 className="font-montserrat font-black text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Next Shift Cycle
                          </h5>
                          <span className="text-xs font-bold text-slate-500">
                            {formatUtcDate(proj.next_cycle_start_date) || "N/A"}{" "}
                            to{" "}
                            {formatUtcDate(proj.next_cycle_end_date) || "N/A"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {nextShifts.map((shift, idx) =>
                            renderShiftCard(shift, idx),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* GUARD REASSIGNMENT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl w-full max-w-md space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="font-montserrat font-black text-sm text-slate-800 uppercase">
                Reassign Guard Personnel
              </h4>
              <button
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Update guard assignments for slot on{" "}
              <strong className="text-slate-800">{editingSlot.dateStr}</strong>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {guardList.map((g) => {
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
                onClick={() =>
                  handleSaveSlotReassignment(editingSlot.currentGuardIds)
                }
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Done & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
