/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  Check,
  Calendar,
  Sparkles,
  CreditCard,
  ShieldCheck,
  MessageSquare,
  Wrench,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { Plan } from "../services/types";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./Users";
import { db } from "../services/database";

// Module configurations
export const BASELINE_MODULES = [
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
  {
    id: "resident_management",
    name: "Resident Management",
    description:
      "Resident onboarding approvals, directory, and activity audit logs.",
    icon: UserCheck,
  },
];

export const ADDON_MODULES = [
  {
    id: "payments",
    name: "Payments & Dispute Management",
    description:
      "Payment recording, proof of payment, invoices, and dispute workflow.",
    icon: CreditCard,
  },
  {
    id: "security",
    name: "Security Operations",
    description:
      "Guard rosters, live location tracking, panic alerts, gatepass, & access logs.",
    icon: ShieldCheck,
  },
  {
    id: "community",
    name: "Community Hub & Broadcasts",
    description:
      "Estate feeds, announcements, comments, and push notifications.",
    icon: MessageSquare,
  },
  {
    id: "facility_bookings",
    name: "Facility & Amenity Bookings",
    description:
      "Amenity directory, booking approvals, and paid facility tracking.",
    icon: Calendar,
  },
  {
    id: "services_dispatch",
    name: "Services & Marketplace Dispatch",
    description:
      "Service catalog, resident service requests, and dispatch workflow.",
    icon: Wrench,
  },
];

