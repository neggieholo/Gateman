import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  LayoutDashboard,
  Users,
  UserCheck,
  Check,
  Calendar,
  Gift,
  Sparkles,
  CreditCard,
  History,
  ShieldCheck,
  MessageSquare,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import { Plan } from "../services/types";

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
  onConfirm: (payload: {
    selectedAddOns: string[];
    isTrial: boolean;
    planDuration: number;
  }) => void;
  activeEstate: EstateProfile | null;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activeEstate,
}) => {
  const [activeTab, setActiveTab] = useState<"configure" | "history">(
    "configure",
  );
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [isTrial, setIsTrial] = useState<boolean>(false);
  const [planDuration, setPlanDuration] = useState<number>(1);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Parse estate plan state and calculate remaining time
  const estatePlanState = useMemo(() => {
    if (!activeEstate)
      return { isTrial: false, activeAddons: [], isExpired: true, daysLeft: 0 };

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

    return {
      isTrial: Boolean(parsedPlan.is_trial),
      activeAddons: parsedPlan.selected_add_ons || [],
      isExpired,
      daysLeft,
    };
  }, [activeEstate]);

  // Filter out already purchased add-ons for active subscriptions
  const availableAddons = useMemo(() => {
    if (!estatePlanState.isExpired && !estatePlanState.isTrial) {
      return ADDON_MODULES.filter(
        (mod) => !estatePlanState.activeAddons.includes(mod.id),
      );
    }
    return ADDON_MODULES;
  }, [estatePlanState]);

  // Apply state adjustments and toasts upon modal mount
  useEffect(() => {
    if (!isOpen) return;

    if (!estatePlanState.isExpired && !estatePlanState.isTrial) {
      const calculatedMonths = Math.ceil(estatePlanState.daysLeft / 30) || 1;

      if (estatePlanState.daysLeft <= 10) {
        toast.error(
          `Your subscription expires in ${estatePlanState.daysLeft} days. We recommend allowing it to complete before renewing full cycle.`,
          { id: "sub-expiry-warning", duration: 5000 },
        );
      } else {
        setPlanDuration(calculatedMonths);
        toast.success(
          `New add-ons will align with your active subscription duration (${calculatedMonths} month${calculatedMonths > 1 ? "s" : ""} remaining).`,
          { id: "sub-duration-notice", duration: 5000 },
        );
      }
    }
  }, [isOpen, estatePlanState]);

  if (!isOpen) return null;

  const handleTrialToggle = () => {
    setValidationError(null);
    const nextTrialState = !isTrial;
    setIsTrial(nextTrialState);

    if (nextTrialState) {
      setSelectedAddOns(ADDON_MODULES.map((m) => m.id));
      setPlanDuration(1);
    } else {
      setSelectedAddOns([]);
      setPlanDuration(1);
    }
  };

  const toggleAddOn = (id: string) => {
    if (isTrial) return;
    setValidationError(null);
    if (selectedAddOns.includes(id)) {
      setSelectedAddOns(selectedAddOns.filter((item) => item !== id));
    } else {
      setSelectedAddOns([...selectedAddOns, id]);
    }
  };

  const handleConfirm = () => {
    if (selectedAddOns.length === 0 && availableAddons.length > 0) {
      setValidationError("Please select at least one optional feature module.");
      return;
    }

    onConfirm({
      selectedAddOns,
      isTrial,
      planDuration,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-6xl lg:max-w-7xl rounded-[2.5rem] p-6 md:p-8 shadow-2xl scale-in-center border border-slate-100 overflow-y-auto max-h-[90vh] flex flex-col no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              {!estatePlanState.isExpired && !estatePlanState.isTrial
                ? "Expand Active Subscription"
                : "Manage Subscription & Features"}
            </h3>
            <p className="text-slate-500 text-xs md:text-sm mt-1">
              {activeEstate?.estate_name || "Estate Account"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 rounded-2xl gap-1 mb-6">
          <button
            onClick={() => setActiveTab("configure")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "configure"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={15} />
            <span>Plan & Features</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "history"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <History size={15} />
            <span>Subscription History</span>
          </button>
        </div>

        {activeTab === "configure" ? (
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

            {/* Trial Toggle Card (Available when expired or new) */}
            {estatePlanState.isExpired && (
              <div
                onClick={handleTrialToggle}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  isTrial
                    ? "border-emerald-500 bg-emerald-50/40 shadow-sm"
                    : "border-slate-100 bg-slate-50/40"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
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
                      Enjoy all features free for 30 days. All add-on modules
                      are automatically unlocked.
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
            )}

            {/* Subscription Duration Selector */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    Subscription Duration
                  </h5>
                  <p className="text-xs text-slate-500">
                    {isTrial
                      ? "Fixed to 1 month for free trial period"
                      : !estatePlanState.isExpired
                        ? `Prorated to active period (${estatePlanState.daysLeft} days remaining)`
                        : "Select billing duration length"}
                  </p>
                </div>
              </div>

              <div className="w-full md:w-64">
                <select
                  disabled={
                    isTrial ||
                    (!estatePlanState.isExpired && !estatePlanState.isTrial)
                  }
                  value={planDuration}
                  onChange={(e) => setPlanDuration(Number(e.target.value))}
                  className={`w-full p-3 rounded-xl border text-sm font-bold transition-all ${
                    isTrial ||
                    (!estatePlanState.isExpired && !estatePlanState.isTrial)
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

            {/* Add-Ons Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Add-On Feature Modules
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {isTrial
                    ? "All features unlocked for trial"
                    : `${selectedAddOns.length} selected`}
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
                        disabled={isTrial}
                        onClick={() => toggleAddOn(module.id)}
                        className={`flex items-start text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isTrial
                            ? "border-emerald-200 bg-emerald-50/20 opacity-90 cursor-not-allowed"
                            : isSelected
                              ? "border-indigo-600 bg-indigo-50/20 shadow-sm"
                              : "border-slate-100 hover:border-slate-200 bg-slate-50/40"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mr-3 mt-0.5 transition-colors ${
                            isTrial
                              ? "bg-emerald-500 text-white"
                              : isSelected
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
                                isTrial
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isSelected
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {isTrial
                                ? "Trial Included"
                                : isSelected
                                  ? "Added"
                                  : "Select"}
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

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl font-bold text-base transition-all shadow-md cursor-pointer"
            >
              {isTrial
                ? "Confirm Trial Configuration (1 Month)"
                : `Confirm Configuration (${planDuration} ${planDuration === 1 ? "Month" : "Months"})`}
            </button>
          </div>
        ) : (
          /* Subscription History View */
          <div className="space-y-4 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Past Renewals & Billing Records
            </span>
            <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
              <div className="bg-slate-50 p-3.5 grid grid-cols-3 font-bold uppercase text-slate-400 border-b border-slate-100">
                <span>Date</span>
                <span>Modules</span>
                <span className="text-right">Status</span>
              </div>
              <div className="p-3.5 grid grid-cols-3 items-center border-b border-slate-50">
                <span className="font-medium text-slate-700">
                  {activeEstate?.subscription_expiry
                    ? new Date(
                        activeEstate.subscription_expiry,
                      ).toLocaleDateString()
                    : "N/A"}
                </span>
                <span className="text-slate-500">
                  Baseline + {estatePlanState.activeAddons.length} Add-ons
                </span>
                <span className="text-right font-bold text-emerald-600">
                  {estatePlanState.isTrial ? "Trial" : "Active"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
