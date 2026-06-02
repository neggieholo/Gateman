/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { JoinRequest } from "../services/types";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Ban,
  ExternalLink,
  Loader2,
  FileText,
  Home,
} from "lucide-react";
import { useUser } from "../UserContext";

interface JoinRequestsListProps {
  requests: JoinRequest[];
  onApprove: (id: string) => Promise<void>;
  onDecline: (id: string, feedback: string) => Promise<void>;
  onBlock: (id: string, feedback: string) => Promise<void>;
  loading?: boolean;
  hideTabs: (hide: boolean) => void;
}

const JoinRequestsList: React.FC<JoinRequestsListProps> = ({
  requests,
  onApprove,
  onDecline,
  onBlock,
  loading = false,
  hideTabs,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(
    null,
  );
  const [feedback, setFeedback] = useState("");
  const [showPrompt, setShowPrompt] = useState<{
    id: string;
    type: "decline" | "block";
  } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [loadingApproveAction, setLoadingApproveAction] = useState(false);
  const { user } = useUser();

  // FIXED: Default fallback now strictly set to selfie and rent_contract ONLY
  const kycConfig = user?.kyc_selection || {
    ids: false,
    selfie: true,
    utility_bill: false,
    rent_contract: true,
  };

  useEffect(() => {
    hideTabs(!!selectedRequest);
  }, [selectedRequest, hideTabs]);

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

  const confirmAction = async () => {
    if (!showPrompt) return;
    setLoadingAction(true);
    try {
      if (showPrompt.type === "decline") {
        await onDecline(showPrompt.id, feedback);
      } else {
        await onBlock(showPrompt.id, feedback);
      }
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

  const KYCDetailView = ({ req }: { req: JoinRequest }) => {
    const locationAssets = React.useMemo(() => {
      if (!req.locations) return [];
      if (Array.isArray(req.locations)) return req.locations;
      try {
        return typeof req.locations === "string"
          ? JSON.parse(req.locations)
          : [];
      } catch {
        return [];
      }
    }, [req.locations]);

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[calc(100vh-100px)] p-4">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              {req.temp_tenant_name}
            </h3>
            <p className="text-sm text-slate-500">{req.temp_tenant_email}</p>
            <p className="text-sm text-slate-500">{req.temp_tenant_phone}</p>
          </div>
          <button
            onClick={() => setSelectedRequest(null)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-bold text-sm"
          >
            <ArrowLeft size={18} /> Back to list
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto ">
          {/* Summary Header Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50/70 p-4 rounded-xl border border-blue-100/50">
            {kycConfig.ids && req.id_type && (
              <p className="text-sm text-slate-700">
                <strong>ID Type:</strong>{" "}
                <span className="uppercase font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-xs">
                  {req.id_type}
                </span>
              </p>
            )}
            <p className="text-sm text-slate-700">
              <strong>Requested On:</strong>{" "}
              {new Date(req.requested_at).toLocaleString()}
            </p>
          </div>

          {/* DYNAMIC LOCATIONS & RENT CONTRACTS */}
          {kycConfig.rent_contract && (
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Home size={14} /> Assigned Locations & Contracts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {locationAssets.length > 0 ? (
                  locationAssets.map((blockGroup: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="text-sm font-bold text-slate-900 bg-slate-200/60 px-3 py-1 rounded-lg w-fit">
                        Block: {blockGroup.block}
                      </div>
                      <div className="space-y-2">
                        {blockGroup.units?.map(
                          (unitItem: any, uIdx: number) => (
                            <div
                              key={uIdx}
                              className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-lg shadow-sm"
                            >
                              <span className="text-sm font-medium text-slate-700">
                                Unit {unitItem.unit}
                              </span>
                              {unitItem.contract_url ? (
                                <a
                                  href={unitItem.contract_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                                >
                                  <FileText size={14} /> View Contract{" "}
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span className="text-xs text-amber-500 italic font-medium">
                                  No Contract Doc
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-4 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-400 italic">
                    No location units provided.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREDENTIALS ATTACHMENTS GRID */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Verification Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {kycConfig.selfie && (
                <DocPreview url={req.selfie_url} label="Selfie Image" />
              )}
              {kycConfig.ids && (
                <>
                  <DocPreview
                    url={req.id_front_url}
                    label="ID Document Front"
                  />
                  <DocPreview url={req.id_back_url} label="ID Document Back" />
                </>
              )}
              {kycConfig.utility_bill && (
                <DocPreview url={req.utility_bill_url} label="Utility Bill" />
              )}
            </div>
          </div>
        </div>
        {/* Action Row Buttons */}
        <div className="flex flex-row flex-wrap gap-3 mt-10 pt-6 border-t border-slate-100 m-2">
          <button
            onClick={() => handleApprove(req.id)}
            disabled={loadingApproveAction}
            className="w-32 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-shadow shadow-md disabled:opacity-50"
          >
            {loadingApproveAction ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <>
                <Check size={18} /> <span>Accept</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: "decline" })}
            className="w-32 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-shadow shadow-md"
          >
            <X size={18} /> Decline
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: "block" })}
            className="w-32 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-shadow shadow-md"
          >
            <Ban size={18} /> Block
          </button>
        </div>
      </div>
    );
  };

  const DocPreview = ({ url, label }: { url?: string; label: string }) => (
    <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/30">
      <div className="flex justify-between items-center">
        <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">
          {label}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {url ? (
        <img
          src={url}
          className="w-full h-44 object-cover rounded-lg border border-slate-200 bg-slate-100"
          alt={label}
        />
      ) : (
        <div className="w-full h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
          <span className="text-slate-300 text-xs italic font-semibold">
            Not Provided
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
        <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
          {loading ? "Loading..." : "No pending join requests"}
        </p>
      ) : (
        <div className="space-y-3 h-[calc(100vh-300px)] overflow-y-auto p-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 shrink-0 font-black text-lg">
                  {req.temp_tenant_name
                    ? req.temp_tenant_name[0].toUpperCase()
                    : "T"}
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {req.temp_tenant_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Received: {new Date(req.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(req)}
                className="flex items-center gap-2 bg-slate-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-black border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
              >
                See Details <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Decline/Block Reason Prompt Modal Overlay */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-black mb-2 text-slate-900">
              Add a reason for{" "}
              {showPrompt.type === "block" ? "blocking" : "declining"}?
            </h3>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-slate-800 font-medium"
              placeholder="e.g. Contract copy is unreadable, please upload a clearer scan."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowPrompt(null)}
                className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={loadingAction}
                className={`flex-1 py-2 text-white rounded-lg font-black transition-opacity flex items-center justify-center gap-2 text-sm shadow ${
                  loadingAction
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:opacity-90"
                } ${showPrompt.type === "block" ? "bg-red-600" : "bg-indigo-600"}`}
              >
                {loadingAction ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <span>
                    {showPrompt.type === "block" ? "Block" : "Decline"}
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

export default JoinRequestsList;
