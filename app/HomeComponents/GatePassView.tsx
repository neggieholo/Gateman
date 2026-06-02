/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { Invitation } from "../services/types";
import {
  fetchGatePasses,
  formatDate,
  formatTime,
  logActivityApi,
} from "../services/apis";
import {
  Calendar,
  Clock,
  User,
  Fingerprint,
  RefreshCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  LogIn,
  LogOut,
  Lock,
  Loader2,
  Briefcase,
} from "lucide-react";
import InvitationDetailModal from "./InvitationDetail";

export default function GatePassesView() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchGatePasses();
    setInvitations(data);
    setLoading(false);
  };

  useEffect(() => {
    const loadPassData = async () => {
      await loadData();
    };

    loadPassData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isPastTime = (endDate: string, endTime: string) => {
    const [hours, minutes] = endTime.split(":");
    const expiry = new Date(endDate);
    expiry.setHours(parseInt(hours), parseInt(minutes), 0);
    return new Date() > expiry;
  };

  const getMultiEntryStatus = (invite: Invitation) => {
    if (invite.is_cancelled) {
      return {
        label: "CANCELLED",
        container: "bg-rose-50 border border-rose-100",
        text: "text-rose-600",
      };
    }

    const now = new Date();
    const toLocalDateStr = (d: any): string => {
      if (!d) return "";
      return new Date(d).toLocaleDateString("en-CA");
    };

    const todayStr = toLocalDateStr(now);
    const checkinDateStr = toLocalDateStr(invite.actual_checkin_date);
    const checkoutDateStr = toLocalDateStr(invite.actual_checkout_date);

    const [startH, startM] = invite.start_time.split(":");
    const [endH, endM] = invite.end_time.split(":");

    const todayStart = new Date();
    todayStart.setHours(parseInt(startH), parseInt(startM), 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(parseInt(endH), parseInt(endM), 0, 0);

    const overallExpiry = new Date(invite.end_date);
    overallExpiry.setHours(parseInt(endH), parseInt(endM), 0);
    if (now > overallExpiry) {
      return {
        label: "EXPIRED",
        container: "bg-slate-50 border border-slate-200/60",
        text: "text-slate-400",
      };
    }

    if (invite.excluded_dates?.includes(todayStr)) {
      return {
        label: "NOT ALLOWED TODAY",
        container: "bg-amber-50 border border-amber-100",
        text: "text-amber-600",
      };
    }

    if (checkinDateStr && checkinDateStr < todayStr) {
      if (!checkoutDateStr || checkoutDateStr < checkinDateStr) {
        return {
          label: "OVERSTAYED (PAST)",
          container: "bg-red-50 border border-red-100",
          text: "text-red-600",
        };
      }
    }

    const isCheckedInToday = checkinDateStr === todayStr;
    const isCheckedOutToday = checkoutDateStr === todayStr;

    if (isCheckedInToday && !isCheckedOutToday) {
      if (now > todayEnd) {
        return {
          label: "OVERSTAYED TODAY",
          container: "bg-red-50 border border-red-100/80",
          text: "text-red-600",
        };
      }
      return {
        label: "INSIDE",
        container: "bg-emerald-50 border border-emerald-100",
        text: "text-emerald-600",
      };
    }

    if (isCheckedOutToday) {
      return {
        label: "DEPARTED TODAY",
        container: "bg-blue-50 border border-blue-100",
        text: "text-blue-600",
      };
    }

    if (!isCheckedInToday && now > todayEnd) {
      return {
        label: "EXPIRED TODAY",
        container: "bg-rose-50 border border-rose-100/50",
        text: "text-rose-500",
      };
    }

    const startDate = toLocalDateStr(invite.start_date);
    const endDate = toLocalDateStr(invite.end_date);

    if (startDate && endDate && todayStr >= startDate && todayStr <= endDate) {
      if (now < todayStart) {
        return {
          label: "NOT ARRIVED TODAY",
          container: "bg-slate-50 border border-slate-100",
          text: "text-slate-400",
        };
      }
      return {
        label: "READY FOR ENTRY",
        container: "bg-indigo-50 border border-indigo-100/80",
        text: "text-indigo-600",
      };
    }

    return {
      label: "UPCOMING",
      container: "bg-slate-50/50 border border-slate-100",
      text: "text-slate-400",
    };
  };

  const getStatusDetails = (
    status: string,
    isExpired: boolean,
    startDate: string,
    isCancelled: boolean,
    startTime: string,
  ) => {
    if (isCancelled) {
      return {
        label: "CANCELLED",
        container: "bg-rose-50 border border-rose-100",
        text: "text-rose-600",
      };
    }

    const now = new Date();
    const start = new Date(startDate);
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const startDay = new Date(start.setHours(0, 0, 0, 0));

    if (status === "pending" && today < startDay) {
      return {
        label: "UPCOMING",
        container: "bg-indigo-50 border border-indigo-100/40",
        text: "text-indigo-500",
      };
    }

    if (status === "pending" && isExpired) {
      return {
        label: "EXPIRED",
        container: "bg-slate-50 border border-slate-200/60",
        text: "text-slate-400",
      };
    }

    if (status === "pending") {
      const [startH, startM] = startTime.split(":");
      const todayStartTime = new Date();
      todayStartTime.setHours(parseInt(startH), parseInt(startM), 0, 0);

      if (now >= todayStartTime) {
        return {
          label: "READY FOR ENTRY",
          container: "bg-indigo-50 border border-indigo-100/80",
          text: "text-indigo-600",
        };
      }

      return {
        label: "NOT ARRIVED",
        container: "bg-slate-50 border border-slate-100",
        text: "text-slate-500",
      };
    }

    switch (status) {
      case "checked_in":
        return {
          label: "INSIDE",
          container: "bg-emerald-50 border border-emerald-100",
          text: "text-emerald-600",
        };
      case "checked_out":
        return {
          label: "DEPARTED",
          container: "bg-blue-50 border border-blue-100",
          text: "text-blue-600",
        };
      case "overstayed":
        return {
          label: "OVERSTAYED",
          container: "bg-amber-50 border border-amber-100",
          text: "text-amber-600",
        };
      default:
        return {
          label: status.toUpperCase(),
          container: "bg-slate-50 border border-slate-100",
          text: "text-slate-500",
        };
    }
  };

  const canActionExecute = (label: string, invite: Invitation) => {
    const isStaffEntry = invite.invite_type === "staff_entry";
    const allowed = [
      "NOT ARRIVED",
      "NOT ARRIVED TODAY",
      "READY FOR ENTRY",
      "INSIDE",
      "ARRIVED TODAY",
    ];
    return allowed.includes(label) || (isStaffEntry && invite.is_activated);
  };

  const handleLogActivity = async (inviteId: string, currentLabel: string) => {
    setUpdatingInvite(inviteId);
    const invite = invitations.find((i) => i.id === inviteId);
    if (!invite) return;
    const isStaffEntry = invite.invite_type === "staff_entry";

    const action = currentLabel === "INSIDE" ? "check_out" : "check_in";

    if (action === "check_in") {
      const now = new Date();

      if (!isStaffEntry && isPastTime(invite.end_date, invite.end_time)) {
        alert("This invitation has officially expired.");
        return;
      }

      const [startH, startM] = invite.start_time.split(":");
      const [endH, endM] = invite.end_time.split(":");

      const todayStart = new Date();
      todayStart.setHours(parseInt(startH), parseInt(startM), 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(parseInt(endH), parseInt(endM), 0, 0);

      if (now < todayStart) {
        alert(
          `Access Denied: Too early. Window starts at ${invite.start_time.slice(0, 5)}.`,
        );
        setUpdatingInvite(null);
        return;
      }

      if (now > todayEnd) {
        alert(
          `Access Denied: Entry window concluded at ${invite.end_time.slice(0, 5)}.`,
        );
        return;
      }

      if (isPastTime(invite.end_date, invite.end_time)) {
        alert("Access Denied: This invitation has officially expired.");
        return;
      }
    }

    try {
      const result = await logActivityApi(inviteId, action);

      if (!result.success) {
        alert(result.error);
        return;
      }

      if (result.invitation) {
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === inviteId ? result.invitation! : inv)),
        );
      }
    } catch (error) {
      console.error("Critical Log Activity Error:", error);
      alert("A network error occurred. Please try again.");
    } finally {
      setUpdatingInvite(null);
    }
  };

  const filteredInvites = invitations.filter(
    (inv) =>
      inv.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.access_code.includes(searchTerm),
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 font-sans">
        <p className="text-slate-400 font-medium text-sm animate-pulse">
          Retrieving Estate Invitations Feed...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 sm:p-3 font-sans">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 border rounded-2xl border-slate-100 shadow-2xs">
        <div className="relative w-full sm:w-96 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search guest name or entry code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-blue-500/5 outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={loadData}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-blue-600 font-montserrat font-bold hover:bg-blue-50 active:scale-98 rounded-xl transition-all text-xs uppercase tracking-wider shrink-0"
        >
          <RefreshCcw size={14} /> Refresh Feed
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-[70vh] overflow-auto pr-1 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-1">
            {filteredInvites.map((invite) => {
              const isExpired = isPastTime(invite.end_date, invite.end_time);
              const isExpanded = expandedId === invite.id;
              const isMultiEntry = invite.invite_type === "multi_entry";
              const isStaffEntry = invite.invite_type === "staff_entry";
              const statusDetails = isMultiEntry
                ? getMultiEntryStatus(invite)
                : getStatusDetails(
                    invite.status,
                    isExpired,
                    invite.start_date,
                    invite.is_cancelled,
                    invite.start_time,
                  );

              return (
                <div
                  key={invite.id}
                  className={`group relative bg-white rounded-[2.5rem] border-t-4 ${
                    isMultiEntry ? "border-blue-500" : "border-emerald-500"
                  } shadow-2xs hover:shadow-md transition-all duration-300 p-2 flex flex-col min-w-0 ${
                    invite.is_cancelled ? "grayscale-[0.3] opacity-70" : ""
                  }`}
                >
                  <div className="p-4 sm:p-5 flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-4 min-w-0">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                          {invite.guest_image_url ? (
                            <img
                              src={invite.guest_image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : isStaffEntry ? (
                            <Briefcase size={20} className="text-blue-500" />
                          ) : (
                            <User size={20} className="text-blue-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-montserrat font-bold text-slate-800 text-sm sm:text-base leading-snug truncate block w-full tracking-tight">
                            {invite.guest_name}
                          </h3>
                          {isStaffEntry && invite.staff_position && (
                            <p className="font-sans font-bold text-[11px] mt-0.5 text-slate-400 truncate block w-full">
                              {invite.staff_position}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-0.5">
                            <Fingerprint
                              size={10}
                              className="text-blue-400 shrink-0"
                            />
                            <span className="text-[9px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                              {invite.invite_type.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {!isStaffEntry && (
                        <div
                          className={`${statusDetails.container} px-2 py-0.5 rounded-md shrink-0`}
                        >
                          <span
                            className={`${statusDetails.text} text-[9px] font-oswald font-bold tracking-wide uppercase`}
                          >
                            {statusDetails.label}
                          </span>
                        </div>
                      )}

                      {isStaffEntry && (
                        <div
                          className={`px-2 py-0.5 rounded-md shrink-0 ${invite.is_activated ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"}`}
                        >
                          <span
                            className={`text-[9px] font-oswald font-bold tracking-wide uppercase ${invite.is_activated ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {invite.is_activated
                              ? invite.status === "checked_in"
                                ? "INSIDE"
                                : invite.status === "checked_out"
                                  ? "ACTIVE"
                                  : invite.status === "overstayed"
                                    ? "OVERSTAYED"
                                    : "ACTIVE"
                              : "DISABLED"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-950 rounded-3xl p-4 text-center mb-4 border border-slate-900 shadow-xs">
                      <p className="text-[9px] font-oswald font-bold text-slate-500 uppercase tracking-widest mb-0.5">
                        Access Code
                      </p>
                      <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-[0.15em] pl-[0.15em]">
                        {invite.access_code}
                      </div>
                    </div>

                    <div className="space-y-1.5 px-0.5">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center text-slate-400 font-medium">
                          <Calendar
                            size={13}
                            className="mr-1.5 text-blue-400 shrink-0"
                          />{" "}
                          Validity
                        </div>
                        <span className="text-slate-600 font-semibold truncate text-right">
                          {(() => {
                            const isStaffEntry =
                              invite.invite_type === "staff_entry";
                            const startStr = formatDate(invite.start_date);
                            const hasEndDate =
                              invite.end_date !== null &&
                              invite.end_date !== undefined &&
                              invite.end_date !== "null" &&
                              invite.end_date !== invite.start_date;

                            if (hasEndDate) {
                              return `${startStr} - ${formatDate(invite.end_date)}`;
                            }
                            if (isStaffEntry && !hasEndDate) {
                              return `${startStr} - Present`;
                            }
                            return startStr;
                          })()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center text-slate-400 font-medium">
                          <Clock
                            size={13}
                            className="mr-1.5 text-blue-400 shrink-0"
                          />{" "}
                          Hours
                        </div>
                        <span className="text-slate-600 font-semibold truncate text-right">
                          {formatTime(invite.start_time)} —{" "}
                          {formatTime(invite.end_time)}
                        </span>
                      </div>

                      {isStaffEntry && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-slate-400 font-medium">
                            <Clock
                              size={13}
                              className="mr-1.5 text-blue-400 shrink-0"
                            />{" "}
                            Activation
                          </div>
                          <span
                            className={`font-semibold ${invite.is_activated ? "text-emerald-500" : "text-rose-500"}`}
                          >
                            {invite.is_activated ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      )}

                      {statusDetails.label === "OVERSTAYED" && (
                        <p className="text-[10px] text-rose-600 font-oswald font-bold uppercase tracking-wider mt-1 animate-pulse">
                          Shift ended at {invite.end_time.slice(0, 5)}
                        </p>
                      )}
                    </div>

                    {/* Expansion for Multi-Entry Dates */}
                    {isMultiEntry && (
                      <div className="mt-4 pt-2.5 border-t border-slate-50">
                        <button
                          onClick={() => toggleExpand(invite.id)}
                          className="flex items-center justify-between w-full text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <span className="text-[10px] font-oswald font-bold uppercase tracking-wider">
                            Exclusion Dates
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 flex flex-wrap gap-1 max-h-24 overflow-y-auto no-scrollbar">
                            {invite.excluded_dates &&
                            invite.excluded_dates.length > 0 ? (
                              invite.excluded_dates.map((date: string) => (
                                <span
                                  key={date}
                                  className="bg-rose-50/50 text-rose-600 text-[10px] font-oswald font-bold px-2 py-0.5 rounded-lg border border-rose-100"
                                >
                                  {date.split("-").reverse().join("/")}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-300 italic font-medium">
                                No exclusions recorded
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Operational Controls Base Footer Panel */}
                  <div className="flex items-center justify-between gap-3 p-3 bg-slate-50/60 border-t border-slate-50/80 rounded-b-[2.2rem] mt-auto">
                    <div className="flex-1 min-w-0">
                      {canActionExecute(statusDetails.label, invite) ? (
                        <button
                          onClick={() =>
                            handleLogActivity(invite.id, statusDetails.label)
                          }
                          className={`w-full py-2.5 px-4 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-98 ${
                            statusDetails.label === "INSIDE"
                              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200"
                              : "bg-slate-900 hover:bg-black text-white shadow-slate-300"
                          }`}
                        >
                          {updatingInvite === invite.id ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />{" "}
                              Processing...
                            </>
                          ) : statusDetails.label === "INSIDE" ? (
                            <>
                              <LogOut size={13} /> Check Out
                            </>
                          ) : (
                            <>
                              <LogIn size={13} /> Check In
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 text-center text-[11px] font-montserrat font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-200/40">
                          <Lock size={12} /> Restricted
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedInvite(invite)}
                      className="p-2.5 bg-white border border-slate-200/60 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-slate-400 hover:text-slate-600 transition-colors shadow-3xs shrink-0"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <InvitationDetailModal
        invite={selectedInvite}
        onClose={() => setSelectedInvite(null)}
        statusDetails={
          selectedInvite
            ? selectedInvite.invite_type === "multi_entry"
              ? getMultiEntryStatus(selectedInvite)
              : getStatusDetails(
                  selectedInvite.status,
                  isPastTime(selectedInvite.end_date, selectedInvite.end_time),
                  selectedInvite.start_date,
                  selectedInvite.is_cancelled,
                  selectedInvite.start_time,
                )
            : null
        }
      />
    </div>
  );
}
