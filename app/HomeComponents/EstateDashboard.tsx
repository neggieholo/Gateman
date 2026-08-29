/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  CreditCard,
  CalendarClock,
  BellRing,
  UserCheck,
  Loader2,
  PlusCircle,
  Lock,
  Wrench,
} from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";
import { DashboardStats } from "../services/types";
import { fetchDashboardStats } from "../services/apis";

import toast from "react-hot-toast";

// Toggle between showing a locked overlay vs completely hiding locked modules
const HIDE_LOCKED_MODULES = false;

export default function EstateDashboard() {
  const { user, contextEstateId } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const estates = useMemo(() => user?.estates || [], [user?.estates]);

  // Derive active estate object based on contextEstateId
  const activeEstate = useMemo(() => {
    console.log("UserContext EstateId:", contextEstateId);
    return (
      estates.find((e: any) => e.id === contextEstateId) || estates[0] || null
    );
  }, [estates, contextEstateId]);

  // Feature enablement checker based on activeEstate.plan
  const isModuleEnabled = (moduleKey: string): boolean => {
    if (!activeEstate?.plan) return false;
    if (activeEstate.plan.is_trial) return true;
    return activeEstate.plan.selected_add_ons?.includes(moduleKey) ?? false;
  };

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
                localStorage.removeItem("DASHBOARD_MFA_WARN");

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
    const getDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchDashboardStats(contextEstateId!);
        setStats(data);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      getDashboardData();
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
          Loading Command Center...
        </h2>
        <p className="text-slate-400 text-sm">Syncing estate records</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans p-6 text-center bg-white">
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
        <h2 className="text-xl font-bold font-montserrat text-slate-800 mb-2">
          Connection Issue
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

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen font-sans bg-slate-50 p-6">
        <p className="text-slate-500 italic">
          No activity data found for this estate yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 w-full h-full overflow-y-auto p-4 sm:p-6 bg-slate-50/50 pb-20 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <div>
          <div className="text-xs font-oswald font-bold text-slate-400 uppercase tracking-widest">
            {currentDate}
          </div>
          <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight">
            Command Center
          </h1>
        </div>
        {loading && (
          <Loader2 className="animate-spin text-indigo-600" size={22} />
        )}
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {/* Security Module */}
        <FeatureWrapper isEnabled={isModuleEnabled("security")}>
          <StatCard
            icon={<ShieldCheck size={22} />}
            label="Security"
            value={stats.security?.total ?? 0}
            color="indigo"
            onClick={() =>
              isModuleEnabled("security") && router.push("/home/security")
            }
            metrics={[
              {
                label: "On-Duty",
                value: stats.security?.onDuty ?? 0,
                color: "text-emerald-600",
              },
              {
                label: "Unresolved Complaints",
                value: stats.security?.complaints ?? 0,
                color: "text-rose-500",
              },
              {
                label: "Join Requests",
                value: stats.security?.pendingRequests ?? 0,
                color: "text-rose-500",
              },
            ]}
          />
        </FeatureWrapper>

        {/* Community Board Module */}
        <FeatureWrapper isEnabled={isModuleEnabled("community")}>
          <StatCard
            icon={<BellRing size={22} />}
            label="Community Board"
            value={stats.community?.totalAlerts ?? 0}
            color="rose"
            onClick={() =>
              isModuleEnabled("community") && router.push("/home/community")
            }
            metrics={[
              {
                label: "Unread Posts",
                value: stats.community?.unreadAlerts ?? 0,
                color: "text-rose-600",
              },
            ]}
          />
        </FeatureWrapper>

        {/* Payments Module */}
        <FeatureWrapper isEnabled={isModuleEnabled("payments")}>
          <StatCard
            icon={<CreditCard size={22} />}
            label="Payments For Current Month"
            value={stats.payments?.monthlyCount ?? 0}
            color="amber"
            onClick={() =>
              isModuleEnabled("payments") && router.push("/home/payments")
            }
            metrics={[
              {
                label: "Total Pending",
                value: stats.payments?.pendingPayments ?? 0,
                color: "text-amber-600 font-bold",
              },
              {
                label: "Unresolved Complaints",
                value: stats.payments?.paymentReports ?? 0,
                color: "text-slate-500",
              },
            ]}
          />
        </FeatureWrapper>

        {/* Facility Bookings Module */}
        <FeatureWrapper isEnabled={isModuleEnabled("facility_bookings")}>
          <StatCard
            icon={<CalendarClock size={22} />}
            label="Events"
            value={stats.events?.total ?? 0}
            color="purple"
            onClick={() =>
              isModuleEnabled("facility_bookings") &&
              router.push("/home/events")
            }
            metrics={[
              {
                label: "Upcoming",
                value:
                  stats.events?.upcoming?.venue_name === "None" ||
                  !stats.events?.upcoming
                    ? "None"
                    : `${stats.events.upcoming.venue_name} (${new Date(stats.events.upcoming.date!).toLocaleDateString()})`,
                color: "text-purple-600",
              },
              {
                label: "Pending",
                value: stats.events?.pending || 0,
                color: "text-amber-500",
              },
              {
                label: "Payment Pending",
                value: stats.events?.payment_pending_bookings || 0,
                color: "text-amber-500",
              },
              {
                label: "Payment Submitted",
                value: stats.events?.payment_submitted_bookings || 0,
                color: "text-amber-500",
              },
            ]}
          />
        </FeatureWrapper>
      </div>

      {/* Bottom Row Section: Resident Management & Artisan Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resident Management Row Block */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-slate-200">
          <div
            className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r cursor-pointer from-white to-blue-50/20"
            onClick={() => router.push("/home/tenantmanagement")}
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 shrink-0">
                <UserCheck size={24} />
              </div>
              <div>
                <h3 className="font-montserrat font-black text-slate-900 text-xl tracking-tight">
                  Resident Management
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-oswald font-bold text-slate-400 uppercase tracking-wider">
                  <span>
                    Tenants:{" "}
                    <b className="text-slate-900 font-sans">
                      {stats.residents.total}
                    </b>
                  </span>
                  <span>
                    Suggestions & Reports:{" "}
                    <b className="text-rose-500 font-sans">
                      {stats.residents.complaints}
                    </b>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-5 sm:p-6 bg-slate-50/20 cursor-pointer"
            onClick={() => router.push("/home/tenantmanagement?requests=true")}
          >
            <div className="flex items-center gap-2 mb-3">
              <PlusCircle size={14} className="text-blue-600" />
              <h4 className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
                Pending Requests
              </h4>
            </div>

            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 inline-block min-w-30 shadow-2xs">
              <span className="text-2xl font-montserrat font-black text-slate-900">
                {stats.residents.pendingRequests}
              </span>
            </div>
          </div>
        </div>

        {/* Artisan Services Row Block */}
        <FeatureWrapper isEnabled={isModuleEnabled("services_dispatch")}>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:border-slate-200 h-full">
            <div
              className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-linear-to-r cursor-pointer from-white to-emerald-50/20"
              onClick={() =>
                isModuleEnabled("services_dispatch") &&
                router.push("/home/services")
              }
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-100 shrink-0">
                  <Wrench size={24} />
                </div>
                <div>
                  <h3 className="font-montserrat font-black text-slate-900 text-xl tracking-tight">
                    Services Requests
                  </h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs font-oswald font-bold text-slate-400 uppercase tracking-wider">
                    <span>
                      Total Requests:{" "}
                      <b className="text-slate-900 font-sans">
                        {stats.services?.total ?? 0}
                      </b>
                    </span>
                    <span>
                      Pending:{" "}
                      <b className="text-amber-500 font-sans">
                        {stats.services?.pending ?? 0}
                      </b>
                    </span>
                    <span>
                      Dispatched:{" "}
                      <b className="text-indigo-600 font-sans">
                        {stats.services?.dispatched ?? 0}
                      </b>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="p-5 sm:p-6 bg-slate-50/20 cursor-pointer"
              onClick={() =>
                isModuleEnabled("services_dispatch") &&
                router.push("/home/services")
              }
            >
              <div className="flex items-center gap-2 mb-3">
                <PlusCircle size={14} className="text-emerald-600" />
                <h4 className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
                  Recently Completed
                </h4>
              </div>

              <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 inline-block min-w-30 shadow-2xs">
                <span className="text-2xl font-montserrat font-black text-emerald-600">
                  {stats.services?.recentlyCompleted ?? 0}
                </span>
              </div>
            </div>
          </div>
        </FeatureWrapper>
      </div>
    </div>
  );
}

