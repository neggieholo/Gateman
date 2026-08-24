/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  AlertTriangle,
  RefreshCw,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useUser } from "../UserContext";

interface ExpiredSubscriptionModalProps {
  isOpen: boolean;
  activeEstate: any;
  onOpenRenewal: () => void;
}

export const ExpiredSubscriptionModal: React.FC<
  ExpiredSubscriptionModalProps
> = ({ isOpen, activeEstate, onOpenRenewal }) => {
  const { user, contextEstateId, setContextEstateId } = useUser();

  if (!isOpen) return null;

  const estates = user?.estates || [];
  const hasMultipleEstates = estates.length > 1;

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center scale-in-center">
        {/* Warning Icon Badge */}
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 ring-8 ring-rose-50/50">
          <AlertTriangle size={32} />
        </div>

        {/* Title & Estate Name */}
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Subscription Expired
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {activeEstate?.estate_name || "Selected Estate"}
        </p>

        {/* Informational Body */}
        <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-rose-50/60 p-4 rounded-2xl border border-rose-100 text-left">
          Access to management feature modules for{" "}
          <strong className="text-slate-900">
            {activeEstate?.estate_name}
          </strong>{" "}
          is currently locked because the active subscription billing cycle has
          ended.
        </p>

        {/* Actions Section */}
        <div className="w-full space-y-3 mt-6">
          {/* Primary Action: Open Renewal Payment Modal */}
          <button
            type="button"
            onClick={onOpenRenewal}
            className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-lg shadow-indigo-200 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            <span>Renew Subscription Now</span>
          </button>

          {/* Secondary Action: Multi-Estate Selector (If > 1 Estate exists) */}
          {hasMultipleEstates && (
            <div className="pt-2 border-t border-slate-100">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-left flex items-center gap-1.5">
                <Building2 size={13} />
                <span>Switch to Another Estate</span>
              </label>
              <div className="relative">
                <select
                  value={contextEstateId || ""}
                  onChange={(e) => setContextEstateId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer appearance-none pr-8"
                >
                  {estates.map((est: any) => (
                    <option key={est.id} value={est.id}>
                      {est.estate_name}{" "}
                      {est.id === activeEstate?.id ? "(Expired)" : ""}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
