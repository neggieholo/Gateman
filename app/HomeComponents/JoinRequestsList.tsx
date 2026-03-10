'use client';

import React, { useEffect, useState } from "react";
import { JoinRequest } from "../types";
import { ArrowRight, ArrowLeft, Check, X, Ban, ExternalLink } from "lucide-react";

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
  onBlock ,
  loading = false,
  hideTabs
}) => {
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [feedback, setFeedback] = useState("");
  // const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<{id: string, type: 'decline' | 'block'} | null>(null);

  const confirmAction = async () => {
    if (!showPrompt) return;
    
    if (showPrompt.type === 'decline') {
      await onDecline(showPrompt.id, feedback); 
    } else {
      await onBlock(showPrompt.id, feedback);
    }
    
    setFeedback("");
    setShowPrompt(null);
    setSelectedRequest(null);
  };

  useEffect(() => {
    hideTabs(!!selectedRequest);
  }, [selectedRequest, hideTabs]);

  const KYCDetailView = ({ req }: { req: JoinRequest }) => (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-y-auto h-[calc(100vh-200px)]">
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{req.temp_tenant_name}</h3>
          <p className="text-sm text-slate-500">{req.temp_tenant_email}</p>
        </div>
        <button 
          onClick={() => setSelectedRequest(null)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={18} /> Back to list
        </button>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-8 bg-blue-50 p-4 rounded-lg">
          <p className="text-sm"><strong>Unit:</strong> {req.unit || "-"}</p>
          <p className="text-sm"><strong>Block:</strong> {req.block || "-"}</p>
          <p className="text-sm"><strong>ID Type:</strong> <span className="uppercase font-bold text-blue-700">{req.id_type}</span></p>
          <p className="text-sm"><strong>Requested:</strong> {new Date(req.requested_at).toLocaleString()}</p>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DocPreview url={req.selfie_url} label="Selfie" />
          <DocPreview url={req.id_front_url} label="ID Front" />
          <DocPreview url={req.id_back_url} label="ID Back" />
          <DocPreview url={req.utility_bill_url} label="Utility Bill" />
        </div>

        {/* Admin Action Row */}
        <div className="flex flex-row gap-3 mt-10 pt-6 border-t border-slate-100">
          <button
            onClick={() => { onApprove(req.id); setSelectedRequest(null); }}
            className="w-32 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition-shadow shadow-md "
          >
            <Check size={18} /> Accept
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: 'decline' })}
            className="w-32 flex items-center justify-center gap-2 bg-amber-500 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition-shadow shadow-md"
          >
            <X size={18} /> Decline
          </button>
          <button
            onClick={() => setShowPrompt({ id: req.id, type: 'block' })}
            className="w-32 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-shadow shadow-md"
          >
            <Ban size={18} /> Block
          </button>
        </div>
      </div>
    </div>
  );

  // Helper for rendering images with placeholders
  const DocPreview = ({ url, label }: { url?: string; label: string }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{label}</span>
        {url && (
          <a href={url} target="_blank" className="text-blue-500 hover:text-blue-700">
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {url ? (
        <img src={url} className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-slate-100" alt={label} />
      ) : (
        <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
          <span className="text-slate-300 text-sm italic font-medium">Not Provided</span>
        </div>
      )}
    </div>
  );

 
  return (
    <>
      {/* 1. Main View Area (Background) */}
      {selectedRequest ? (
        <KYCDetailView req={selectedRequest} />
      ) : requests.length === 0 ? (
        <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
          {loading ? "Loading..." : "No pending join requests"}
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div 
              key={req.id} 
              className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                  <span className="text-blue-600 font-bold text-base sm:text-lg">{req.temp_tenant_name[0]}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                    {req.temp_tenant_name}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Received: {new Date(req.requested_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(req)}
                className="flex items-center gap-2 bg-slate-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold border border-slate-100 hover:bg-blue-600 hover:text-white transition-all"
              >
                See Details <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. Global Modal (The Overlay) */}
      {showPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold mb-2">
              Add a reason for {showPrompt.type === 'block' ? 'blocking' : 'declining'}?
            </h3>
            <textarea 
              className="w-full border rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
              placeholder="e.g. ID is blurry, please take a clearer photo."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setShowPrompt(null)} 
                className="flex-1 py-2 text-slate-500 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAction} 
                className={`flex-1 py-2 text-white rounded-lg font-bold transition-opacity hover:opacity-90 ${
                  showPrompt.type === 'block' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                Submit & {showPrompt.type === 'block' ? 'Block' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JoinRequestsList;