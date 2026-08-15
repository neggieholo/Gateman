/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  UserPlus,
  Radio,
  Loader2,
  Clock,
  User,
  MapPin,
  ChevronRight,
} from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";
import { SecurityDashboardStats } from "../services/types";
import { fetchSecurityStats, formatDate, formatTime } from "../services/apis";
import toast from "react-hot-toast";

export default function SecurityDashboard() {
  const { user, contextEstateId } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<SecurityDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hasPassWarn = localStorage.getItem("DASHBOARD_PASS_WARN") === "true";
    const hasMfaWarn = localStorage.getItem("DASHBOARD_MFA_WARN") === "true";

    // Short circuit if neither warning is flagged
    if (!hasPassWarn && !hasMfaWarn) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-2.5 p-1 max-w-sm">
          <p className="font-sans font-black text-slate-900 text-sm tracking-tight">
            ⚠️ Security Profile Configuration Required
          </p>

          <div className="flex flex-col gap-2 text-xs text-slate-600 font-medium leading-relaxed">
            {hasPassWarn && (
              <p>
                • You are currently using a <strong>temporary password</strong>.
                For maximum system protection, please configure a new master
                credential.
              </p>
            )}
            {hasMfaWarn && (
              <p>
                • Administrative security policies{" "}
                <strong>require Multi-Factor Authentication</strong> for your
                account. Please set up MFA before your next session to avoid
                access restrictions.
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end mt-1.5 border-t border-slate-100 pt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem("DASHBOARD_PASS_WARN");
                localStorage.removeItem("DASHBOARD_MFA_WARN");
              }}
              className="px-3 py-1.5 text-[10px] font-oswald font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider transition-colors"
            >
              Acknowledge Later
            </button>

            <button
              onClick={() => {
                toast.dismiss(t.id);
                localStorage.removeItem("DASHBOARD_PASS_WARN");
                localStorage.removeItem("DASHBOARD_MFA_WARN"); // Fixed typo

                // Smart routing path selection
                window.location.href = hasMfaWarn
                  ? "/home/settings"
                  : "/home/settings/change-password";
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider shadow-sm transition-colors"
            >
              Configure Profile
            </button>
          </div>
        </div>
      ),
      {
        id: "admin-onboarding-security-alert",
        duration: Infinity,
        position: "top-center",
      },
    );
  }, []);

  useEffect(() => {
    const getSecurityData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchSecurityStats(contextEstateId!);
        setStats(data);
      } catch (err: any) {
        console.error("Security fetch error:", err);
        setError(err.message || "Failed to load security dashboard HUD");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getSecurityData();
    }
  }, [user, contextEstateId]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans p-6 animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-slate-600 font-montserrat font-semibold text-lg">
          Loading Security HUD...
        </h2>
        <p className="text-slate-400 text-sm">Syncing security telemetry</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans p-6 text-center bg-white">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold font-montserrat text-slate-800 mb-2">
          Security Feed Offline
        </h2>
        <p className="text-slate-500 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-montserrat font-medium hover:bg-indigo-700 transition-colors shadow-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="relative space-y-6 w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/50 pb-20 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
        <div>
          <div className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
            {currentDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight">
            Security Command HUD
          </h1>
        </div>
        {loading && (
          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
            <Loader2 className="animate-spin text-indigo-600" size={18} />
            <span className="text-xs font-semibold text-indigo-700">
              Syncing
            </span>
          </div>
        )}
      </div>

      {/* Primary HUD Grid: 2x2 Top Cards + Full-Width GPS Ping Bottom Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CARD 1: Total Guards */}
        <StatCard
          icon={<ShieldCheck size={22} />}
          label="Total Guards"
          value={stats.totalGuards.count ?? 0}
          color="indigo"
          onClick={() => router.push("/home/security/guards")}
          metrics={[
            {
              label: "Most Recently Registered",
              value:
                stats.totalGuards.mostRecent.name === "None"
                  ? "None"
                  : `${stats.totalGuards.mostRecent.name} (${formatDate(
                      stats.totalGuards.mostRecent.created_at!,
                    )})`,
              color: "text-indigo-600 font-medium",
            },
          ]}
        />

        {/* CARD 2: On-Duty Guards */}
        <StatCard
          icon={<UserCheck size={22} />}
          label="Guards On-Duty"
          value={stats.onDutyGuards.count ?? 0}
          color="emerald"
          onClick={() => router.push("/home/security/shifts")}
          metrics={[
            {
              label: "Most Recently Checked-In",
              value:
                stats.onDutyGuards.lastCheckedIn.name === "None"
                  ? "None"
                  : `${stats.onDutyGuards.lastCheckedIn.name} (${formatTime(
                      stats.onDutyGuards.lastCheckedIn.time!,
                    )})`,
              color: "text-emerald-600 font-medium",
            },
            {
              label: "Most Recently Checked-Out",
              value:
                stats.onDutyGuards.lastCheckedOut.name === "None"
                  ? "None"
                  : `${stats.onDutyGuards.lastCheckedOut.name} (${formatTime(
                      stats.onDutyGuards.lastCheckedOut.time!,
                    )})`,
              color: "text-slate-500",
            },
          ]}
        />

        {/* CARD 3: Security Reports */}
        <StatCard
          icon={<AlertTriangle size={22} />}
          label="Security Reports"
          value={stats.reports.total ?? 0}
          color="rose"
          onClick={() => router.push("/home/security/reports")}
          metrics={[
            {
              label: "Pending",
              value: stats.reports.pending ?? 0,
              color: "text-rose-600 font-bold",
            },
            {
              label: "In Review",
              value: stats.reports.review ?? 0,
              color: "text-amber-600 font-bold",
            },
            {
              label: "Resolved",
              value: stats.reports.resolved ?? 0,
              color: "text-emerald-600",
            },
          ]}
        />

        {/* CARD 4: Join Requests */}
        <StatCard
          icon={<UserPlus size={22} />}
          label="Join Requests"
          value={stats.joinRequests.total ?? 0}
          color="amber"
          onClick={() => router.push("/home/security/requests")}
          metrics={[
            {
              label: "Pending",
              value: stats.joinRequests.pending ?? 0,
              color: "text-amber-600 font-bold",
            },
            {
              label: "Approved",
              value: stats.joinRequests.approved ?? 0,
              color: "text-emerald-600",
            },
            {
              label: "Rejected",
              value: stats.joinRequests.rejected ?? 0,
              color: "text-slate-400",
            },
          ]}
        />

        {/* CARD 5: Full-Width Telemetry GPS Ping Bar */}
        <div
          onClick={() => router.push("/home/security/live-map")}
          className="sm:col-span-2 bg-linear-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-purple-900/40 cursor-pointer transition-all hover:shadow-xl hover:border-purple-600/50 active:scale-[0.995] group relative overflow-hidden"
        >
          {/* Subtle Ambient Pulse Background */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-all"></div>

          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Radio size={20} className="animate-pulse" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
              </div>
              <div>
                <span className="text-[11px] font-oswald font-bold text-purple-300 uppercase tracking-widest block">
                  Live Telemetry
                </span>
                <h3 className="text-base font-montserrat font-black text-white tracking-wide">
                  Latest GPS Ping Signal
                </h3>
              </div>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* Pinged Guard Name */}
            <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-oswald font-bold uppercase tracking-wider mb-1">
                <User size={14} className="text-purple-400" />
                Target Officer
              </div>
              <div className="text-base font-montserrat font-bold text-white truncate">
                {stats.latestPing.officerName || "None"}
              </div>
            </div>

            {/* Last Recorded Location */}
            <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-oswald font-bold uppercase tracking-wider mb-1">
                <MapPin size={14} className="text-purple-400" />
                Coordinates / Zone
              </div>
              <div className="text-base font-montserrat font-bold text-purple-200 truncate">
                {stats.latestPing.location || "Awaiting Response"}
              </div>
            </div>

            {/* Duty Status Badge */}
            <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-oswald font-bold uppercase tracking-wider mb-1">
                <ShieldCheck size={14} className="text-purple-400" />
                Duty Status
              </div>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    stats.latestPing.isOnDuty
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {stats.latestPing.isOnDuty ? "On-Duty" : "Off-Duty / Standby"}
                </span>
              </div>
            </div>

            {/* Ping Timestamp */}
            <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-oswald font-bold uppercase tracking-wider mb-1">
                <Clock size={14} className="text-purple-400" />
                Ping Time
              </div>
              <div className="text-base font-montserrat font-bold text-slate-300">
                {stats.latestPing.pingTime
                  ? formatTime(stats.latestPing.pingTime)
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, metrics, onClick }: any) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer active:scale-[0.99]"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              colorMap[color]?.split(" ")[0]
            } ${colorMap[color]?.split(" ")[1]}`}
          >
            {icon}
          </div>
          <span className="text-xs font-oswald font-bold text-slate-400 text-right uppercase tracking-wider line-clamp-1">
            {label}
          </span>
        </div>
        <div className="text-2xl font-montserrat font-black text-slate-900 tracking-tight truncate">
          {value !== undefined && value !== null ? value : 0}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="flex justify-between items-start gap-2">
            <span className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-wide leading-tight">
              {m.label}
            </span>
            <span
              className={`text-xs font-montserrat font-bold shrink-0 ${m.color}`}
            >
              {m.value !== undefined && m.value !== null ? m.value : "0"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
