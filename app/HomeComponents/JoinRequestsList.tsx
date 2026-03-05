import React, { useState } from "react";
import { JoinRequest } from "../types";
import { ChevronDown, Check, X } from "lucide-react";

interface JoinRequestsListProps {
  requests: JoinRequest[];
  onApprove: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

const JoinRequestsList: React.FC<JoinRequestsListProps> = ({ requests, onApprove, onDecline }) => {
 

  // Track which item is expanded
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleApprove = async (id: string) => {
    await onApprove(id);
  };

  const handleDecline = async (id: string) => {
    await onDecline(id);
  };

  if (requests.length === 0) {
    return <p className="text-gray-500">No pending join requests</p>;
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <div key={req.id} className="border rounded-md p-3  bg-white text-blue-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-slate-200 m-5">
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() => handleToggle(req.id)}
          >
            <span className="font-medium">{req.temp_tenant_name}</span> 
            {/* You can replace temp_tenant_id with name if you fetch it */}
            <ChevronDown className={`transition-transform ${expandedId === req.id ? "rotate-180" : ""}`} />
          </div>

          {expandedId === req.id && (
            <div className="mt-2 space-y-1">
              <p><strong>Unit:</strong> {req.unit || "-"}</p>
              <p><strong>Block:</strong> {req.block || "-"}</p>
              <p><strong>Status:</strong> {req.status}</p>
              <p><strong>Status:</strong> {req.temp_tenant_email}</p>
              <p><strong>Requested At:</strong> {new Date(req.requested_at).toLocaleString()}</p>
              <div className="flex gap-2 mt-2">
                <button
                  className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  onClick={() => handleApprove(req.id)}
                >
                  <Check size={16} /> Accept
                </button>
                <button
                  className="flex items-center gap-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => handleDecline(req.id)}
                >
                  <X size={16} /> Decline
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default JoinRequestsList;
