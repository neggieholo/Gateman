/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { SecurityJoinRequest } from "../services/types";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Ban,
  ExternalLink,
  Loader2,
} from "lucide-react";

interface SecurityJoinRequestsListProps {
  requests: SecurityJoinRequest[];
  onApprove: (id: string) => Promise<void>;
  onDecline: (id: string, feedback: string) => Promise<void>;
  onBlock: (id: string, feedback: string) => Promise<void>;
  loading?: boolean;
  hideTabs: (hide: boolean) => void;
}

const SecurityJoinRequestsList: React.FC<SecurityJoinRequestsListProps> = ({
  requests,
  onApprove,
  onDecline,
  onBlock,
  loading = false,
  hideTabs,
}) => {
  const [selectedRequest, setSelectedRequest] =
    useState<SecurityJoinRequest | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showPrompt, setShowPrompt] = useState<{
    id: string;
    type: "decline" | "block";
  } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingApproveAction, setLoadingApproveAction] = useState(false);

  const confirmAction = async () => {
    if (!showPrompt) return;

    setLoadingAction(true);

    try {
      await (showPrompt.type === "decline"
        ? onDecline(showPrompt.id, feedback)
        : onBlock(showPrompt.id, feedback));

      setFeedback("");
      setShowPrompt(null);
      setSelectedRequest(null);
    } catch (err: any) {
      console.error(`Failed to ${showPrompt.type}:`, err);
      alert(
        err.message || `An error occurred while trying to ${showPrompt.type}.`,
      );
    } finally {
      setLoadingAction(false);
    }
  };

  const handleApprove = async (id: string) => {
    setLoadingApproveAction(true);
    try {
      await onApprove(id);
      setSelectedRequest(null);
    } catch (err) {
      alert("Failed to approve request");
    } finally {
      setLoadingApproveAction(false);
    }
  };

  useEffect(() => {
    hideTabs(!!selectedRequest);
  }, [selectedRequest, hideTabs]);

  const KYCDetailView = ({ req }: { req: SecurityJoinRequest }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-y-auto h-[calc(100vh-300px)] flex flex-col font-sans">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex sm:flex-row flex-col gap-3 justify-between sm:items-center min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-montserrat font-black text-slate-800 tracking-tight truncate block w-full">
            {req.name}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5 truncate block w-full">
            {req.email}
          </p>
          <p className="text-xs text-slate-400 font-semibold mt-0.5 tracking-wide font-mono">
            {req.phone}
          </p>
        </div>
        <button
          onClick={() => setSelectedRequest(null)}
          className="flex items-center gap-1.5 text-blue-600 font-montserrat font-bold text-xs uppercase tracking-wider hover:text-blue-700 transition-colors shrink-0 self-start sm:self-center"
        >
          <ArrowLeft size={14} /> Back to list
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-blue-50/40 border border-blue-100/30 p-4 rounded-xl">
          <p className="text-xs text-slate-600 font-medium">
            <strong className="text-slate-400 font-normal uppercase font-oswald tracking-wide mr-1">
              ID Type:
            </strong>{" "}
            <span className="uppercase font-oswald font-bold text-blue-600 tracking-wider">
              {req.id_type}
            </span>
          </p>
          <p className="text-xs text-slate-600 font-medium">
            <strong className="text-slate-400 font-normal uppercase font-oswald tracking-wide mr-1">
              Requested:
            </strong>{" "}
            <span className="font-oswald font-bold text-slate-700 tracking-wide">
              {new Date(req.requested_at).toLocaleString()}
            </span>
          </p>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocPreview url={req.selfie_url} label="Selfie" />
          <DocPreview url={req.id_front_url} label="ID Front" />
          <DocPreview url={req.id_back_url} label="ID Back" />
        </div>
      </div>

      {/* Admin Action Row */}
      <div className="flex flex-wrap gap-3 items-center p-4 bg-slate-50/60 border-t border-slate-100">
        <button
          onClick={() => handleApprove(req.id)}
          className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-4 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all shadow-2xs shadow-emerald-100 active:scale-98"
        >
          {loadingApproveAction && req.id === selectedRequest?.id ? (
            <>
              <Loader2 className="animate-spin" size={14} /> Processing...
            </>
          ) : (
            <>
              <Check size={14} /> Accept
            </>
          )}
        </button>
        <button
          onClick={() => setShowPrompt({ id: req.id, type: "decline" })}
          className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-2.5 px-4 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all shadow-2xs shadow-amber-100 active:scale-98"
        >
          <X size={14} /> Decline
        </button>
        <button
          onClick={() => setShowPrompt({ id: req.id, type: "block" })}
          className="flex-1 sm:flex-initial min-w-[120px] flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 px-4 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all shadow-2xs shadow-rose-100 active:scale-98"
        >
          <Ban size={14} /> Block
        </button>
      </div>
    </div>
  );

  const DocPreview = ({ url, label }: { url?: string; label: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 p-1 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ExternalLink size={12} />
          </a>
        )}
      </div>
      {url ? (
        <img
          src={url}
          className="w-full h-44 object-cover rounded-xl border border-slate-200/60 bg-slate-50"
          alt={label}
        />
      ) : (
        <div className="w-full h-44 bg-slate-50/50 border-2 border-dashed border-slate-200/60 rounded-xl flex flex-col items-center justify-center p-4 text-center">
          <span className="text-slate-300 text-xs italic font-medium">
            No document provided
          </span>
        </div>
      )}
    </div>
  );

  return (
    <>
      {selectedRequest ? (
        <KYCDetailView req={selectedRequest} />
      ) : requests.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border-2 border-dashed border-slate-200/60 text-center font-sans">
          <p className="text-slate-400 font-medium text-sm">
            {loading
              ? "Loading personnel requests..."
              : "No pending registration requests"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 h-[calc(100vh-380px)] overflow-y-auto p-1 font-sans custom-scrollbar">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-4 bg-white border border-slate-200/70 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all duration-200 group min-w-0"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100/50 shrink-0">
                  <span className="text-blue-600 font-montserrat font-black text-base uppercase">
                    {req.name[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-base font-montserrat font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate w-full tracking-tight">
                    {req.name}
                  </span>
                  <span className="block text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                    Received: {new Date(req.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(req)}
                className="flex items-center gap-1.5 bg-slate-50 text-blue-600 px-4 py-2.5 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider border border-slate-100 hover:bg-blue-600 hover:text-white transition-all shrink-0 shadow-3xs active:scale-98"
              >
                Details <ArrowRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Global Confirmation Modal */}
      {showPrompt && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100/80 font-sans">
            <h3 className="text-base font-montserrat font-black text-slate-800 tracking-tight mb-2">
              Provide justification for{" "}
              {showPrompt.type === "block" ? "blocking" : "declining"}?
            </h3>
            <textarea
              className="w-full border border-slate-200 rounded-xl p-3 text-sm h-28 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none text-slate-700 placeholder:text-slate-400 transition-all font-medium resize-none"
              placeholder={
                showPrompt.type === "block"
                  ? "e.g. Identity verification failed or unauthorized credentials."
                  : "e.g. Uploaded document is unclear, please resubmit a legible image."
              }
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowPrompt(null)}
                className="flex-1 py-2.5 text-slate-400 font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={loadingAction}
                className={`flex-1 py-2.5 text-white rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-98 ${
                  loadingAction
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:opacity-95"
                } ${
                  showPrompt.type === "block"
                    ? "bg-rose-600 shadow-rose-100"
                    : "bg-blue-600 shadow-blue-100"
                }`}
              >
                {loadingAction ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>
                    {showPrompt.type === "block"
                      ? "Block Personnel"
                      : "Decline Access"}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecurityJoinRequestsList;
