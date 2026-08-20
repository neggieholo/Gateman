import React, { useState, useEffect } from "react";
import {
  X,
  LayoutDashboard,
  Users,
  Check,
  Gift,
} from "lucide-react";
import { ADDON_MODULES } from "../services/data";
import { PlanSelectionData } from "../services/types";

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selection: PlanSelectionData) => void;
}

// 1. Core Platform Modules (Always included, cannot be toggled off)
const BASELINE_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard & Analytics",
    description:
      "Core overview, high-level metrics, and operational quick actions.",
    icon: LayoutDashboard,
  },
  {
    id: "user_management",
    name: "System Users & Access Control",
    description:
      "Internal team management, sub-accounts, roles, and permissions.",
    icon: Users,
  },
];


export const PlanSelectionModal: React.FC<PlanSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);


  if (!isOpen) return null;

  const toggleAddOn = (id: string) => {
    setValidationError(null);
    if (selectedAddOns.includes(id)) {
      if (selectedAddOns.length === 1) {
        setValidationError("You must select at least one add-on module.");
        return;
      }
      setSelectedAddOns(selectedAddOns.filter((item) => item !== id));
    } else {
      setSelectedAddOns([...selectedAddOns, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedAddOns.length === 0) {
      setValidationError("Please select at least one optional feature module.");
      return;
    }

    onConfirm({
      selectedAddOns,
      isTrial,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl scale-in-center border border-slate-100 overflow-y-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Configure Your Plan
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              Core access is included by default. Select at least one optional
              module.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Core Baseline Section (Locked) */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
              Default Baseline
            </span>
            <span className="text-xs text-slate-400 font-medium">
              (Included in Core Access)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BASELINE_MODULES.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="flex items-start p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-not-allowed opacity-90"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mr-3 mt-0.5">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h5 className="font-bold text-slate-900 text-sm">
                        {module.name}
                      </h5>
                      <Check size={14} className="text-indigo-600 font-bold" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                      {module.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional Add-Ons Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Add-On Feature Modules
            </span>
            <span className="text-xs text-slate-500 font-medium">
              At least 1 required ({selectedAddOns.length} selected)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ADDON_MODULES.map((module) => {
              const Icon = module.icon;
              const isSelected = selectedAddOns.includes(module.id);

              return (
                <button
                  type="button"
                  key={module.id}
                  onClick={() => toggleAddOn(module.id)}
                  className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                      : "border-slate-100 hover:border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-slate-900 text-sm">
                        {module.name}
                      </h5>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {isSelected ? "Added" : "Select"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                      {module.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 30-Day Free Trial Toggle Card */}
        <div
          onClick={() => setIsTrial(!isTrial)}
          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all mb-6 ${
            isTrial
              ? "border-emerald-500 bg-emerald-50/30"
              : "border-slate-100 bg-slate-50/40"
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isTrial
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              <Gift size={20} />
            </div>
            <div>
              <h5 className="font-bold text-slate-900 text-sm">
                Activate 30-Day Free Trial
              </h5>
              <p className="text-xs text-slate-500">
                Test all selected core and add-on modules free for the first 30
                days.
              </p>
            </div>
          </div>

          <div
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              isTrial ? "bg-emerald-500" : "bg-slate-300"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                isTrial ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </div>

        {/* Error Feedback */}
        {validationError && (
          <p className="text-xs font-bold text-rose-500 text-center mb-4">
            {validationError}
          </p>
        )}

        {/* Confirmation Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-bold text-base transition-all shadow-md"
        >
          Confirm Configuration
        </button>
      </div>
    </div>
  );
};
