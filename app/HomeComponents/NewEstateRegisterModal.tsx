/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from "react";
import { MapPin, ArrowRight, X, Building2 } from "lucide-react";
import { db } from "../services/database";
import { PlanSelectionModal } from "../LandingPageComponents/PlanSelectionModal";
import { states_lgas } from "../utils/states_lgas";
import { ADDON_MODULES } from "../services/data";
import toast from "react-hot-toast";

interface NewEstateRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewEstateRegisterModal: React.FC<NewEstateRegisterModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Form State (Estate Details Only)
  const [name, setName] = useState(""); // Estate Name
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");

  // Plan State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planDuration, setPlanDuration] = useState<number>(1);
  const [configuredPlan, setConfiguredPlan] = useState<{
    selectedAddOns: string[];
    isTrial: false;
  }>({
    selectedAddOns: [],
    isTrial: false,
  });

  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>("");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset form inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setState("");
      setLga("");
      setError(null);
      setConfiguredPlan({ selectedAddOns: [], isTrial: false });
      setPlanDuration(1);
    }
  }, [isOpen]);

  const availableLgas = useMemo(() => {
    const stateData = states_lgas.find((s) => s.state === state);
    return stateData ? stateData.lgas : [];
  }, [state]);

  if (!isOpen) return null;

  // Submit Handler for In-App Estate Creation
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!configuredPlan.selectedAddOns) {
      setError("Please configure your subscription plan before proceeding.");
      return;
    }

    setLoading(true);

    try {
      // Calls authenticated estate onboarding endpoint via db service
      const data = await db.register(
        name,
        state,
        lga,
        configuredPlan,
        planDuration,
      );

      if (data?.paymentLink) {
        window.location.href = data.paymentLink;
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create estate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-oswald">
              Add New Estate
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Onboard another estate branch under your current account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content / Form */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Estate Name */}
            <div>
              <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                Estate Name
              </label>
              <div className="relative">
                <Building2
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                  placeholder="Platinum Estate Phase 2"
                />
              </div>
            </div>

            {/* Subscription Tier Button */}
            <div>
              <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                Subscription Tier
              </label>
              <button
                type="button"
                onClick={() => setShowPlanModal(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-left rounded-2xl transition-all group cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                      {configuredPlan.selectedAddOns.length === 0
                        ? "Core Plan Selected"
                        : "Active Plan Configuration"}
                    </span>

                    {configuredPlan.selectedAddOns.length > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 border border-indigo-200/80 tracking-wide whitespace-nowrap">
                        {planDuration} $
                        {planDuration === 1 ? "Month" : "Months"}
                      </span>
                    )}
                  </div>

                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                      <span className="text-xs text-slate-500 font-medium truncate">
                        Core Platform Access (Dashboard, User & Resident
                        Management)
                      </span>
                    </div>

                    {configuredPlan.selectedAddOns.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {configuredPlan.selectedAddOns.map((addOnId) => {
                          const ADDON_FEATURES = ADDON_MODULES.find(
                            (m) => m.id === addOnId,
                          );
                          return (
                            <span
                              key={addOnId}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                            >
                              {ADDON_FEATURES?.name || addOnId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <span className="shrink-0 whitespace-nowrap text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform text-center">
                  Configure Plan
                </span>
              </button>
            </div>

            {/* Location Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* State Select */}
              <div>
                <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                  State
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <select
                    required
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      setLga("");
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none"
                  >
                    <option value="">Select State</option>
                    {states_lgas.map((s) => (
                      <option key={s.alias} value={s.state}>
                        {s.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* LGA Select */}
              <div>
                <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                  LGA
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <select
                    required
                    disabled={!state}
                    value={lga}
                    onChange={(e) => setLga(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none disabled:opacity-50"
                  >
                    <option value="">Select LGA</option>
                    {availableLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-montserrat rounded-2xl text-base px-5 py-3.5 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Add Estate
                  <ArrowRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Nested Plan Selection Modal */}
      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onConfirm={([updatedSelection, duration]: [any, number]) => {
          setConfiguredPlan(updatedSelection);
          setPlanDuration(duration);
        }}
        allowTrial={false}
      />
    </div>
  );
};

export default NewEstateRegisterModal;
