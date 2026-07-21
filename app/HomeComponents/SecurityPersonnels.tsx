/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  ExternalLink,
} from "lucide-react";
import { fetchReadableAddress, formatLastSeen } from "../services/apis";
import UserLogsPage from "./UsersLogsPage";

export default function SecurityPersonnelsList() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<SecurityUser | null>(null);
  const [viewLogs, setViewLogs] = useState(false);
  const [lastKnownAddress, setLastKnownAddress] = useState<string>("");


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

  useEffect(() => {
    const rawLocation =
      selectedGuard?.last_known_location ||
      selectedGuard?.checkin_location ||
      "";

    if (!rawLocation) {
      setLastKnownAddress("");
      return;
    }

    let isMounted = true;

    fetchReadableAddress(rawLocation)
      .then((address) => {
        if (isMounted) setLastKnownAddress(address);
      })
      .catch(() => {
        if (isMounted) setLastKnownAddress("Unknown location");
      });

    return () => {
      isMounted = false; // Prevent state updates if selectedGuard changes mid-fetch
    };
  }, [selectedGuard?.last_known_location, selectedGuard?.checkin_location]);

  if (viewLogs && selectedGuard) {
    return (
      <div className="bg-white p-2 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            setViewLogs(false);
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
        {selectedGuard ? (
          /* --- GUARD DETAIL VIEW --- */
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300">
            <button
              onClick={() => setSelectedGuard(null)}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-bold cursor-pointer"
            >
              <ArrowLeft size={20} /> Back to Directory
            </button>

            <div className="flex flex-col lg:flex-row gap-12">
              {/* Profile Sidebar */}
              <div className="w-full lg:w-1/3 flex flex-col items-center bg-slate-50 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shrink-0 min-w-0">
                <div className="relative mb-6">
                  <img
                    src={
                      selectedGuard.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedGuard.name)}`
                    }
                    className="w-full max-w-[20rem] aspect-square rounded-[2.5rem] object-cover shadow-2xl border-4 border-white mb-6 shrink-0"
                    alt={selectedGuard.name}
                  />
                  <span
                    className={`absolute bottom-2 right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-white shadow-sm ${
                      selectedGuard.is_on_duty
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {selectedGuard.is_on_duty ? "On Duty" : "Off Duty"}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-1 text-center">
                  {selectedGuard.name}
                </h2>
                <p className="text-slate-500 font-bold mb-4 italic text-center">
                  {selectedGuard.email}
                </p>
                <span className="text-[10px] font-black text-slate-600 bg-slate-200/60 px-3 py-1 rounded-full uppercase tracking-widest">
                  {selectedGuard.role}
                </span>
              </div>

              {/* Info Grid */}
              <div className="flex-1 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Phone Number
                    </p>
                    <p className="text-md font-black text-slate-800">
                      {selectedGuard.phone || "No Phone Recorded"}
                    </p>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 rounded-3xl overflow-x-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Last Known Location
                    </p>
                    <p className="text-md font-black text-slate-800 truncate">
                      {lastKnownAddress || "No Location Recorded"}
                    </p>
                    {selectedGuard.last_location_time && (
                      <p className="text-xs text-slate-400 font-medium mt-1">
                        Updated:{" "}
                        {new Date(
                          selectedGuard.last_location_time,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Duty Log Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Last Check-In
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {selectedGuard.last_checkin
                        ? new Date(selectedGuard.last_checkin).toLocaleString()
                        : "No check-in record"}
                    </p>
                    {selectedGuard.checkin_location && (
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        Loc: {selectedGuard.checkin_location}
                      </p>
                    )}
                  </div>

                  <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Last Check-Out
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {selectedGuard.last_checkout
                        ? new Date(selectedGuard.last_checkout).toLocaleString()
                        : "No check-out record"}
                    </p>
                    {selectedGuard.checkout_location && (
                      <p className="text-xs text-slate-500 font-bold mt-1">
                        Loc: {selectedGuard.checkout_location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Verification Documents Section */}
                <section>
                  <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 px-1">
                    Verification Documents
                  </h4>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">
                        {selectedGuard.id_type || "Government ID"}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DocPreview
                        url={selectedGuard.id_front_url}
                        label="ID Front View"
                      />
                      <DocPreview
                        url={selectedGuard.id_back_url}
                        label="ID Back View"
                      />
                    </div>
                  </div>
                </section>

                {/* Action Controls */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8">
                  <button
                    className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg cursor-pointer"
                    onClick={() => setViewLogs(true)}
                  >
                    View Logs
                  </button>
                  <button
                    className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 active:scale-95 transition-all cursor-pointer"
                    onClick={() => {
                      handleDelete(selectedGuard.id);
                    }}
                  >
                    Remove Security Personnel
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : filteredGuards.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 p-4">
            {filteredGuards.map((guard) => (
              <div
                key={guard.id}
                onClick={() => setSelectedGuard(guard)}
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

                    <div className="flex justify-start gap-2 mt-1">
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
                    </div>
                  </div>
                </div>
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

const DocPreview = ({ url, label }: { url?: string; label: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
        {label}
      </span>
      {url && (
        <a
          href={url}
          target="_blank"
          className="text-blue-500 hover:text-blue-700"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
    {url ? (
      <img
        src={url}
        className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-slate-100"
        alt={label}
      />
    ) : (
      <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
        <span className="text-slate-300 text-sm italic font-medium">
          Not Provided
        </span>
      </div>
    )}
  </div>
);