// Wrapper to lock or hide unauthorized feature cards
function FeatureWrapper({
  isEnabled,
  children,
}: {
  isEnabled: boolean;
  children: React.ReactNode;
}) {
  // 1. If feature is unlocked, render normal children
  if (isEnabled) return <>{children}</>;

  // 2. If config says hide, return nothing
  if (HIDE_LOCKED_MODULES) return null;

  // 3. Otherwise render locked overlay state
  return (
    <div className="relative group overflow-hidden rounded-3xl border border-slate-100 h-full min-h-40">
      {/* Blurred background preview */}
      <div className="pointer-events-none opacity-30 blur-[2px] select-none h-full">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center z-10">
        <div className="p-2.5 bg-white/90 shadow-md rounded-full mb-2 text-slate-700">
          <Lock size={18} />
        </div>
        <span className="text-xs font-montserrat font-bold text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow-xs">
          Locked
        </span>
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
      className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer active:scale-[0.99] h-full"
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${colorMap[color].split(" ")[0]} ${colorMap[color].split(" ")[1]}`}
          >
            {icon}
          </div>
          <span className="text-xs font-oswald font-bold text-slate-400 text-right uppercase tracking-wider line-clamp-1">
            {label}
          </span>
        </div>
        <div className="text-3xl font-montserrat font-black text-slate-900 tracking-tight truncate">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
        {metrics.map((m: any, idx: number) => (
          <div key={idx} className="flex justify-between items-start gap-2">
            <span className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-wide leading-tight">
              {m.label}
            </span>
            <span
              className={`text-sm font-montserrat font-bold shrink-0 ${m.color}`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
