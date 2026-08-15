/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users,
  Ticket,
  AlertOctagon,
  FileText,
  ShieldAlert,
} from "lucide-react";
import GatePassesView from "./GatePassView";
import SecurityJoinRequestsPage from "./SecurityJoinRequestPage";
import SecurityPersonnelsList from "./SecurityPersonnels";
import OnDutyPersonnel from "./SecurityOnDuty";
import SecurityReportsView from "./SecurityReportsView";
import UserLogsPage from "./UsersLogsPage";
import { useUser } from "../UserContext";

export default function SecurityManagement() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<
    "requests" | "personnel" | "onduty" | "reports" | "gatepasses" | "logs"
  >("requests");

  const tabs = [
    {
      id: "requests",
      label: "Requests",
      icon: UserPlus,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      id: "personnel",
      label: "Personnel",
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      id: "onduty",
      label: "On Duty",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      id: "reports",
      label: "Reports",
      icon: AlertOctagon,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      id: "gatepasses",
      label: "Gate Passes",
      icon: Ticket,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      id: "logs",
      label: "Logs",
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-purple-50",
    },
  ];

  const canView =
    user?.permissions?.includes("security_management") ||
    user?.permissions?.includes("view_guards") ||
    user?.permissions?.includes("all-access");

  return (
    <div className="space-y-6 pb-24 md:pb-8 font-sans">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl font-montserrat font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? `${tab.bg} ${tab.color} ring-1 ring-inset ring-black/5 shadow-xs`
                  : "bg-white text-slate-400 border border-transparent hover:border-slate-200"
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-current ml-0.5 animate-in zoom-in duration-200" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Area */}
      {canView ? (
        <div className="h-100 px-3">
          {activeTab === "requests" && <SecurityJoinRequestsPage />}

          {activeTab === "personnel" && <SecurityPersonnelsList />}

          {activeTab === "onduty" && <OnDutyPersonnel />}

          {activeTab === "reports" && <SecurityReportsView />}

          {activeTab === "gatepasses" && <GatePassesView />}

          {activeTab === "logs" && <UserLogsPage role="SECURITY" />}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200/80 max-w-xl mx-auto my-8">
          <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide mb-1">
            Workspace Access Restricted
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
            You do not currently hold the authorized digital credentials or
            clear operational rights needed to view this interface panel.
          </p>
        </div>
      )}
    </div>
  );
}
