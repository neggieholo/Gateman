/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { Invitation } from '../types';
import { fetchGatePasses, logActivityApi } from '../services/apis';
import { 
  Calendar, 
  Clock, 
  User, 
  Fingerprint,
  RefreshCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  LogIn,
  LogOut,
  Lock,
  Loader2
} from 'lucide-react';
import InvitationDetailModal from './InvitationDetail';

export default function GatePassesView() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedInvite, setSelectedInvite] = useState<Invitation | null>(null);
  const [updatingInvite, setUpdatingInvite] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchGatePasses();
    setInvitations(data);
    setLoading(false);
  };

  useEffect(() => {
    const loadPassData = async () => {
      await loadData();
    };

    loadPassData();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const isPastTime = (endDate: string, endTime: string) => {
    const [hours, minutes] = endTime.split(":");
    const expiry = new Date(endDate);
    expiry.setHours(parseInt(hours), parseInt(minutes), 0);
    return new Date() > expiry;
  };

  const getMultiEntryStatus = (invite: Invitation) => {
    if (invite.is_cancelled) {
      return { label: "CANCELLED", container: "bg-rose-100", text: "text-rose-700" };
    }

    const now = new Date();
    const toLocalDateStr = (d: any): string => {
      if (!d) return "";
      return new Date(d).toLocaleDateString('en-CA'); 
    };

    const todayStr = toLocalDateStr(now); 
    const checkinDateStr = toLocalDateStr(invite.actual_checkin_date);
    const checkoutDateStr = toLocalDateStr(invite.actual_checkout_date);

    // console.log(`Sync Check - Local Today: ${todayStr}, DB In: ${checkinDateStr}`);

    const [endH, endM] = invite.end_time.split(":");
    const overallExpiry = new Date(invite.end_date);
    overallExpiry.setHours(parseInt(endH), parseInt(endM), 0);
    
    if (now > overallExpiry) {
      return { label: "EXPIRED", container: "bg-rose-50", text: "text-rose-500" };
    }

    if (invite.excluded_dates?.includes(todayStr)) {
      return { label: "NOT ALLOWED TODAY", container: "bg-amber-100", text: "text-amber-700" };
    }

    const isCheckedInToday = checkinDateStr === todayStr;
    const isCheckedOutToday = checkoutDateStr === todayStr;

    if ((invite.status === 'checked_in' || isCheckedInToday) && !isCheckedOutToday) {
      const [h, m] = invite.end_time.split(":");
      const todayCutoff = new Date();
      todayCutoff.setHours(parseInt(h), parseInt(m), 0);

      if (now > todayCutoff) {
        return { label: "OVERSTAYED", container: "bg-red-100", text: "text-red-700" };
      }
      return { label: "INSIDE", container: "bg-emerald-100", text: "text-emerald-700" };
    }

    if (isCheckedOutToday) {
      return { label: "DEPARTED TODAY", container: "bg-blue-100", text: "text-blue-700" };
    }

    const startDate = toLocalDateStr(invite.start_date);
    const endDate = toLocalDateStr(invite.end_date);
    
    if (startDate && endDate && todayStr >= startDate && todayStr <= endDate) {
      return { label: "NOT ARRIVED TODAY", container: "bg-slate-100", text: "text-slate-500" };
    }

    return { label: "UPCOMING", container: "bg-slate-50", text: "text-slate-400" };
  };

  const getStatusDetails = (status: string, isExpired: boolean, startDate: string, isCancelled: boolean) => {
    if (isCancelled) {
      return { label: "CANCELLED", container: "bg-rose-100", text: "text-rose-700" };
    }

    const now = new Date();
    const start = new Date(startDate);
    
    // Reset hours to 0 for a clean "day-by-day" comparison
    const today = new Date(now.setHours(0, 0, 0, 0));
    const startDay = new Date(start.setHours(0, 0, 0, 0));

    // 1. Check if the invitation hasn't started yet
    if (status === "pending" && today < startDay) {
      return { 
        label: "UPCOMING", 
        container: "bg-indigo-50", 
        text: "text-indigo-500" 
      };
    }

    // 2. Check if the invitation is past its end date/time
    if (status === "pending" && isExpired) {
      return { 
        label: "EXPIRED", 
        container: "bg-rose-50", 
        text: "text-rose-500" 
      };
    }

    // 3. Normal Status Switch
    switch (status) {
      case "pending":
        return { 
          label: "NOT ARRIVED", 
          container: "bg-slate-100", 
          text: "text-slate-600" 
        };
      case "checked_in":
        return { 
          label: "INSIDE", 
          container: "bg-emerald-100", 
          text: "text-emerald-700" 
        };
      case "checked_out":
        return { 
          label: "DEPARTED", 
          container: "bg-blue-100", 
          text: "text-blue-700" 
        };
      case "overstayed":
        return { 
          label: "OVERSTAYED", 
          container: "bg-amber-100", 
          text: "text-amber-700" 
        };
      default:
        return { 
          label: status.toUpperCase(), 
          container: "bg-slate-100", 
          text: "text-slate-600" 
        };
    }
  };

  const canActionExecute = (label: string) => {
    const allowed = ["NOT ARRIVED", "NOT ARRIVED TODAY", "INSIDE", "ARRIVED TODAY"];
    return allowed.includes(label);
  };

  const handleLogActivity = async (inviteId: string, currentLabel: string) => {
    setUpdatingInvite(inviteId);
    const invite = invitations.find(i => i.id === inviteId);
    if (!invite) return;
    
    const action = currentLabel === "INSIDE" ? "check_out" : "check_in"; 

    if (action === "check_in") {
      const now = new Date();
      
      // Parse Start and End times for today
      const [startH, startM] = invite.start_time.split(":");
      const [endH, endM] = invite.end_time.split(":");

      const todayStart = new Date();
      todayStart.setHours(parseInt(startH), parseInt(startM), 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(parseInt(endH), parseInt(endM), 0, 0);

      // 1. Block Early Check-in
      if (now < todayStart) {
        alert(`Access Denied: It's too early. Check-in starts at ${invite.start_time.slice(0, 5)}.`);
        setUpdatingInvite(null);
        return;
      }

      // 2. Block Late Check-in
      if (now > todayEnd) {
        alert(`Access Denied: Entry window ended at ${invite.end_time.slice(0, 5)}.`);
        return;
      }

      // 3. Block Overall Expiry (Single Entry)
      if (isPastTime(invite.end_date, invite.end_time)) {
        alert("Access Denied: This invitation has officially expired.");
        return;
      }
    }

    try {
      const result = await logActivityApi(inviteId, action);

      if (!result.success) {
        // Handle logic errors (e.g., "Invitation Expired")
        alert(result.error);
        return;
      }

      if (result.invitation) {
        setInvitations((prev) =>
          prev.map((inv) => (inv.id === inviteId ? result.invitation! : inv))
        );
        console.log(`Successfully logged ${action}`);
      }
    } catch (error) {
      console.error("Critical Log Activity Error:", error);
      alert("A network error occurred. Please try again.");
    } finally {
      setUpdatingInvite(null);
    }
  };

  const filteredInvites = invitations.filter(inv => 
    inv.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.access_code.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 font-bold animate-pulse">Retrieving Estate Invitations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex md:flex-row gap-4 justify-between items-center bg-white p-4 border rounded-2xl border-slate-100 shadow-sm h-15">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search guest or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
          />
        </div>
        <button 
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2.5 text-indigo-600 font-bold hover:bg-indigo-50 rounded-xl transition-all text-sm"
        >
          <RefreshCcw size={16} /> Refresh Feed
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-[70vh] overflow-auto pr-2 custom-scrollbar">     
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvites.map((invite) => {
              const isExpired = isPastTime(invite.end_date, invite.end_time);
              // const isPending = invite.status === "pending";
              const isExpanded = expandedId === invite.id;
              const isMultiEntry = invite.invite_type === "multi_entry";
              // const isDone = invite.status === "checked_out" || (isPending && isExpired);
              const statusDetails = isMultiEntry 
                ? getMultiEntryStatus(invite) 
                : getStatusDetails(invite.status, isExpired, invite.start_date, invite.is_cancelled);
              
              return (              
                <div 
                  key={invite.id}
                  className={`group relative bg-white rounded-[2.5rem] border-t-4 ${
                    isMultiEntry ? 'border-indigo-500' : 'border-emerald-500'
                  } shadow-sm hover:shadow-xl transition-all duration-300 p-3 flex flex-col ${
                    invite.is_cancelled ? 'grayscale-[0.5] opacity-70' : ''
                  }`}
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden">
                          {invite.guest_image_url ? (
                            <img src={invite.guest_image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User className="text-slate-400" size={24} />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 leading-tight truncate max-w-30">{invite.guest_name}</h3>
                          <div className="flex items-center gap-1">
                            <Fingerprint size={10} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                              {invite.invite_type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`${statusDetails.container} px-2.5 py-1 rounded-lg`}>
                        <span className={`${statusDetails.text} text-[9px] font-black uppercase`}>
                          {statusDetails.label}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-4 text-center mb-4 shadow-lg shadow-slate-200">
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-1">Access Code</p>
                      <div className="text-3xl font-mono font-black text-white tracking-[0.15em]">
                        {invite.access_code}
                      </div>
                    </div>

                    <div className="space-y-2 px-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center text-slate-400 font-medium italic">
                            <Calendar size={12} className="mr-1.5 text-indigo-400" /> Validity
                        </div>
                        <span className="text-slate-700 font-bold">
                          {new Date(invite.start_date).toLocaleDateString('en-GB')} {isMultiEntry && `- ${new Date(invite.end_date).toLocaleDateString('en-GB')}`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center text-slate-400 font-medium italic">
                            <Clock size={12} className="mr-1.5 text-indigo-400" /> Hours
                        </div>
                        <span className="text-slate-700 font-bold">
                          {invite.start_time.slice(0,5)} — {invite.end_time.slice(0,5)}
                        </span>
                      </div>
                      {statusDetails.label === "OVERSTAYED" && (
                        <p className="text-[10px] text-red-600 font-bold mt-1 animate-pulse">
                          Shift ended at {invite.end_time.slice(0,5)}
                        </p>
                      )}
                    </div>

                    {/* Expansion for Multi-Entry Dates */}
                    {isMultiEntry && (
                      <div className="mt-4 pt-3 border-t border-slate-50">
                        <button 
                          onClick={() => toggleExpand(invite.id)}
                          className="flex items-center justify-between w-full text-slate-400 hover:text-indigo-500 transition-colors"
                        >
                          <span className="text-[9px] font-bold uppercase tracking-wider">Exclusion Dates</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        
                        {isExpanded && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {invite.excluded_dates && invite.excluded_dates.length > 0 ? (
                              invite.excluded_dates.map((date: string) => (
                                <span key={date} className="bg-rose-50 text-rose-600 text-[9px] px-2 py-0.5 rounded border border-rose-100 font-bold">
                                  {date.split("-").reverse().join("/")}
                                </span>
                              ))
                            ) : (
                              <span className="text-[9px] text-slate-300 italic">No exclusions set</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className='flex justify-between'>
                    <div className="mt-auto w-fit">
                      {canActionExecute(statusDetails.label) ? (
                        <button 
                          onClick={() => handleLogActivity(invite.id, statusDetails.label)}
                          className={`w-full p-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                            statusDetails.label === 'INSIDE' 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-slate-900 hover:bg-black text-white'
                          }`}
                        >
                          {updatingInvite === invite.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin" /> Processing...
                            </div>
                          ) : statusDetails.label === 'INSIDE' ? (
                            <><LogOut size={16} /> CHECK OUT</>
                          ) : (
                            <><LogIn size={16} /> CHECK IN</>
                          )}
                        </button>
                      ) : (
                        <div className="w-full p-3 rounded-2xl bg-slate-200 border border-slate-100 text-slate-500 text-center text-xs font-bold flex items-center justify-center gap-2">
                          <Lock size={14} /> ACCESS RESTRICTED
                        </div>
                      )}
                    </div>
                    <div>
                      <button 
                        onClick={() => setSelectedInvite(invite)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                      >
                        <Info size={20} />
                      </button>
                    </div>
                  </div>
                </div>
            )})}
          </div>
        </div>
      </div>
      <InvitationDetailModal 
        invite={selectedInvite} 
        onClose={() => setSelectedInvite(null)} 
        statusDetails={selectedInvite ? (selectedInvite.invite_type === 'multi_entry' ? getMultiEntryStatus(selectedInvite) : getStatusDetails(selectedInvite.status, isPastTime(selectedInvite.end_date, selectedInvite.end_time), selectedInvite.start_date, selectedInvite.is_cancelled)) : null}
      />
    </div>
  );
}

function Ticket({ className, size }: { className?: string, size?: number }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="m9 12 2 2 4-4"/></svg>;
}