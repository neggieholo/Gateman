/* eslint-disable @next/next/no-img-element */
import React, { useCallback, useEffect, useState } from "react";
import { securityDb } from "../services/database";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  FileText,
  User,
  X,
  Eye,
  Download,
  ShieldAlert,
} from "lucide-react";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./Users";
import { SecurityDutyLog } from "../services/types";
import { formatDate } from "../services/apis";

export default function SecurityDutyLogsPage() {
  const { user, contextEstateId } = useUser();
  const [logs, setLogs] = useState<SecurityDutyLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Date Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const canView =
    user?.permissions?.includes("logs_management") ||
    user?.permissions?.includes("view_security_logs") ||
    user?.permissions?.includes("all-access");

  const fetchLogs = useCallback(async () => {
    if (!contextEstateId) return;
    try {
      const data = await securityDb.getSecurityDutyLogs(contextEstateId);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [contextEstateId]);

  useEffect(() => {
    if (!canView) {
      showAccessDeniedToast();
      return;
    }
    fetchLogs();
  }, [canView, fetchLogs]);

  // Universal Filter Logic (Searches all string attributes & matches target date)
  const logList = Array.isArray(logs) ? logs : [];

  const filteredLogs = logList.filter((log) => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      (log.guard_name && log.guard_name.toLowerCase().includes(term)) ||
      (log.guard_email && log.guard_email.toLowerCase().includes(term)) ||
      (log.action && log.action.toLowerCase().includes(term)) ||
      (log.location && log.location.toLowerCase().includes(term)) ||
      (log.address && log.address.toLowerCase().includes(term)) ||
      (log.expected_start_time &&
        log.expected_start_time.toLowerCase().includes(term)) ||
      (log.expected_end_time &&
        log.expected_end_time.toLowerCase().includes(term));

    let matchesDate = true;
    if (selectedDate) {
      const logTimestamp =
        log.actual_checkin_time || log.actual_checkout_time || log.created_at;
      if (logTimestamp) {
        const logDateStr = new Date(logTimestamp).toISOString().split("T")[0];
        matchesDate = logDateStr === selectedDate;
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const calculateDuration = (
    checkin: string | null,
    checkout: string | null,
  ) => {
    if (!checkin || !checkout) return null;
    const diffMs = new Date(checkout).getTime() - new Date(checkin).getTime();
    if (diffMs < 0) return null;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleDownloadCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = [
      "Schedule Name",
      "Guard Name",
      "Guard Email",
      "Action",
      "Check In",
      "Check Out",
      "Location",
      "Address",
    ];
    const rows = filteredLogs.map((log) => [
      log.schedule_name|| "",
      log.guard_name || "",
      log.guard_email || "",
      log.action || "",
      log.actual_checkin_time || "",
      log.actual_checkout_time || "",
      log.location || "",
      log.address || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security_duty_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 font-sans text-slate-700 min-w-0 p-3">
      {/* Header and Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gm-navy rounded-xl text-white">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-base font-montserrat font-black text-slate-800 uppercase tracking-tight leading-none">
              Security Duty Logs
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Auditable record of all guard duty transitions, locations, and
              liveness photos.
            </p>
          </div>
        </div>

        {/* EXPORT ACTION BUTTON */}
        <button
          type="button"
          onClick={handleDownloadCSV}
          disabled={filteredLogs.length === 0 || loading}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[10px] font-oswald font-bold uppercase tracking-wider transition-all shadow-3xs active:scale-98 ${
            filteredLogs.length === 0 || loading
              ? "bg-slate-100 text-slate-300 cursor-not-allowed border border-slate-200/60"
              : "bg-gm-navy hover:bg-slate-850 text-white"
          }`}
        >
          <Download size={14} /> Export CSV Ledger ({filteredLogs.length})
        </button>
      </div>

      {/* FILTER CONTROLS DOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        {/* Universal Search Bar */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
            Search Operator
          </label>
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-4 text-slate-450 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search guard, location, action..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Date Picker */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
            Filter by Date
          </label>
          <div className="relative flex items-center">
            <Calendar
              size={14}
              className="absolute left-4 text-slate-455 pointer-events-none"
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="absolute right-3 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DATA TABLE GRAPH CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-175">
            <thead>
              <tr className="bg-slate-50/85 border-b border-slate-150">
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-56">
                  Schedule
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-56">
                  Personnel
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-32">
                  Action
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-44">
                  Check-In Time
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-44">
                  Check-Out Time
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest">
                  Location & Address
                </th>
                <th className="p-4 text-[12px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-36">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-16 text-center text-slate-400 font-bold"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Loader2
                        size={18}
                        className="animate-spin text-blue-600"
                      />
                      <span className="text-xs text-slate-400 font-medium">
                        Synchronizing live duty logs matrix feeds...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const duration = calculateDuration(
                    log.actual_checkin_time,
                    log.actual_checkout_time,
                  );

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Schedule */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 text-sm">
                          {log.schedule_name || "Unassigned Schedule"}
                        </span>
                      </td>

                      {/* Personnel */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                            {log.guard_name ? (
                              log.guard_name[0].toUpperCase()
                            ) : (
                              <User size={14} />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-850">
                              {log.guard_name || "Unknown Guard"}
                            </span>
                            {log.guard_email && (
                              <span className="text-[12px] text-slate-600 font-medium">
                                {log.guard_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            log.action === "CHECK_IN"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.action === "CHECK_IN"
                                ? "bg-emerald-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {log.action}
                        </span>
                      </td>

                      {/* Check In */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            {formatDate(log.actual_checkin_time)}
                          </span>
                          {log.expected_start_time && (
                            <span className="text-[12px] text-slate-600 font-medium mt-0.5">
                              Expected: {log.expected_start_time}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Check Out */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          {log.actual_checkout_time ? (
                            <>
                              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                <Calendar
                                  size={13}
                                  className="text-slate-400"
                                />
                                {formatDate(log.actual_checkout_time)}
                              </span>
                              {duration && (
                                <span className="text-[11px] text-blue-600 font-mono mt-0.5 flex items-center gap-1">
                                  <Clock size={11} /> {duration}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] font-semibold text-emerald-600 italic">
                              Active Shift Session
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Location & Address */}
                      <td className="p-4 text-slate-600 font-medium max-w-xs leading-relaxed whitespace-normal break-words">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                            <MapPin
                              size={13}
                              className="text-slate-400 shrink-0"
                            />
                            {log.address || log.location}
                          </span>
                          {log.address && (
                            <span className="text-[12px] text-slate-600 font-mono mt-0.5 truncate">
                              {log.location}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Verification Photo */}
                      <td className="p-4 whitespace-nowrap">
                        {log.liveness_photo_url ? (
                          <button
                            onClick={() =>
                              setSelectedPhoto(log.liveness_photo_url)
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-lg text-xs font-bold transition-all border border-slate-200"
                          >
                            <Eye size={14} /> View Selfie
                          </button>
                        ) : (
                          <span className="text-slate-400 italic font-medium">
                            No Photo
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={24} className="text-slate-300" />
                      <p className="font-bold text-slate-500 text-sm">
                        No matching duty logs found matching the filter
                        footprint.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liveness Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full"
            >
              <X size={18} />
            </button>
            <h3 className="font-montserrat font-bold text-slate-800 mb-4 text-sm flex items-center gap-2 uppercase tracking-tight">
              <User size={16} className="text-blue-600" /> Duty Verification
              Selfie
            </h3>
            <img
              src={selectedPhoto}
              alt="Liveness Check"
              className="w-full h-80 object-cover rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
