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
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col h-[calc(100vh-100px)] p-3 sm:p-4 font-sans min-w-0">
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 min-w-0">
          <div className="min-w-0 w-full sm:w-auto">
            <h3 className="text-lg sm:text-xl font-montserrat font-black text-slate-900 break-words">
              {req.temp_tenant_name}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 truncate block w-full">
              {req.temp_tenant_email}
            </p>
            <p className="text-xs sm:text-sm font-oswald text-slate-500 tracking-wide mt-0.5">
              {req.temp_tenant_phone}
            </p>
          </div>
          <button
            onClick={() => setSelectedRequest(null)}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors font-montserrat font-bold text-xs uppercase tracking-wider self-start sm:self-center shrink-0"
          >
            <ArrowLeft size={16} /> Back to list
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 flex-1 overflow-y-auto min-w-0 custom-scrollbar">
          {/* Summary Header Line */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-blue-50/70 p-4 rounded-xl border border-blue-100/50 min-w-0">
            {kycConfig.ids && req.id_type && (
              <p className="text-xs sm:text-sm text-slate-700 truncate">
                <strong>ID Type:</strong>{" "}
                <span className="uppercase font-oswald font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[10px] tracking-wide ml-1">
                  {req.id_type}
                </span>
              </p>
            )}
            <p className="text-xs sm:text-sm text-slate-700 font-sans">
              <strong>Requested On:</strong>{" "}
              <span className="font-oswald text-slate-600 tracking-wide">
                {new Date(req.requested_at).toLocaleString()}
              </span>
            </p>
          </div>

          {/* DYNAMIC LOCATIONS & RENT CONTRACTS */}
          {kycConfig.rent_contract && (
            <div className="space-y-3 min-w-0 w-full">
              <h4 className="text-[10px] font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                <Home size={14} /> Assigned Locations & Contracts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                {locationAssets.length > 0 ? (
                  locationAssets.map((blockGroup: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3 min-w-0"
                    >
                      <div className="text-xs font-oswald font-bold text-slate-900 bg-slate-200/60 px-2.5 py-0.5 rounded w-fit uppercase tracking-wide">
                        Block: {blockGroup.block}
                      </div>
                      <div className="space-y-2 min-w-0">
                        {blockGroup.units?.map(
                          (unitItem: any, uIdx: number) => (
                            <div
                              key={uIdx}
                              className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-lg shadow-sm min-w-0 gap-2"
                            >
                              <span className="text-xs font-medium text-slate-700 truncate">
                                Unit {unitItem.unit}
                              </span>
                              {unitItem.contract_url ? (
                                <a
                                  href={unitItem.contract_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-[11px] font-montserrat font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-md transition-colors shrink-0"
                                >
                                  <FileText size={14} />{" "}
                                  <span>View Contract</span>{" "}
                                  <ExternalLink size={12} />
                                </a>
                              ) : (
                                <span className="text-[11px] text-amber-500 italic font-medium shrink-0">
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
                  <div className="col-span-1 md:col-span-2 p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                    No location units provided.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CREDENTIALS ATTACHMENTS GRID */}
          <div className="space-y-3 min-w-0 w-full">
            <h4 className="text-[10px] font-montserrat font-black text-slate-400 uppercase tracking-wider shrink-0">
              Verification Credentials
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:grid-cols-2 sm:gap-6 min-w-0">
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
        <div className="flex flex-row flex-wrap gap-2 sm:gap-3 mt-4 sm:mt-10 pt-4 sm:pt-6 border-t border-slate-100 shrink-0">
          <button
            onClick={() => handleApprove(req.id)}
            disabled={loadingApproveAction}
            className="flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 bg-green-600 text-white py-2.5 sm:py-3 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {loadingApproveAction ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <>
                <Check size={16} /> <span>Accept</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: "decline" })}
            className="flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 bg-amber-500 text-white py-2.5 sm:py-3 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-amber-600 transition-colors shadow-sm"
          >
            <X size={16} /> <span>Decline</span>
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: "block" })}
            className="flex-1 min-w-[5.5rem] flex items-center justify-center gap-1.5 bg-red-600 text-white py-2.5 sm:py-3 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-colors shadow-sm"
          >
            <Ban size={16} /> <span>Block</span>
          </button>
        </div>
      </div>
    );
  };

  const DocPreview = ({ url, label }: { url?: string; label: string }) => (
    <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/30 min-w-0 w-full">
      <div className="flex justify-between items-center min-w-0 gap-2">
        <span className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wide truncate">
          {label}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {url ? (
        <img
          src={url}
          className="w-full h-36 sm:h-44 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
          alt={label}
        />
      ) : (
        <div className="w-full h-36 sm:h-44 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-slate-300 text-xs italic font-semibold font-sans">
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
        <p className="text-slate-400 p-5 bg-white rounded-lg border border-dashed text-center font-sans text-xs font-medium">
          {loading ? "Loading dynamic assets..." : "No pending join requests"}
        </p>
      ) : (
        <div className="space-y-3 h-[calc(100vh-300px)] overflow-y-auto p-1 sm:p-3 custom-scrollbar font-sans min-w-0">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all group min-w-0"
            >
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 shrink-0 font-montserrat font-black text-base sm:text-lg">
                  {req.temp_tenant_name
                    ? req.temp_tenant_name[0].toUpperCase()
                    : "T"}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm sm:text-base font-montserrat font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate block w-full">
                    {req.temp_tenant_name}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-oswald uppercase tracking-wide mt-0.5">
                    Received: {new Date(req.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(req)}
                className="flex items-center justify-center gap-1.5 bg-slate-50 text-indigo-600 px-4 py-2 rounded-lg text-xs sm:text-sm font-montserrat font-black border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm shrink-0 w-full sm:w-auto"
              >
                <span>See Details</span> <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Decline/Block Reason Prompt Modal Overlay */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xs flex items-center justify-center p-4 z-50 font-sans">
          <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150 text-left">
            <h3 className="text-sm sm:text-base font-montserrat font-black mb-2 text-slate-900 uppercase tracking-wide">
              Add a reason for{" "}
              {showPrompt.type === "block" ? "blocking" : "declining"}?
            </h3>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-xs sm:text-sm h-32 focus:border-indigo-500 outline-none text-slate-700 font-medium resize-none placeholder:text-slate-400"
              placeholder="e.g. Contract copy is unreadable, please upload a clearer scan."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4 shrink-0">
              <button
                onClick={() => setShowPrompt(null)}
                className="flex-1 py-2 text-slate-500 font-montserrat font-bold hover:bg-slate-50 rounded-lg transition-colors text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={loadingAction}
                className={`flex-1 py-2 text-white rounded-lg font-montserrat font-black transition-opacity flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider shadow-sm ${
                  loadingAction
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:opacity-90"
                } ${showPrompt.type === "block" ? "bg-red-600" : "bg-indigo-600"}`}
              >
                {loadingAction ? (
                  <Loader2 className="animate-spin" size={14} />
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
