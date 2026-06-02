"use client";

import React, { useState } from "react";
import { UserMinus, ShieldCheck, Mail, Info, Loader2 } from "lucide-react";

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
  loading = false,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleUnblock = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to restore access for ${name}?`))
      return;

    setProcessingId(id);
    try {
      await onUnblock(id);
    } catch (err) {
      alert("Failed to unblock user. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center font-sans">
        <p className="text-slate-400 animate-pulse font-medium text-sm">
          Fetching restricted accounts...
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center flex flex-col items-center font-sans">
        <ShieldCheck className="text-slate-300 mb-2" size={40} />
        <p className="text-slate-400 font-medium text-sm">
          No blocked users in this estate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-1 sm:px-0 font-sans">
      {/* Informational Banner */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 sm:p-4 flex gap-3 items-start sm:items-center mb-6">
        <Info className="text-slate-400 shrink-0" size={18} />
        <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-medium">
          Users in this list cannot submit new join requests. Unblocking them
          allows them to re-apply.
        </p>
      </div>

      {/* Main Restricted Users Container */}
      <div className="flex flex-col gap-3 h-[calc(100vh-450px)] overflow-y-auto p-1 custom-scrollbar">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex flex-row justify-between items-center bg-white border border-slate-200/70 rounded-2xl p-4 sm:p-5 shadow-2xs transition-all hover:border-rose-100 gap-4 min-w-0"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <div className="w-11 h-11 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100/50 shrink-0">
                <span className="text-rose-600 font-montserrat font-black text-base uppercase">
                  {user.name[0]}
                </span>
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-base font-montserrat font-bold text-slate-800 tracking-tight leading-tight truncate block w-full">
                  {user.name}
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate block w-full">
                  <Mail size={12} className="text-slate-300 shrink-0" />{" "}
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleUnblock(user.id, user.name)}
              disabled={processingId === user.id}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider border transition-all shrink-0 shadow-3xs active:scale-98 ${
                processingId === user.id
                  ? "bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed"
                  : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800"
              }`}
            >
              {processingId === user.id ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UserMinus size={13} />
                  <span>Unblock</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SecurityBlockedUsersList;
