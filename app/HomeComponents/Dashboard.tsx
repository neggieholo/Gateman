"use client";

import { useMemo, useState } from "react";
import {
  QrCode,
  Users,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Info,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="relative space-y-8 md:pb-18  h-[calc(100vh-50px)] overflow-y-auto p-6">
      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
            {currentDate}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Overview
          </h1>
        </div>
      </div>

      <div className="bg-indigo-900 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold opacity-70 uppercase tracking-widest">
              Estate Status
            </span>
            <div className="text-3xl font-black mt-1 tracking-tight">
              Active & Secure
            </div>
            <p className="text-indigo-200 text-xs mt-2 font-medium">
              All gates operational • 14 staff on duty
            </p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-[10px] uppercase font-bold opacity-60">
                New Receipts
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Occupancy
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              94%
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              +2%
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            142 / 150 Units Occupied
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <QrCode size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Active Passes
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              28
            </div>
            <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Valid
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            Currently active visitor codes
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Alerts
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              3
            </div>
            <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              New
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            Open maintenance requests
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button className="group relative overflow-hidden bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-start justify-between min-h-40 hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors"></div>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/10">
            <ShieldCheck size={28} />
          </div>
          <div className="text-left relative z-10">
            <span className="block font-bold text-xl mb-1 text-indigo-400">
              Security Log
            </span>
            <span className="text-sm text-slate-400">
              Monitor all gate activity
            </span>
          </div>
        </button>

        <button
          onClick={() => router.push("/home/payments")}
          className="group bg-white text-slate-900 border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-start justify-between min-h-40 hover:shadow-xl transition-all duration-300"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <ShieldCheck size={28} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-xl mb-1 text-slate-900">
              Payment Audits
            </span>
            <span className="text-sm text-slate-500">
              Verify resident transfers & receipts
            </span>
          </div>
        </button>
      </div>

      {/* <div className="bg-white rounded-3xl border border-slate-100 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          Recent Gate Activity
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xs font-bold">
                  JD
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    John Doe (Visitor)
                  </p>
                  <p className="text-xs text-slate-400">
                    Invited by Unit B12 • 10:45 AM
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md uppercase">
                Checked In
              </span>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
