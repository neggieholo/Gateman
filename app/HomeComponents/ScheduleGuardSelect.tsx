/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { ShieldCheck, ChevronDown, X } from "lucide-react";

interface GuardAssignmentDropdownProps {
  guards: any[];
  period: any;
  groupIdx: number;
  periodIdx: number;
  setSpecificGroups: React.Dispatch<React.SetStateAction<any[]>>;
}

interface RecurringGuardDropdownProps {
  guards: Array<{ id: string; name: string }>;
  period: any;
  periodIdx: number;
  setRecurringPeriods: React.Dispatch<React.SetStateAction<any[]>>;
}

export const RecurringGuardDropdown: React.FC<RecurringGuardDropdownProps> = ({
  guards,
  period,
  periodIdx,
  setRecurringPeriods,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const assignedCount = period.assignedGuardIds?.length || 0;

  return (
    <div className="mt-2">
      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">
        Assigned Guards
      </p>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-blue-600" />
          {assignedCount === 0
            ? "Assign Guards..."
            : `${assignedCount} Guard${assignedCount > 1 ? "s" : ""} Assigned`}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Assign Guards (Shift {periodIdx + 1})
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Fixed Height with Scroll */}
            <div className="h-64 overflow-y-auto p-3 space-y-1">
              {guards.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No guards available
                </p>
              ) : (
                guards.map((g) => {
                  const isAssigned = period.assignedGuardIds?.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-medium text-slate-700 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => {
                          setRecurringPeriods((prev) =>
                            prev.map((p, i) => {
                              if (i !== periodIdx) return p;
                              const exists = p.assignedGuardIds?.includes(g.id);
                              return {
                                ...p,
                                assignedGuardIds: exists
                                  ? p.assignedGuardIds.filter(
                                      (id: string) => id !== g.id,
                                    )
                                  : [...(p.assignedGuardIds || []), g.id],
                              };
                            }),
                          );
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{g.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GuardAssignmentDropdown = ({
  guards,
  period,
  groupIdx,
  periodIdx,
  setSpecificGroups,
}: GuardAssignmentDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const assignedCount = period.assignedGuardIds.length;

  const toggleGuardAssignment = (guardId: string | number) => {
    setSpecificGroups((prev) =>
      prev.map((grp, gIdx) =>
        gIdx === groupIdx
          ? {
              ...grp,
              periods: grp.periods.map((p: any, pIdx: number) => {
                if (pIdx !== periodIdx) return p;
                const exists = p.assignedGuardIds.includes(guardId);
                return {
                  ...p,
                  assignedGuardIds: exists
                    ? p.assignedGuardIds.filter((id: any) => id !== guardId)
                    : [...p.assignedGuardIds, guardId],
                };
              }),
            }
          : grp,
      ),
    );
  };

  return (
    <div className="w-full">
      <p className="text-[9px] font-black uppercase text-slate-400 mb-1">
        Assigned Guards
      </p>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
      >
        <span className="truncate">
          {assignedCount === 0
            ? "Select guards..."
            : `${assignedCount} Guard${assignedCount > 1 ? "s" : ""} Selected`}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Assign Guards (Shift {periodIdx + 1})
              </h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body - Fixed Height with Scroll */}
            <div className="h-64 overflow-y-auto p-3 space-y-1">
              {guards.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">
                  No guards available
                </p>
              ) : (
                guards.map((g: any) => {
                  const isAssigned = period.assignedGuardIds.includes(g.id);
                  return (
                    <label
                      key={g.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer text-xs font-medium text-slate-700 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={() => toggleGuardAssignment(g.id)}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{g.name}</span>
                    </label>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
