/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { User } from "../services/types";
import { ESTATE_PERMISSIONS } from "../services/data";
import { formatDate } from "../services/apis";

interface AdminProfileModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminProfileModal({
  user,
  isOpen,
  onClose,
}: AdminProfileModalProps) {
  // 🎯 Internal state to track full-screen image expansion preview
  const [showImagePreview, setShowImagePreview] = useState(false);

  if (!isOpen || !user) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        {/* Modal Container */}
        <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200/70 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header Block */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between relative">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-xl text-white">
                <Layers size={16} />
              </div>
              <div>
                <h3 className="text-xs font-montserrat font-black uppercase tracking-wider text-slate-200">
                  Administrative Security Profile
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white transition-all outline-none"
            >
              <X size={14} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto space-y-5 custom-scrollbar">
            {/* Identity Header Card Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
              {/* Avatar Render Vector */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  onClick={() => setShowImagePreview(true)}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-2xs cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-900 text-white flex items-center justify-center font-montserrat font-black text-xl shadow-inner uppercase shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left space-y-1 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <h2 className="text-base font-montserrat font-black text-slate-800 tracking-tight">
                    {user.name}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[8px] font-oswald font-bold uppercase tracking-wider border ${
                      user.is_active
                        ? "bg-emerald-50/50 border-emerald-100 text-emerald-600"
                        : "bg-rose-50/50 border-rose-100 text-rose-600"
                    }`}
                  >
                    {user.is_active ? "ACTIVE" : "INACTIVE"}
                  </span>
                  {!user.is_root_admin && (
                    <span className="px-2 py-0.5 rounded-lg bg-blue-50/50 border border-blue-100 text-blue-600 text-[8px] font-oswald font-bold uppercase tracking-wider">
                      SUB-ACCOUNT
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium font-mono break-all flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail size={11} /> {user.email}
                </p>
              </div>
            </div>

            {/* Quick Metrics Core Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meta Attributes Panel */}
              <div className="p-4 border border-slate-200/70 rounded-xl space-y-2.5 bg-white">
                <h4 className="text-[10px] font-oswald font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                  Communication Vectors
                </h4>
                <div className="space-y-2 text-xs font-bold text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Phone size={12} className="text-slate-450" /> Phone:
                    </span>
                    <span className="font-mono text-slate-800">
                      {user.phone_number || "Unspecified"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-455" />{" "}
                      Registered:
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Guard Status Panel */}
              <div className="p-4 border border-slate-200/70 rounded-xl space-y-2.5 bg-white">
                <h4 className="text-[10px] font-oswald font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
                  Identity Verification Matrix
                </h4>
                <div className="space-y-2 text-xs font-bold">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      Email Verification:
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] uppercase font-oswald font-bold ${user.email_verified ? "text-emerald-600" : "text-amber-500"}`}
                    >
                      {user.email_verified ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {user.email_verified ? "VERIFIED" : "UNVERIFIED"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">
                      Device Phone Binding:
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] uppercase font-oswald font-bold ${user.phone_verified ? "text-emerald-600" : "text-amber-500"}`}
                    >
                      {user.phone_verified ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <AlertCircle size={12} />
                      )}
                      {user.phone_verified ? "VERIFIED" : "UNBOUND"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MFA Protection Policy Snapshot */}
            {/* <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                user.mfa_enabled
                  ? "bg-emerald-50/40 border-emerald-100 text-emerald-900"
                  : "bg-rose-50/40 border-rose-100 text-rose-900"
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${user.mfa_enabled ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"}`}
              >
                {user.mfa_enabled ? (
                  <ShieldCheck size={16} />
                ) : (
                  <ShieldAlert size={16} />
                )}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-montserrat font-black uppercase tracking-tight">
                  MFA Authentication Guard:{" "}
                  {user.mfa_enabled ? `${user.mfa_type} ACTIVE` : "BYPASSED"}
                </h4>
                <p className="text-[10px] opacity-75 font-medium leading-normal">
                  {user.mfa_enabled
                    ? "Multi-Factor challenges intercept access pipelines on all unrecognized endpoints securely."
                    : "Critical Warning: Account bypass flags are vulnerable to unauthorized session hijack vectors."}
                </p>
              </div>
            </div> */}

            {/* Explicit Permissions Chip Cloud Matrix */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-oswald font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                Allocated Operational Tokens ({user.permissions?.length || 0})
              </h4>
              <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex flex-wrap gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                {user.permissions?.length > 0 ? (
                  user.permissions.map((token) => {
                    const matchedPermission = ESTATE_PERMISSIONS.find(
                      (p) => p.id === token,
                    );
                    return (
                      <span
                        key={token}
                        className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200/60 rounded-lg text-[9px] font-mono font-bold shadow-3xs break-keep whitespace-nowrap"
                      >
                        {matchedPermission ? matchedPermission.name : token}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-slate-400 font-medium italic">
                    No explicit feature permission keys linked to this profile
                    node.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Panel Controls */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-slate-900 hover:bg-slate-850 text-white font-oswald font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all active:scale-98 shadow-3xs"
            >
              Acknowledge Profile
            </button>
          </div>
        </div>
      </div>

      {/* ─── MINI AVATAR PREVIEW OVERLAY MODAL ─── */}
      {showImagePreview && user.avatar && (
        <div
          onClick={() => setShowImagePreview(false)}
          className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-[90vw] max-h-[85vh] animate-in zoom-in-95 duration-150">
            {/* Close button indicator helper for touch screens */}
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute -top-12 right-0 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10"
            >
              <X size={16} />
            </button>
            <img
              src={user.avatar}
              alt={`${user.name} expanded avatar`}
              className="max-w-full max-h-[80vh] rounded-2xl object-contain border border-slate-800 shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()} // Stop overlay click collapse when clicking image directly
            />
          </div>
        </div>
      )}
    </>
  );
}