export interface EstateProfile {
  id: string;
  estate_name: string;
  plan: Plan;
  subscription_expiry?: string;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeEstate: EstateProfile | null | undefined;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  activeEstate,
}) => {
  const { user } = useUser();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [planDuration, setPlanDuration] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [extendSubscription, setExtendSubscription] = useState<boolean>(false);

  const canManageSubscription =
    user?.permissions?.includes("estate_administration") ||
    user?.permissions?.includes("manage_estate_subscription") ||
    user?.permissions?.includes("all-access");

  // Parse estate plan state and calculate remaining time
  const estatePlanState = useMemo(() => {
    if (!activeEstate) {
      return {
        isTrial: false,
        activeAddons: [],
        isExpired: true,
        daysLeft: 0,
        isActive: false,
      };
    }

    let parsedPlan: { is_trial?: boolean; selected_add_ons?: string[] } = {};
    if (typeof activeEstate.plan === "string") {
      try {
        parsedPlan = JSON.parse(activeEstate.plan);
      } catch (e) {
        console.error("Failed to parse plan JSON", e);
      }
    } else if (activeEstate.plan) {
      parsedPlan = activeEstate.plan;
    }

    const expiryDate = activeEstate.subscription_expiry
      ? new Date(activeEstate.subscription_expiry)
      : null;
    const now = new Date();
    const isExpired = !expiryDate || expiryDate <= now;
    const diffTime = expiryDate ? expiryDate.getTime() - now.getTime() : 0;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const isTrial = Boolean(parsedPlan.is_trial);

    return {
      isTrial,
      activeAddons: parsedPlan.selected_add_ons || [],
      isExpired,
      daysLeft,
      isActive: !isExpired,
    };
  }, [activeEstate]);

  // Derive remaining months for active subscriptions
  const activeRemainingMonths = useMemo(() => {
    return Math.max(1, Math.ceil(estatePlanState.daysLeft / 30));
  }, [estatePlanState.daysLeft]);

  // Show available modules:
  // - If EXPIRED or TRIAL: Show ALL modules (allowing re-purchase/addition of previously used modules)
  // - If ACTIVE: Show only modules not yet purchased
  const availableAddons = useMemo(() => {
    if (estatePlanState.isActive && !estatePlanState.isTrial) {
      return ADDON_MODULES.filter(
        (mod) => !estatePlanState.activeAddons.includes(mod.id),
      );
    }
    return ADDON_MODULES;
  }, [
    estatePlanState.isActive,
    estatePlanState.isTrial,
    estatePlanState.activeAddons,
  ]);

  // Determine if duration should lock to remaining active period:
  // Active + Non-Trial + Add-on selected + Days left > 10
  const isProratedToActivePeriod = useMemo(() => {
    return (
      estatePlanState.isActive &&
      !estatePlanState.isTrial &&
      selectedAddOns.length > 0 &&
      estatePlanState.daysLeft > 10 &&
      !extendSubscription
    );
  }, [
    estatePlanState.isActive,
    estatePlanState.isTrial,
    selectedAddOns.length,
    estatePlanState.daysLeft,
    extendSubscription,
  ]);

  // Effective duration calculation
  const effectiveDuration = isProratedToActivePeriod
    ? activeRemainingMonths
    : planDuration;

  useEffect(() => {
    if (
      isOpen &&
      estatePlanState.isExpired &&
      estatePlanState.activeAddons.length > 0
    ) {
      setSelectedAddOns(estatePlanState.activeAddons);
    }
  }, [isOpen, estatePlanState.isExpired, estatePlanState.activeAddons]);
  // Toast warning for active plans <= 10 days
  useEffect(() => {
    if (
      isOpen &&
      estatePlanState.isActive &&
      !estatePlanState.isTrial &&
      estatePlanState.daysLeft <= 10
    ) {
      toast.error(
        `Your subscription expires in ${estatePlanState.daysLeft} days. We recommend allowing it to complete before renewing full cycle.`,
        { id: "sub-expiry-warning", duration: 5000 },
      );
    }
  }, [
    isOpen,
    estatePlanState.isActive,
    estatePlanState.isTrial,
    estatePlanState.daysLeft,
  ]);

  const handleClose = () => {
    setSelectedAddOns(
      estatePlanState.isExpired ? estatePlanState.activeAddons : [],
    );
    setValidationError(null);
    setExtendSubscription(false);
    setPlanDuration(1);
    onClose();
  };

  if (!isOpen) return null;

  const toggleAddOn = (id: string) => {
    setValidationError(null);
    if (selectedAddOns.includes(id)) {
      setSelectedAddOns(selectedAddOns.filter((item) => item !== id));
    } else {
      setSelectedAddOns([...selectedAddOns, id]);
    }
  };

  const handleConfirm = async () => {
    if (!canManageSubscription) {
      showAccessDeniedToast();
      return;
    }
    if (!activeEstate) {
      return;
    }
    if (
      !estatePlanState.isActive &&
      selectedAddOns.length === 0 &&
      availableAddons.length > 0
    ) {
      setValidationError("Please select at least one optional feature module.");
      return;
    }

    try {
      setLoading(true);
      await db.subscribe(activeEstate.id, selectedAddOns, effectiveDuration, extendSubscription);
      handleClose();
    } catch (error: any) {
      setValidationError(error.message || "Failed to initialize payment");
    } finally {
      setLoading(false);
    }
  };

  const isIdleActiveState = estatePlanState.isActive && !extendSubscription;

  const isSelectDisabled = isProratedToActivePeriod || isIdleActiveState;

  const canConfirm =
    estatePlanState.isExpired ||
    (estatePlanState.isActive && extendSubscription) ||
    isProratedToActivePeriod;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl lg:max-w-7xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl scale-in-center border border-slate-100 overflow-y-auto max-h-[90vh] flex flex-col no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {estatePlanState.isTrial && estatePlanState.isActive
                ? "Upgrade Trial to Full Paid Plan"
                : estatePlanState.isActive
                  ? "Expand / Renew Subscription"
                  : "Renew Expired Subscription"}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              {activeEstate?.estate_name || "Estate Account"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Core Baseline Section (Locked) */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Default Baseline
              </span>
              <span className="text-xs text-slate-400 font-medium">
                (Included in Core Access)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
                        <Check
                          size={14}
                          className="text-indigo-600 font-bold"
                        />
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

          {/* Subscription Duration Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-4">
            {/* Top Row: Title + Dropdown */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    Subscription Duration
                  </h5>
                  <p className="text-xs text-slate-500">
                    {isProratedToActivePeriod
                      ? `Prorated to active period (${estatePlanState.daysLeft} days remaining)`
                      : extendSubscription
                        ? `Extending subscription by ${planDuration} ${planDuration === 1 ? "month" : "months"}`
                        : "Select billing duration length"}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64">
                <select
                  disabled={isSelectDisabled}
                  value={effectiveDuration}
                  onChange={(e) => setPlanDuration(Number(e.target.value))}
                  className={`w-full p-3 rounded-xl border text-sm font-bold transition-all ${
                    isSelectDisabled
                      ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none"
                  }`}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month} {month === 1 ? "Month" : "Months"}{" "}
                      {month === 12
                        ? "(1 Year)"
                        : month === 24
                          ? "(2 Years)"
                          : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Row: Extend Subscription Checkbox */}
            {estatePlanState.isActive && !estatePlanState.isTrial && (
              <div className="pt-3 border-t border-slate-200/60">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={extendSubscription}
                    onChange={(e) => setExtendSubscription(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      Extend active subscription duration
                    </span>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">
                      {extendSubscription
                        ? `Your subscription end date will be pushed forward by ${planDuration} ${
                            planDuration === 1 ? "month" : "months"
                          }. Selected add-ons will cover both your remaining active period and the extended timeframe.`
                        : "Check this box to stack additional duration onto your current expiry date instead of prorating."}
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Add-Ons Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Add-On Feature Modules
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {selectedAddOns.length} selected
              </span>
            </div>

            {availableAddons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableAddons.map((module) => {
                  const Icon = module.icon;
                  const isSelected = selectedAddOns.includes(module.id);

                  return (
                    <button
                      type="button"
                      key={module.id}
                      onClick={() => toggleAddOn(module.id)}
                      className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
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
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200/60 rounded-2xl text-center space-y-1">
                <Sparkles size={20} className="text-amber-500 mx-auto" />
                <p className="text-sm font-bold text-slate-800">
                  All Available Modules Unlocked
                </p>
                <p className="text-xs text-slate-500">
                  Your active subscription already includes all extra feature
                  modules.
                </p>
              </div>
            )}
          </div>

          {validationError && (
            <p className="text-xs font-bold text-rose-500 text-center">
              {validationError}
            </p>
          )}

          {canConfirm ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-4 bg-slate-950 hover:bg-slate-900 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                  <span>Redirecting to Checkout...</span>
                </>
              ) : (
                `Confirm Configuration (${effectiveDuration} ${effectiveDuration === 1 ? "Month" : "Months"})`
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
