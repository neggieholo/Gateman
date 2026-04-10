"use client";

import { useMemo, useState } from "react";
import {
  QrCode,
  Users,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Info,
  ChevronRight,
  Lock,
} from "lucide-react";
import { useUser } from "../UserContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user } = useUser();
  const router = useRouter();
  const [showKYCModal, setShowKYCModal] = useState(false);
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const isVerified = user?.verification_status === "verified";

  const handleBillingClick = () => {
    if (!isVerified) {
      setShowKYCModal(true);
    } else {
      // Proceed to Billing view
      console.log("Navigating to billing...");
    }
  };

  const bannerContent = useMemo(() => {
    if (user?.is_verified)
      return { title: "Verified", desc: "Your account is fully verified." };

    const step = user?.verification_step
    
    switch (step) {
      case 0:
        return {
          title: "Verification Required",
          desc: "Complete KYC to enable the estate wallet and collection features.",
        };
      case 1:
        return {
          title: "KYC Progress: 33%",
          desc: "Complete Step 1: Upload your Estate & Business documents to proceed.",
        };
      case 2:
        return {
          title: "KYC Progress: 66%",
          desc: "Complete Step 2: Provide Admin Identity and Authorization details.",
        };
      case 3:
        return {
          title: "Final Step: Liveness",
          desc: "Take a quick selfie to finalize your verification request.",
        };
      case 4:
        return {
          title: "Verification Pending",
          desc: "Your documents are currently being reviewed by our compliance team.",
        };
      default:
        return {
          title: "KYC Update",
          desc: "Please follow the instructions to verify your account.",
        };
    }
  }, [user?.verification_step, user?.is_verified]);

  return (
    <div className="relative space-y-8 pb-24 md:pb-8">
      {!user?.is_verified && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
            user?.verification_status === "pending"
              ? "bg-blue-50 border-blue-100 text-blue-800"
              : "bg-amber-50 border-amber-100 text-amber-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${user?.verification_status === "pending" ? "bg-blue-100" : "bg-amber-100"}`}
            >
              <Info size={18} />
            </div>
            <div>
              <p className="text-sm font-bold">{bannerContent.title}</p>
              <p className="text-xs opacity-80">{bannerContent.desc}</p>
            </div>
          </div>

          {user?.verification_status !== "pending" && (
            <button
              className="flex items-center gap-1 text-xs font-black uppercase tracking-tighter bg-amber-200/50 px-3 py-2 rounded-lg hover:bg-amber-200 transition-colors"
              onClick={() => router.push("/home/kyc")}
            >
              {user?.verification_step === 0 ? "Verify Now" : "Continue"}{" "}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div>
          <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
            {currentDate}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Overview
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Occupancy
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              94%
            </div>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              +2%
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            142 / 150 Units Occupied
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
              <QrCode size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Active Passes
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              28
            </div>
            <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
              Valid
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            Currently active visitor codes
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Alerts
              </span>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-bold text-slate-900 tracking-tight">
              3
            </div>
            <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
              New
            </div>
          </div>
          <div className="mt-2 text-sm text-slate-500 font-medium">
            Open maintenance requests
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button className="group relative overflow-hidden bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-start justify-between min-h-40 hover:scale-[1.02] transition-transform duration-300">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors"></div>
          <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/10">
            <ShieldCheck size={28} />
          </div>
          <div className="text-left relative z-10">
            <span className="block font-bold text-xl mb-1 text-indigo-400">
              Security Log
            </span>
            <span className="text-sm text-slate-400">
              Monitor all gate activity
            </span>
          </div>
        </button>

        <button
          onClick={handleBillingClick}
          className="group bg-white text-slate-900 border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-start justify-between min-h-40 hover:shadow-xl hover:border-slate-300 transition-all duration-300 relative"
        >
          {!isVerified && (
            <div className="absolute top-4 right-4 text-slate-300">
              <Lock size={20} />
            </div>
          )}
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp size={28} />
          </div>
          <div className="text-left">
            <span className="block font-bold text-xl mb-1 text-indigo-900">
              Billing Reports
            </span>
            <span className="text-sm text-slate-500">
              Manage unit utilities & levies
            </span>
          </div>
        </button>
      </div>

      {showKYCModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">
              {user?.verification_step === 0
                ? "Verification Required"
                : "Continue Verification"}
            </h3>
            <p className="text-slate-500 mb-8">
              To handle payments, generate utility bills, or withdraw funds, you
              must complete your administrative KYC. This ensures compliance
              with Nigerian financial regulations.
            </p>
            <div className="flex flex-col gap-3">
              <button
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
                onClick={() => {
                  router.push("/home/kyc");
                }}
              >
                {user?.verification_step === 0
                  ? "Start Verification"
                  : "Continue"}
              </button>
              <button
                className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                onClick={() => setShowKYCModal(false)}
              >
                {user?.verification_step === 0
                  ? "Maybe Later"
                  : "Continue Later"}{" "}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
