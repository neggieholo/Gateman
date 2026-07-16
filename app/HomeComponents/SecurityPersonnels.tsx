/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityUser } from "../services/types";
import {
  Trash2,
  Mail,
  Phone,
  Search,
  Clock,
  Loader2,
  History,
  ArrowLeft,
} from "lucide-react";
import { formatLastSeen } from "../services/apis";
import UserLogsPage from "./UsersLogsPage";

export default function SecurityPersonnelsList() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<SecurityUser | null>(null);

  const fetchGuards = async () => {
    setError(false);
    try {
      const data = await securityDb.getAllSecurity();
      setGuards(data);
    } catch (err) {
      setError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const filteredGuards = guards.filter(
    (guard) =>
      guard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this personnel?")) return;
    setDeletingId(id);
    try {
      await securityDb.deleteSecurity(id);
      setGuards(guards.filter((g) => g.id !== id));
    } catch (err) {
      alert("Failed to delete personnel");
    } finally {
      setDeletingId(null);
    }
  };

  if (selectedGuard) {
    return (
      <div className="bg-white p-2 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            setSelectedGuard(null);
          }}
          className="flex items-center gap-2 text-xs font-sans font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <UserLogsPage
          isolatedAdminId={selectedGuard.id}
          isolatedAdminName={selectedGuard.name}
          role="SECURITY"
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-250px)] flex flex-col font-sans">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center justify-between bg-white p-4 rounded-2xl shadow-2xs border border-slate-100 mx-4">
        <div className="relative w-full sm:w-96 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search personnel..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-sans text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white transition-all shadow-2xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredGuards.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 p-4">
            {filteredGuards.map((guard) => (
              <div
                key={guard.id}
                className="flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-2xs hover:shadow-xs hover:border-slate-200 transition-all h-72"
              >
                <div className="flex flex-row flex-1 p-4 gap-4 min-w-0">
                  <div className="w-28 sm:w-32 h-full bg-slate-50 rounded-2xl overflow-hidden shrink-0 border border-slate-100 relative">
                    {guard.avatar ? (
                      <img
                        src={guard.avatar}
                        className="w-full h-full object-cover"
                        alt={guard.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-montserrat font-black text-3xl uppercase">
                        {guard.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-montserrat font-black text-slate-800 text-base sm:text-lg truncate tracking-tight flex-1">
                        {guard.name}
                      </h3>
                      {guard.is_on_duty && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 min-w-0">
                      <Mail size={14} className="shrink-0 text-slate-300" />
                      <p className="text-xs truncate font-sans font-medium">
                        {guard.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 min-w-0">
                      <Phone size={14} className="shrink-0 text-slate-300" />
                      <p className="text-xs truncate font-sans font-semibold">
                        {guard.phone || "No phone connected"}
                      </p>
                    </div>

                    <div className="flex justify-between gap-2 mt-1">
                      {/* Last Check-in Section */}
                      <div className="flex flex-col">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
                            Last Check-in
                          </p>
                          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50/70 px-2 py-0.5 rounded-lg w-fit border border-blue-100/50">
                            <Clock size={12} />
                            <span className="text-[10px] font-oswald font-bold uppercase tracking-wider">
                              {guard.last_checkin
                                ? formatLastSeen(guard.last_checkin)
                                : "No record"}
                            </span>
                          </div>
                        </div>

                        {/* Last Check-out Section */}
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
                            Last Check-out
                          </p>
                          <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg w-fit border border-slate-100">
                            <Clock size={12} />
                            <span className="text-[10px] font-oswald font-bold uppercase tracking-wider">
                              {guard.last_checkout
                                ? formatLastSeen(guard.last_checkout)
                                : "No record"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-fit h-fit p-3 flex justify-center">
                        <button
                          onClick={() => setSelectedGuard(guard)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg border text-slate-500 hover:text-slate-800 transition-all inline-flex items-center gap-1 font-bold text-[14px]"
                        >
                          <History size={14} />
                          <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest">
                            View Logs
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button at the base */}
                <button
                  onClick={() => handleDelete(guard.id)}
                  disabled={deletingId === guard.id}
                  className={`w-full py-3.5 border-t border-slate-50 font-montserrat font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0 ${
                    deletingId === guard.id
                      ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                      : "bg-slate-50/50 text-red-600 hover:bg-red-50/80 hover:text-red-700"
                  }`}
                >
                  {deletingId === guard.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Remove Personnel
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="m-4 p-8 bg-rose-50 rounded-2xl border border-rose-100 border-dashed flex flex-col items-center justify-center">
            <p className="text-rose-600 font-montserrat font-bold text-sm">
              Server Connection Failure
            </p>
            <button
              onClick={fetchGuards}
              className="mt-2 text-xs font-oswald font-bold uppercase tracking-wider text-rose-500 hover:text-rose-700 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-slate-400 p-8 bg-white rounded-2xl border border-dashed border-slate-200 text-center font-medium text-sm">
              {loading
                ? "Loading guards database..."
                : "No security personnel found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
