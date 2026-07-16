/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import toast from "react-hot-toast";
import { User } from "../services/types";
import { forceOverrideSubAccountPasswordApi } from "../services/apis";

interface AdminPasswordOverrideModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordOverrideModal({
  user,
  isOpen,
  onClose,
}: AdminPasswordOverrideModalProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-generate a secure token string on initialization
  const generateSecurePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let securePass = "";
    for (let i = 0; i < 12; i++) {
      securePass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(securePass);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      generateSecurePassword();
    } else {
      setPassword("");
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard string context.");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to write password token to clipboard.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || password.length < 6) {
      toast.error("Password configuration must be at least 6 tokens long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forceOverrideSubAccountPasswordApi(user.id, password);
      if (res.success) {
        toast.success(
          res.message || `Credentials updated for ${user.name}`,
        );
        onClose();
      } else {
        toast.error(res.message || "Credential override mutation rejected.");
      }
    } catch (err) {
      toast.error(
        "Network synchronization exception modifying access credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gm-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/70 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header Block */}
        <div className="p-5 bg-gm-navy text-white flex justify-between items-center relative">
          <div className="flex items-center gap-2.5 text-amber-500">
            <ShieldAlert size={16} />
            <h3 className="text-xs font-montserrat font-black uppercase tracking-wider text-slate-200">
              Force Credential Override
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-750 text-red-600 hover:text-red-900 transition-all outline-none"
          >
            <X size={14} />
          </button>
        </div>

        {/* Operational Context Form Block */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Target Profile Warning Card */}
          <div className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-xl space-y-1">
            <h4 className="text-sm font-montserrat font-black uppercase text-amber-800 tracking-tight leading-none">
              Target: {user.name}
            </h4>
            <p className="text-xs font-medium text-amber-700/90 leading-relaxed">
              This action explicitly overwrites the database security key row
              mapping. The user will be requested to re-verify credentials and
              provide a fresh password key upon their next authentication phase.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[12px] font-oswald font-bold uppercase tracking-wider text-slate-400 block">
              New Security Access Key Value
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter custom password override..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/70 rounded-xl font-mono text-[14px] font-bold text-slate-900 focus:border-slate-800 outline-none transition-all shadow-3xs"
                  required
                />
              </div>

              {/* Copy String Button Context */}
              <button
                type="button"
                onClick={handleCopy}
                title="Copy configuration token sequence to clipboard"
                className="p-3 bg-slate-50/50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800 border border-slate-200/70 rounded-xl transition-all shadow-3xs shrink-0 active:scale-95"
              >
                {copied ? (
                  <Check
                    size={14}
                    className="text-emerald-600 animate-in fade-in"
                  />
                ) : (
                  <Copy size={14} />
                )}
              </button>

              {/* Regenerate Random Core Key */}
              <button
                type="button"
                onClick={generateSecurePassword}
                title="Generate secure random key allocation string"
                className="p-3 bg-slate-50/50 hover:bg-slate-100/70 text-slate-500 hover:text-slate-800 border border-slate-200/70 rounded-xl transition-all shadow-3xs shrink-0 active:scale-95"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* Action Operations Control Splitter */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 font-oswald font-bold uppercase tracking-wider text-[12px] rounded-xl hover:bg-slate-50 transition-all active:scale-98 shadow-3xs"
            >
              Cancel Operation
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-gm-navy hover:bg-slate-850 text-white font-oswald font-bold uppercase tracking-wider text-[12px] rounded-xl transition-all active:scale-98 shadow-3xs flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Updating Core Map...
                </>
              ) : (
                "Commit Configuration"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
