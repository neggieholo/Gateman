/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityUser } from "../types";
import { Search, MapPin, Mail, Phone, RefreshCw, ShieldCheck, Loader2, Clock } from "lucide-react";
import { fetchReadableAddress } from "../services/apis";
import { formatLastSeen } from "../services/apis";

export default function OnDutyPersonnel() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [checkinCode, setCheckinCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchData = async () => {
    try {
      const [personnelData, existingCode] = await Promise.all([
        securityDb.getAllSecurity(),
        securityDb.getCheckinCode()
      ]);

      setGuards(personnelData.filter(g => g.is_on_duty));
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
      <p className="text-sm font-semibold text-blue-600 truncate" title={address}>
        {address}
      </p>
    );
  };


  const filteredGuards = guards.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-300px)] ">
      {/* 1. Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Search on-duty personnel..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* 2. Check-in Code Section */}
      <div className="bg-blue-600 rounded-2xl p-6 mb-10 shadow-lg flex flex-col md:flex-row items-center justify-between text-white gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-full">
            <ShieldCheck size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Security Check-in Code</h2>
            <p className="text-blue-100 text-sm">Generate a new 10-digit code for guard handovers.</p>
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/10 p-2 pl-6 rounded-xl border border-white/20 w-full md:w-auto">
          <span className="text-3xl font-mono font-black tracking-[0.3em]">
            {checkinCode || "----------"}
          </span>
          <button 
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
          >
            {(isGenerating || loading) ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {checkinCode ? "Refresh" : "Generate"}
          </button>
        </div>
      </div>

      {/* 3. Personnel List (Long Cards) */}
      <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 px-2">Active Personnel</h3>
      <div className=" h-[78%] overflow-y-auto pb-4">
        <div className="flex flex-col gap-4 pb-4">
          {loading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : filteredGuards.length > 0 ? (
            filteredGuards.map((guard) => (
              <div key={guard.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-blue-300 transition-colors">
                {/* Image Left */}
                <div className="w-full md:w-40 h-48 md:h-auto bg-slate-100 shrink-0 border-r border-slate-100">
                  {guard.avatar ? (
                    <img src={guard.avatar} className="w-full h-full object-cover" alt={guard.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-400 font-bold text-3xl">
                      {guard.name[0]}
                    </div>
                  )}
                </div>

                {/* Info Middle */}
                <div className="flex-1 p-6 flex flex-col justify-center border-r border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800 text-xl">{guard.name}</h4>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Mail size={14} /> {guard.email}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Phone size={14} /> {guard.phone || "No phone provided"}
                    </div>
                  </div>
                </div>

                {/* Location Right */}
                <div className="flex-1 p-6 bg-slate-50/50 flex flex-col justify-center space-y-4">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h2 className="text-[10px] font-bold text-slate-400 uppercase">Check-in Location</h2>
                      <p className="text-sm font-semibold text-slate-700">
                        {guard.checkin_location ? <AddressDisplay location={guard.checkin_location} /> : "No location data"}
                      </p>
                    </div>
                    <div>
                      <h2 className="text-[10px] font-bold text-slate-400 uppercase">Last Known Location</h2>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-700">
                          {guard.last_known_location ? <AddressDisplay location={guard.last_known_location} /> : "No location data"}
                        </p>
                        {guard.last_location_time && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                            <Clock size={10} />
                            {formatLastSeen(guard.last_location_time)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    onClick={() => console.log("Requesting location from guard...")}
                  >
                    <MapPin size={14} /> Request Live Location
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 bg-white rounded-2xl border border-dashed text-center text-slate-400">
              No personnel are currently on duty.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}