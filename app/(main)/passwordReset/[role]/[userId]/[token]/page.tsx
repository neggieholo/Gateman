/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { db } from "@/app/services/database";
import { Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Get credentials from URL
  const params = useParams();
  const role = params.role as string;
  const userId = params.userId as string;
  const token = params.token as string;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (!token || !userId || !role) {
      setError("Invalid or missing reset link parameters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await db.resetPassword(token, userId, role, password);

      if (res.success) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.replace("/");
        }, 3000);
      } else {
        setError(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[linear-gradient(to_bottom,#0A1F44_50%,#f1f5f9_50%)]">
      {/* Left side sidebar hidden on mobile viewports */}
      <div
        className="hidden lg:flex lg:w-2/3 bg-gm-navy relative overflow-hidden"
        style={{ borderRadius: "0px 0px 120px 0px" }}
      >
        <div className="absolute inset-0 mix-blend-multiply z-10" />
        {/* <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
                alt="Modern Apartment"
                className="absolute inset-0 w-full h-full object-cover"
              /> */}
        <div className="relative z-20 flex flex-col justify-between items-start h-full p-16 text-white">
          <div className="relative w-full h-50 flex items-center overflow-hidden self-start">
            <Image
              src="/gmadminlogo.jpg"
              alt="GateMan Logo"
              fill
              priority
              className="object-contain object-left"
            />
          </div>

          <div className="space-y-6 max-w-xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-none">
              <span className="block font-montserrat text-transparent bg-clip-text bg-linear-to-r py-3 from-white via-slate-200 to-indigo-200">
                Modern Living,
              </span>
              <span className="block text-indigo-400 mt-1 font-montserrat">
                Simplified.
              </span>
              <span className="block text-xl sm:text-2xl font-oswald italic text-indigo-200/70 tracking-wide mt-4">
                ...While Protecting What Matters Most.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300/90 leading-relaxed max-w-md font-oswald">
              Experience seamless estate management. Pay bills, manage visitors,
              and connect with your community—all in one place.
            </p>

            <div className="flex gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/40/40?random=${i}`}
                    className="w-10 h-10 rounded-full border-2 border-indigo-900"
                    alt="User"
                  />
                ))}
              </div>
              <div className="flex flex-col justify-center">
                <span className="font-montserrat text-sm">
                  2,000+ Residents
                </span>
                <span className="text-xs text-indigo-200 font-sans">
                  Trust Gateman
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-indigo-200/60 font-oswald">
            © 2026 Gateman Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Auth Box Container Viewport Layout */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-100"
        style={{ borderRadius: "120px 0px 0px 0px" }}
      >
        <div className="w-full max-w-md space-y-8 bg-white p-6 sm:p-8 md:p-12 rounded-4xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white my-auto">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight mb-2">
              {success ? "Success!" : "Reset Password"}
            </h2>
            <p className="text-slate-500 font-sans text-sm sm:text-base font-medium">
              {success
                ? "Your password has been updated."
                : "Enter your new password below."}
            </p>
          </div>

          {/* Status Message Area */}
          <div
            className={`p-3 rounded-xl flex items-center gap-3 text-sm font-sans font-bold h-12 transition-all 
            ${
              error
                ? "bg-rose-50 text-rose-600 border border-rose-100 animate-shake"
                : success
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-white"
            }`}
          >
            {error && (
              <>
                <AlertCircle size={18} className="shrink-0" />{" "}
                <span className="truncate">{error}</span>
              </>
            )}
            {success && (
              <>
                <CheckCircle2 size={18} className="shrink-0" /> Redirecting to
                login...
              </>
            )}
          </div>

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-sans font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-sans font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 font-montserrat font-black rounded-2xl text-base sm:text-lg px-5 py-3.5 sm:py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 uppercase tracking-wider"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Update Password <ArrowRight size={20} className="ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.replace("/")}
              className="text-sm font-sans font-medium text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <span className="font-oswald font-black text-indigo-600 uppercase tracking-wider">
                Back to Login
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
