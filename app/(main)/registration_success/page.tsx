"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Mail } from "lucide-react";

/**
 * INNER COMPONENT
 * This handles all the logic and search parameter extraction.
 */
function RegistrationContent() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(searchParams.get("code"));
  const [email, setEmail] = useState<string | null>(searchParams.get("email"));
  const ref = searchParams.get("ref");
  const [loading, setLoading] = useState(!code);

  useEffect(() => {
    if (code || !ref) return;

    const checkCallback = async () => {
      try {
        const res = await fetch(`/api/payment/callback?reference=${ref}`);

        if (
          res.url.includes("registration_success") &&
          res.url.includes("code=")
        ) {
          const urlParams = new URLSearchParams(new URL(res.url).search);
          const newCode = urlParams.get("code");
          const newEmail = urlParams.get("email");

          if (newCode) {
            setCode(newCode);
            if (newEmail) setEmail(newEmail);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Callback check failed:", err);
      }
    };

    const interval = setInterval(checkCallback, 5000);
    return () => clearInterval(interval);
  }, [code, ref]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 text-center border border-slate-100 my-auto">
        {loading ? (
          <div className="space-y-6 py-6 sm:py-10">
            <Loader2
              size={50}
              className="mx-auto text-indigo-600 animate-spin sm:w-[60px] sm:h-[60px]"
            />
            <h2 className="text-xl sm:text-2xl font-montserrat font-black text-slate-900 tracking-tight">
              Finalizing Pass...
            </h2>
            <p className="text-slate-500 font-sans font-medium text-sm sm:text-base">
              We&apos;re generating your unique access code.
            </p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-2 tracking-tight">
              You&apos;re In!
            </h1>
            <p className="text-slate-500 font-sans font-medium text-sm sm:text-base mb-6 sm:mb-8">
              Your registration is confirmed. Show this code at the gate for
              entry.
            </p>

            <div className="bg-indigo-600 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 mb-6 relative overflow-hidden shadow-xl shadow-indigo-100">
              <p className="text-[10px] font-oswald font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">
                Guest Access Code
              </p>
              <p className="text-3xl sm:text-4xl font-sans font-black text-white tracking-tighter">
                {code}
              </p>
            </div>

            {email && (
              <div className="flex flex-col items-center justify-center gap-2 p-4 sm:p-6 bg-slate-50 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
                  <Mail size={18} className="text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-sans font-medium text-slate-600 mb-0.5">
                    Access code sent to email:
                  </p>
                  <p className="text-xs sm:text-sm font-sans font-bold text-indigo-600 break-all">
                    {email}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * MAIN PAGE EXPORT
 */
export default function RegistrationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}
