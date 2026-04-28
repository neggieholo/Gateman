/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  UserPlus,
  Users,
  ClipboardList,
  Ticket,
  Search,
  Filter,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { Visitor } from "../services/types";
import GatePassesView from "./GatePassView";
import SecurityJoinRequestsPage from "./SecurityJoinRequestPage";
import SecurityPersonnelsList from "./SecurityPersonnels";
import OnDutyPersonnel from "./SecurityOnDuty";
import SecurityReportsView from "./SecurityReportsView";


export default function SecurityManagement() {
  const [activeTab, setActiveTab] = useState<
    "requests" | "personnel" | "onduty" | "reports" | "gatepasses"
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
    // { id: 'logs', label: ' Logs', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
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
  ];

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Header Area */}
      {/* <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Security Operations</h1>
          <p className="text-slate-500 font-medium mt-1">Manage personnel, monitor shifts, and audit access control.</p>
        </div>
        
        <div className="flex gap-2">
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all">
            <Filter size={20} />
          </button>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64 transition-all"
            />
          </div>
        </div>
      </header> */}

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 no-scrollbar gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                isActive
                  ? `${tab.bg} ${tab.color} ring-1 ring-inset ring-black/5 shadow-sm`
                  : "bg-white text-slate-400 border border-transparent hover:border-slate-200"
              }`}
            >
              <Icon size={18} />
              {tab.label}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-current ml-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Dynamic Content Area */}
      <div className="h-100">
        {activeTab === "requests" && <SecurityJoinRequestsPage />}

        {activeTab === "personnel" && <SecurityPersonnelsList />}

        {activeTab === "onduty" && <OnDutyPersonnel />}

        {activeTab === "reports" && <SecurityReportsView />}

        {activeTab === "gatepasses" && <GatePassesView />}
      </div>
    </div>
  );
}
