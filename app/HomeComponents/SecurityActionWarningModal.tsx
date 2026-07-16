/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { X, ShieldAlert, Loader2 } from "lucide-react";

interface SecurityActionWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "warning";
}

export default function SecurityActionWarningModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm Action",
  variant = "warning",
}: SecurityActionWarningModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleExecute = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error("Action execution interception error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gm-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card Container */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200/70 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Alert Strip */}
        <div
          className={`p-5 border-b border-slate-200/70 flex justify-between items-center ${
            isDanger ? "bg-rose-50/30" : "bg-amber-50/30"
          }`}
        >
          <div
            className={`flex items-center gap-2.5 ${isDanger ? "text-rose-600" : "text-amber-600"}`}
          >
            <ShieldAlert size={16} />
            <h3 className="text-xs font-montserrat font-black uppercase tracking-wider text-slate-800">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 hover:bg-slate-100 transition-all outline-none"
          >
            <X size={14} />
          </button>
        </div>

        {/* Informational Message & Action Controls */}
        <div className="p-5 space-y-5">
          <p className="text-[13px] font-sans font-medium text-slate-500 leading-relaxed">
            {message}
          </p>

          {/* Action Call Controls */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-oswald font-bold uppercase tracking-wider text-[10px] rounded-xl hover:bg-slate-55/40 transition-all active:scale-98 shadow-3xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecute}
              disabled={isSubmitting}
              className={`flex-1 py-3 text-white font-oswald font-bold uppercase tracking-wider text-[10px] rounded-xl transition-all active:scale-98 shadow-3xs flex items-center justify-center gap-2 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
