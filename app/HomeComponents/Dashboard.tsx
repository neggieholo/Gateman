/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  Users,
  ShieldCheck,
  CreditCard,
  CalendarClock,
  BellRing,
  UserCheck,
  ArrowUpRight,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";
import { DashboardStats } from "../services/types";
import { fetchDashboardStats } from "../services/apis";

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDashboardStats();
        setStats(data);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is authenticated
    if (user) {
      getDashboardData();
    }
  }, [user]);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-240 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 animate-pulse h-[calc(100vh-200px)]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-slate-600 font-semibold text-lg">
          Loading Command Center...
        </h2>
        <p className="text-slate-400 text-sm">
          Syncing estate records
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-240 p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          Connection Issue
        </h2>
        <p className="text-slate-500 mb-6 max-w-xs">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-160 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500 italic">
          No activity data found for this estate yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4 h-[calc(100vh-150px)] overflow-y-auto p-5 bg-slate-50/50">
      {/* Header - Compact */}
      <div className="flex justify-between items-center">
        <div>
          <div className="text-[16px] font-bold text-slate-400 uppercase tracking-widest">
            {currentDate}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Command Center
          </h1>
        </div>
        {loading && (
          <Loader2 className="animate-spin text-indigo-600" size={20} />
        )}
      </div>

      {/* Primary Stats Grid - Reduced padding/margins */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard
          icon={<ShieldCheck size={22} />}
          label="Security"
          value={stats.security.total}
          color="indigo"
          onClick={() => router.push("/home/security")}
          metrics={[
            {
              label: "On-Duty",
              value: stats.security.onDuty,
              color: "text-emerald-600",
            },
            {
              label: "Unresolved Complaints",
              value: stats.security.complaints,
              color: "text-rose-500",
            },
            {
              label: "Join Requests",
              value: stats.security.pendingRequests,
              color: "text-rose-500",
            },
          ]}
        />

        <StatCard
          icon={<BellRing size={22} />}
          label="Community Alerts"
          value={stats.community.totalAlerts}
          color="rose"
          onClick={() => router.push("/home/community")}
          metrics={[
            {
              label: "Unread Alerts",
              value: stats.community.unreadAlerts,
              color: "text-rose-600",
            },
          ]}
        />

        <StatCard
          icon={<CreditCard size={22} />}
          label="Payments For Current Month"
          value={stats.payments.monthlyCount}
          color="amber"
          onClick={() => router.push("/home/payments")}
          metrics={[
            {
              label: "Total Pending",
              value: stats.payments.pendingPayments,
              color: "text-amber-600 font-bold",
            },
            {
              label: "Unresolved Complaints",
              value: stats.payments.paymentReports,
              color: "text-slate-500",
            },
          ]}
        />

        <StatCard
          icon={<CalendarClock size={22} />}
          label="Events"
          value={stats.events.total}
          color="purple"
          onClick={() => router.push("/home/events")}
          metrics={[
            {
              label: "Upcoming",
              value:
                stats.events.upcoming.title === "None"
                  ? "None"
                  : `${stats.events.upcoming.title} (${new Date(stats.events.upcoming.date!).toLocaleDateString()})`,
              color: "text-purple-600",
            },
            {
              label: "Pending",
              value: stats.events.pending,
              color: "text-amber-500",
            },
          ]}
        />
      </div>

      <div
        className="bg-white rounded-4xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
        onClick={() => router.push("/home/tenantmanagement")}
      >
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-linear-to-r from-white to-blue-50/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
              <UserCheck size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-900 text-xl tracking-tight">
                  Resident Management
                </h3>
              </div>
              <div className="flex gap-4 mt-1 text-sm font-bold text-slate-400 uppercase tracking-tighter">
                <span>
                  Tenants:{" "}
                  <b className="text-slate-900">{stats.residents.total}</b>
                </span>
                <span>
                  Suggestions & Reports:{" "}
                  <b className="text-rose-500">{stats.residents.complaints}</b>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50/20">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle size={14} className="text-blue-600" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Pending Requests
            </h4>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 inline-block min-w-50">
            <span className="text-xl font-black text-slate-900">
              {stats.residents.pendingRequests}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, metrics, onClick }: any) {
  const colorMap: any = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  return (
    <div
      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-2.5 rounded-xl ${colorMap[color].split(" ")[0]} ${colorMap[color].split(" ")[1]}`}
          >
            {icon}
          </div>
          <span className="text-[14px] font-black text-slate-400 uppercase tracking-widest">
            {label}
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900 tracking-tighter truncate">
          {value}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 space-y-1">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-[12px] font-black text-slate-400 uppercase tracking-tighter">
              {m.label}
            </span>
            <span className={`text-md font-black ${m.color}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
