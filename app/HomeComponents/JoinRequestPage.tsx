/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { JoinRequest } from "../services/types";
import JoinRequestsList from "./JoinRequestsList";
import { db } from "../services/database";
import BlockedUsersList from "./BlockedUsersList";
import { BlockedUser } from "../services/types";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./Users";
import toast from "react-hot-toast";

interface JoinReqProps {
  onApprove?: () => void;
}

export default function JoinRequestsPage({ onApprove }: JoinReqProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const { user, contextEstateId } = useUser();
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "blocked">("pending");
  const [hideTabs, setHideTabs] = useState<boolean>(false);

  const canView =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("view_residents") ||
    user?.permissions?.includes("all-access");

  const canMangeRequests =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("manage_join_requests") ||
    user?.permissions?.includes("all-access");

  const loadData = useCallback(async () => {
    if (!contextEstateId) return;

    setLoading(true);
    try {
      const [requestsData, blockedData] = await Promise.all([
        db.getAllRequests(contextEstateId),
        db.fetchBlocked(contextEstateId),
      ]);

      setPendingRequests(requestsData.filter((r) => r.status === "PENDING"));
      setBlockedUsers(blockedData);
    } catch (err) {
      console.error("Data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [contextEstateId]);

  // Run once on mount to get all counts
  useEffect(() => {
    if (!canView) {
      showAccessDeniedToast();
      return;
    }
    loadData();
  }, [canView, loadData]);

  const handleApprove = async (id: string) => {
    if (!canMangeRequests) {
      showAccessDeniedToast();
      return;
    }
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/approve-tenant/${id}?estate_id=${contextEstateId}`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!res.ok) throw new Error("Failed to approve request");

      loadData();
      if (onApprove) onApprove();
    } catch (err) {
      console.error(err);
      toast.error("Could not approve join request. Please try again.");
    }
  };

  const handleDecline = async (id: string, feedback: string) => {
    if (!canMangeRequests) {
      showAccessDeniedToast();
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/admin/join-request/delete`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          message: feedback,
          estate_id: contextEstateId,
        }),
      });

      if (!res.ok) throw new Error("Failed to decline request");

      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Could not decline join request. Please try again.");
    }
  };

  const handleBlock = async (id: string, feedback: string) => {
    if (!canMangeRequests) {
      showAccessDeniedToast();
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/admin/join-request/block`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          message: feedback,
          estate_id: contextEstateId,
        }),
      });

      if (!res.ok) throw new Error("Failed to block request");

      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Could not block join request. Please try again.");
    }
  };

  const onUnblockAction = async (id: string) => {
    if (!canMangeRequests) {
      showAccessDeniedToast();
      return;
    }
    try {
      await db.handleUnblock(id, contextEstateId!);
      loadData();
    } catch (err) {
      toast.error("Could not unblock user.");
    }
  };

  return (
    <div className="p-4 sm:p-6 font-sans">
      {/* --- Tab Navigation --- */}
      {!hideTabs && (
        <div className="flex flex-wrap gap-1 mb-8 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 sm:flex-initial text-center px-4 sm:px-6 py-2.5 rounded-lg font-montserrat font-black text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pending Requests{" "}
            <span className="font-oswald text-xs ml-0.5">
              ({pendingRequests.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("blocked")}
            className={`flex-1 sm:flex-initial text-center px-4 sm:px-6 py-2.5 rounded-lg font-montserrat font-black text-xs sm:text-sm uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "blocked"
                ? "bg-white text-red-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Blocked Users{" "}
            <span className="font-oswald text-xs ml-0.5">
              ({blockedUsers.length})
            </span>
          </button>
        </div>
      )}

      {/* --- Conditional List Rendering --- */}
      {activeTab === "pending" ? (
        <JoinRequestsList
          requests={pendingRequests}
          onApprove={handleApprove}
          onDecline={handleDecline}
          onBlock={handleBlock}
          hideTabs={(hide: boolean) => setHideTabs(hide)}
          loading={loading}
        />
      ) : (
        <BlockedUsersList
          users={blockedUsers}
          onUnblockSuccess={onUnblockAction}
          loading={loading}
        />
      )}
    </div>
  );
}
