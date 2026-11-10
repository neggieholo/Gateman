/* eslint-disable @next/next/no-img-element */
"use client";

import React from "react";
import { X } from "lucide-react";

export interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalShell({
  isOpen,
  onClose,
  title,
  children,
}: PolicyModalProps & { title: string; children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gm-navy text-white">
          <div className="flex items-center gap-3">
            <img
              src="/gm_landing_logo.jpg"
              alt="GateMan Logo"
              className="h-7 w-auto object-contain"
            />
            <h2 className="text-lg font-montserrat font-bold text-white tracking-tight">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Close Modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 font-sans text-slate-700 text-sm leading-relaxed space-y-6">
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-start px-6 py-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs font-montserrat text-slate-500">
            GateMan Global Limited (RC No. 9269153)
          </p>
        </div>
      </div>
    </div>
  );
}
