"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Search,
  ShieldAlert,
  FileText,
  Download,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { UserLogEntry } from "../services/types";
import { fetchUserLogsApi } from "../services/apis";
import { useUser } from "../UserContext";

interface UserLogsPageProps {
  isolatedAdminId?: string | null;
  isolatedAdminName?: string | null;
  type: string;
}

export default function UserLogsPage({
  isolatedAdminId = null,
  isolatedAdminName = null,
  type = "user",
}: UserLogsPageProps) {
  const { user } = useUser();
  const [logs, setLogs] = useState<UserLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // 🎛️ Local Filter States (Strictly Name and Date)
  const [nameFilter, setNameFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // 📡 1. Live Data Synchronization Loop
  useEffect(() => {
    const loadLogsData = async () => {
      setLoading(true);
      try {
        const response = await fetchUserLogsApi(type);
        if (response.success) {
          setLogs(response.logs || []);
        } else {
          toast.error(response.message || "Failed to sync system user logs.");
        }
      } catch (err) {
        toast.error("Network handshake exception");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLogsData();
  }, [type]);

  // 🧠 2. High-Performance Memoized Local Filtering Matrix
  const filteredLogs = useMemo(() => {
    if (isolatedAdminId) {
      return logs.filter(
        (log) => String(log.user_id) === String(isolatedAdminId),
      );
    }

    return logs.filter((log) => {
      // Name / Email filter evaluation match signature
      const matchesName =
        (log.user_name || "")
          .toLowerCase()
          .includes(nameFilter.toLowerCase()) ||
        (log.user_email || "").toLowerCase().includes(nameFilter.toLowerCase());

      // Date filter evaluation (extracts YYYY-MM-DD from database timestamp safely)
      const logDateISO = log.created_at ? log.created_at.split("T")[0] : "";
      const matchesDate = dateFilter ? logDateISO === dateFilter : true;

      return matchesName && matchesDate;
    });
  }, [logs, nameFilter, dateFilter, isolatedAdminId]);

  // 📥 3. Dynamic Client-Side CSV Downloader (Always matches filtered states)
  const handleDownloadCSV = () => {
    if (filteredLogs.length === 0) return;
    const canDownloadLogs =
      user?.permissions.includes("logs_management") ||
      user?.permissions.includes("download_user_logs") ||
      user?.permissions.includes("all-access");

    if (!canDownloadLogs) {
      toast.error(
        `Access Denied. You do not hold the authorized credentials required for this operation.`,
        {
          id: "unauthorized-users-page-lock",
          duration: 4000,
          position: "top-center",
          style: {
            fontWeight: "bold",
            borderRadius: "12px",
            background: "#1E293B",
            color: "#FFFFFF",
            maxWidth: "450px",
          },
        },
      );
      return;
    }

    const headers = [
      "Timestamp",
      "Admin Name",
      "Admin Email",
      "Action Type",
      "Target Table",
      "Description",
      "IP Address",
    ];

    const csvRows = filteredLogs.map((log) => {
      const dateObj = new Date(log.created_at);
      const timestamp = !isNaN(dateObj.getTime())
        ? `${dateObj.toLocaleDateString("en-GB")} ${dateObj.toLocaleTimeString("en-GB")}`
        : "---";

      return [
        `"${timestamp}"`,
        `"${(log.user_name || "System Loop").replace(/"/g, '""')}"`,
        `"${(log.user_email || "root").replace(/"/g, '""')}"`,
        `"${log.action_type}"`,
        `"${log.target_resource}"`,
        `"${(log.description || "").replace(/"/g, '""')}"`,
        `"${log.ip_address || "0.0.0.0"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileSuffix = dateFilter ? `_filtered_${dateFilter}` : "_full_ledger";
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `gateman_user_activity_logs${fileSuffix}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6 font-sans text-slate-700 min-w-0">
      {/* Header and Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl text-white">
            <FileText size={18} />
          </div>
          <div>
            <h1 className="text-base font-montserrat font-black text-slate-800 uppercase tracking-tight leading-none">
              View {isolatedAdminName ? isolatedAdminName + "'s" : "User"}{" "}
              Activity Logs
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Forensic security trail monitoring ledger system.
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
              : "bg-slate-900 hover:bg-slate-850 text-white"
          }`}
        >
          <Download size={14} /> Export CSV Ledger ({filteredLogs.length})
        </button>
      </div>

      {/* FILTER CONTROLS DOCK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200/70 shadow-2xs">
        {/* Name / Email Search */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
            Search Operator
          </label>
          <div className="relative flex items-center">
            <Search
              size={14}
              className="absolute left-4 text-slate-450 pointer-events-none"
            />
            <input
              type="text"
              disabled={isolatedAdminId !== null}
              placeholder={
                isolatedAdminId !== null
                  ? "Search locked to user focus target"
                  : "Search by administrator name or email address..."
              }
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Date Picker */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
            Filter by Date
          </label>
          <div className="relative flex items-center">
            <Calendar
              size={14}
              className="absolute left-4 text-slate-455 pointer-events-none"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/60 rounded-xl font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* DATA TABLE GRAPH CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50/85 border-b border-slate-150">
                <th className="p-4 text-[10px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-40">
                  Timestamp
                </th>
                <th className="p-4 text-[10px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-56">
                  Administrator
                </th>
                <th className="p-4 text-[10px] font-oswald font-bold text-slate-500 uppercase tracking-widest">
                  User Activity Trace Log
                </th>
                <th className="p-4 text-[10px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-36">
                  IP Metadata
                </th>
                <th className="p-4 text-[10px] font-oswald font-bold text-slate-500 uppercase tracking-widest w-44">
                  User Agent
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-sans">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-16 text-center text-slate-400 font-bold"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Loader2
                        size={18}
                        className="animate-spin text-blue-600"
                      />
                      <span className="text-xs text-slate-400 font-medium">
                        Synchronizing live tracking matrix feeds...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "---";
                  const formattedTime = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })
                    : "---";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-800 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
                            {formattedDate}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formattedTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-850">
                            {log.user_name || "System Action"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {log.user_email || "root@gateman"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-medium max-w-sm leading-relaxed whitespace-normal break-words">
                        {log.description}
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-semibold whitespace-nowrap">
                        {log.ip_address || "0.0.0.0"}
                      </td>
                      <td className="p-4 font-mono text-slate-400 font-semibold whitespace-nowrap">
                        <span
                          className="inline-block max-w-[150px] truncate"
                          title={log.user_agent || "unknown"}
                        >
                          {log.user_agent || "unknown"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert size={24} className="text-slate-300" />
                      <p className="font-bold text-slate-500 text-sm">
                        No activity logs found matching the filter footprint.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
