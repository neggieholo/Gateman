import React, { useEffect, useState } from "react";
import { JoinRequest } from "../types";
import JoinRequestsList from "./JoinRequestsList";
import { db } from "../services/database";

const JoinRequestsPage = () => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [pendingRequests, setPendingRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await db.getAllRequests();
        // Only keep pending requests
        setPendingRequests(data.filter((r) => r.status === "PENDING"));
      } catch (err) {
        console.error("Failed to fetch join requests:", err);
      }
    };
    fetchRequests();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/admin/approve-tenant/${id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to approve request");

      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not approve join request. Please try again.");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      const res = await fetch(`${baseUrl}/admin/join-request/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to decline request");

      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not decline join request. Please try again.");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Join Requests</h2>
      <JoinRequestsList
        requests={pendingRequests}
        onApprove={handleApprove}
        onDecline={handleDecline}
      />
    </div>
  );
};

export default JoinRequestsPage;
