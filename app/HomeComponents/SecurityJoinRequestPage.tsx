"use client";

import React, { useEffect, useState } from "react";
import { SecurityJoinRequest } from "../services/types";
import SecurityJoinRequestsList from "./SecurityJoinRequestList";
import { db, securityDb } from "../services/database";
import SecurityBlockedUsersList from "./SecurityBlockedUsersList";
import { BlockedUser } from "../services/types";

export default function SecurityJoinRequestsPage() {
  const [pendingRequests, setPendingRequests] = useState<SecurityJoinRequest[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "blocked">("pending");
  const [hideTabs, setHideTabs] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requests, blockedGuardsList] = await Promise.all([
        securityDb.getSecurityRequests(),
        securityDb.fetchBlockedGuards(),
      ]);

      setPendingRequests(requests.filter((r) => r.status === "PENDING"));
      setBlockedUsers(blockedGuardsList);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await securityDb.approveSecurity(id);
      if (!res.success) throw new Error("Failed to approve request");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Could not approve join request. Please try again.");
    }
  };

  const handleDecline = async (id: string, feedback: string) => {
    try {
      const res = await securityDb.declineSecurity(id, feedback);
      if (!res.success) throw new Error("Failed to decline request");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Could not decline join request. Please try again.");
    }
  };

  const handleBlock = async (id: string, feedback: string) => {
    try {
      const res = await securityDb.blockSecurity(id, feedback);
      if (!res.success) throw new Error(res.error || "Failed to block request");
      await loadData();
    } catch (err) {
      console.error(err);
      alert("Could not block join request. Please try again.");
    }
  };

  const onUnblockAction = async (id: string) => {
    try {
      const res = await securityDb.unblockSecurity(id);
      if (!res.success) throw new Error("Failed to unblock user");
      await loadData();
    } catch (err) {
      alert("Could not unblock user.");
    }
  };

  return (
    <div className="p-3 sm:p-6 font-sans">
      <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-800 mb-6 sm:mb-8 tracking-tight">
        Security Personnel Management
      </h2>

      {/* --- Tab Navigation Container --- */}
      {!hideTabs && (
        <div className="flex space-x-1 mb-8 bg-slate-200/60 p-1 rounded-xl w-full sm:w-fit border border-slate-200/20">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-98 ${
              activeTab === "pending"
                ? "bg-white text-blue-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Pending Requests</span>
            <span className="font-oswald text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-slate-200">
              {pendingRequests.length}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab("blocked")}
            className={`flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-98 ${
              activeTab === "blocked"
                ? "bg-white text-rose-600 shadow-2xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>Blocked Users</span>
            <span className="font-oswald text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-600">
              {blockedUsers.length}
            </span>
          </button>
        </div>
      )}

      {/* --- Conditional List Sub-view Dashboard Window --- */}
      <div className="bg-transparent rounded-2xl">
        {activeTab === "pending" ? (
          <SecurityJoinRequestsList
            requests={pendingRequests}
            onApprove={handleApprove}
            onDecline={handleDecline}
            onBlock={handleBlock}
            hideTabs={(hide: boolean) => setHideTabs(hide)}
            loading={loading}
          />
        ) : (
          <SecurityBlockedUsersList
            users={blockedUsers}
            onUnblock={onUnblockAction}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}