'use client';

import React, { useState } from "react";
import { UserMinus, ShieldCheck, Mail, Info } from "lucide-react";

interface BlockedUser {
  id: string;
  name: string;
  email: string;
}

interface BlockedUsersListProps {
  users: BlockedUser[];
  onUnblock: (id: string) => void;
  loading?: boolean;
}

const SecurityBlockedUsersList: React.FC<BlockedUsersListProps> = ({ 
  users, 
  onUnblock, 
  loading = false 
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUnblock = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to restore access for ${name}?`)) return;

    setProcessingId(id);
    try {
      onUnblock(id);
    } catch (err) {
      alert("Failed to unblock user. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // const MultipliedUsers = Array(16).fill(users).flat();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
        <p className="text-slate-500 animate-pulse font-medium">Fetching restricted accounts...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center flex flex-col items-center">
        <ShieldCheck className="text-slate-300 mb-2" size={40} />
        <p className="text-slate-500 font-medium">No blocked users in this estate.</p>
      </div>
    );
  }

 return (
    <div className="space-y-4 px-1 sm:px-0">
      {/* Informational Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 flex gap-3 items-start sm:items-center mb-6">
        <Info className="text-slate-400 shrink-0" size={20} />
        <p className="text-[13px] sm:text-sm text-slate-600 leading-tight">
          Users in this list cannot submit new join requests. Unblocking them allows them to re-apply.
        </p>
      </div>

      {/* CHANGED: Removed grid-cols-2 to make cards full width */}
      <div className="flex flex-col gap-3 h-[calc(100vh-450px)] overflow-y-auto p-3"> 
        {users.map((user) => (
          <div 
            key={user.id} 
            className="flex flex-row justify-between items-center bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm transition-all hover:border-red-100 gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-full flex items-center justify-center border border-red-100 shrink-0">
                <span className="text-red-600 font-bold text-base sm:text-lg">{user.name[0]}</span>
              </div>
              
              <div className="flex flex-col overflow-hidden">
                <span className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">
                  {user.name}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={12} className="shrink-0" /> {user.email}
                </span>
              </div>
            </div>

            {/* CHANGED: Removed w-full to keep button compact on the right */}
            <button
              onClick={() => handleUnblock(user.id, user.name)}
              disabled={processingId === user.id}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-bold border transition-all shrink-0 ${
                processingId === user.id
                  ? "bg-slate-100 text-slate-400 border-slate-100"
                  : "bg-slate-900 text-white border-slate-900 active:scale-95 hover:bg-slate-800"
              }`}
            >
              <UserMinus size={16} />
              {processingId === user.id ? "Processing..." : "Unblock"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBlockedUsersList;