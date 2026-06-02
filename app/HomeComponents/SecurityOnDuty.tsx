/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityUser } from "../services/types";
import {
  Search,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  Loader2,
  Clock,
} from "lucide-react";
import { fetchReadableAddress, requestGuardLocation } from "../services/apis";
import { formatLastSeen } from "../services/apis";

export default function OnDutyPersonnel() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkinCode, setCheckinCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<
    Record<string, boolean>
  >({});

  const fetchData = async () => {
    try {
      const [personnelData, existingCode] = await Promise.all([
        securityDb.getAllSecurity(),
        securityDb.getCheckinCode(),
      ]);

      setGuards(personnelData.filter((g) => g.is_on_duty));
      setCheckinCode(existingCode);
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const newCode = await securityDb.generateCheckinCode();
      setCheckinCode(newCode);
    } catch (err) {
      alert("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const AddressDisplay = ({ location }: { location: string | null }) => {
    const [address, setAddress] = useState<string>("Loading address...");

    useEffect(() => {
      if (!location || location === "Unknown") {
        setAddress("No location data");
        return;
      }

      fetchReadableAddress(location).then(setAddress);
    }, [location]);

    return (
      <span
        className="text-sm font-semibold text-blue-600 truncate block w-full"
        title={address}
      >
        {address}
      </span>
    );
  };

  const filteredGuards = guards.filter(
    (g) =>
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleRequestLocation = async (guardId: string, guardName: string) => {
    if (pendingRequests[guardId]) return;

    setPendingRequests((prev) => ({ ...prev, [guardId]: true }));

    try {
      await requestGuardLocation(guardId);
      alert(
        `Location request sent to ${guardName}. You will be notified when it updates.`,
      );
    } catch (err: any) {
      alert(err.message || "Failed to send request");
    } finally {
      setPendingRequests((prev) => ({ ...prev, [guardId]: false }));
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-200px)] flex flex-col font-sans">
      {/* 1. Search Bar */}
      <div className="relative mb-6 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
          size={18}
        />
        <input
          type="text"
          placeholder="Search on-duty personnel..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-2xs focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-sm text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 2. Check-in Code Section */}
      <div className="bg-blue-600 rounded-3xl p-5 sm:p-6 mb-8 shadow-md flex flex-col lg:flex-row items-center justify-between text-white gap-6">
        <div className="flex items-center gap-4 self-start lg:self-auto">
          <div className="bg-white/10 p-3 rounded-2xl border border-white/10 shrink-0">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-montserrat font-black tracking-tight">
              Security Check-in Code
            </h2>
            <p className="text-blue-100 text-xs mt-0.5 font-medium">
              Generate a new 10-digit code for guard handovers.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 w-full lg:w-auto">
          <span className="text-2xl sm:text-3xl font-mono font-black tracking-[0.25em] text-center w-full sm:w-auto px-4 py-2 sm:py-0">
            {checkinCode || "----------"}
          </span>
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-white text-blue-600 px-6 py-3 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-blue-50 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            {isGenerating || loading ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <RefreshCw size={14} />
            )}
            {checkinCode ? "Refresh" : "Generate"}
          </button>
        </div>
      </div>

      {/* 3. Personnel List Section Identifier */}
      <h3 className="text-slate-400 font-oswald font-bold uppercase tracking-widest text-xs mb-4 px-1">
        Active Personnel
      </h3>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-4 pb-4">
          {loading ? (
            <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-blue-600" size={28} />
            </div>
          ) : filteredGuards.length > 0 ? (
            filteredGuards.map((guard) => (
              <div
                key={guard.id}
                className="bg-white border border-slate-100 rounded-3xl shadow-2xs overflow-hidden flex flex-col md:flex-row hover:border-blue-200 transition-all group"
              >
                {/* Image Left Context Frame */}
                <div className="w-full md:w-40 h-44 md:h-auto bg-slate-50 shrink-0 border-b md:border-b-0 md:border-r border-slate-100 relative overflow-hidden">
                  {guard.avatar ? (
                    <img
                      src={guard.avatar}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      alt={guard.name}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50/50 text-blue-400 font-montserrat font-black text-3xl uppercase">
                      {guard.name[0]}
                    </div>
                  )}
                </div>

                {/* Info Middle Data Module */}
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-slate-50 min-w-0">
                  <div className="flex items-center gap-2 mb-2 min-w-0">
                    <h4 className="font-montserrat font-black text-slate-800 text-lg truncate flex-1 tracking-tight">
                      {guard.name}
                    </h4>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-slate-400 text-xs min-w-0">
                      <Mail size={14} className="shrink-0 text-slate-300" />
                      <span className="truncate font-medium">
                        {guard.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-xs min-w-0">
                      <Phone size={14} className="shrink-0 text-slate-300" />
                      <span className="truncate font-semibold text-slate-600">
                        {guard.phone || "No mobile number"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Location Track Operations Section */}
                <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 bg-slate-50/40 flex flex-col justify-center space-y-4 shrink-0">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Check-in Location
                      </h2>
                      <div className="mt-0.5 truncate">
                        {guard.checkin_location ? (
                          <AddressDisplay location={guard.checkin_location} />
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">
                            No initial check-in data
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
                        Last Known Location
                      </h2>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <div className="flex-1 min-w-0 truncate">
                          {guard.last_known_location ? (
                            <AddressDisplay
                              location={guard.last_known_location}
                            />
                          ) : (
                            <span className="text-xs text-slate-400 font-medium">
                              No tracked live data
                            </span>
                          )}
                        </div>
                        {guard.last_location_time && (
                          <span className="flex items-center gap-1 text-[10px] font-oswald font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 shrink-0 uppercase tracking-wide">
                            <Clock size={10} />
                            {formatLastSeen(guard.last_location_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white hover:border-blue-600 active:scale-98 transition-all shadow-2xs"
                    onClick={() => handleRequestLocation(guard.id, guard.name)}
                  >
                    {pendingRequests[guard.id] ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Sending Ping...
                      </>
                    ) : (
                      <>
                        <MapPin size={13} />
                        Request Live Location
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-sm font-medium">
              No active personnel are currently recorded on duty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
