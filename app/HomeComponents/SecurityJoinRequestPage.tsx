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
      const [requests, blockedUsers] = await Promise.all([
        securityDb.getSecurityRequests(),
        securityDb.fetchBlockedGuards(),
      ]);

      setPendingRequests(requests.filter((r) => r.status === "PENDING"));
      setBlockedUsers(blockedUsers);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run once on mount to get all counts
  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await securityDb.approveSecurity(id);

      if (!res.success) throw new Error("Failed to approve request");

      loadData();
    } catch (err) {
      console.error(err);
      alert("Could not approve join request. Please try again.");
    }
  };

  const handleDecline = async (id: string, feedback: string) => {
    try {
      const res = await securityDb.declineSecurity(id, feedback);

      if (!res.success) throw new Error("Failed to decline request");

      loadData();
    } catch (err) {
      console.error(err);
      alert("Could not decline join request. Please try again.");
    }
  };

  const handleBlock = async (id: string, feedback: string) => {
    try {
      console.log("Blocking req with ID:", id, "with feedback:", feedback);
      const res = await securityDb.blockSecurity(id, feedback);

      if (!res.success) throw new Error(res.error || "Failed to block request");

      loadData();
    } catch (err) {
      console.error(err);
      alert("Could not block join request. Please try again.");
    }
  };

  const onUnblockAction = async (id: string) => {
    try {
      const res = await securityDb.unblockSecurity(id);

      if (!res.success) throw new Error("Failed to unblock user");
      console.log("Unblock Data:", res);

      // setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
      loadData();
    } catch (err) {
      alert("Could not unblock user.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">
        Security Personnel Management
      </h2>

      {/* --- Tab Navigation --- */}
      {!hideTabs && (
        <div className="flex space-x-2 mb-8 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "pending"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "blocked"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Blocked Users ({blockedUsers.length})
          </button>
        </div>
      )}

      {/* --- Conditional List Rendering --- */}
      {activeTab === "pending" ? (
        <SecurityJoinRequestsList
          requests={pendingRequests}
          onApprove={handleApprove} // Logic from your previous snippet
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
  );
}
