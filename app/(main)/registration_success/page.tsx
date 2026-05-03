"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Ticket, Mail } from "lucide-react";

export default function RegistrationSuccess() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState<string | null>(searchParams.get("code"));
  const [email, setEmail] = useState<string | null>(searchParams.get("email"));
  const ref = searchParams.get("ref");
  const [loading, setLoading] = useState(!code);

  useEffect(() => {
    if (code || !ref) return;

    const checkCallback = async () => {
      try {
        // Hit the EXACT same callback API you already built
        const res = await fetch(`/api/payment/callback?reference=${ref}`);

        // If the callback redirects to the success page with a code in the URL
        if (
          res.url.includes("registration_success") &&
          res.url.includes("code=")
        ) {
          const urlParams = new URLSearchParams(new URL(res.url).search);
          console.log("Sent Params:", urlParams)
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

    // Check every 5 seconds
    const interval = setInterval(checkCallback, 5000);
    return () => clearInterval(interval);
  }, [code, ref]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
        {loading ? (
          <div className="space-y-6 py-10">
            <Loader2
              size={60}
              className="mx-auto text-indigo-600 animate-spin"
            />
            <h2 className="text-2xl font-black text-slate-900">
              Finalizing Pass...
            </h2>
            <p className="text-slate-500 font-bold">
              We&apos;re generating your unique access code.
            </p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 mb-2">
              You&apos;re In!
            </h1>
            <p className="text-slate-500 font-bold mb-8">
              Your registration is confirmed. Show this code at the gate for
              entry.
            </p>

            <div className="bg-indigo-600 rounded-[2.5rem] p-8 mb-6 relative overflow-hidden shadow-xl shadow-indigo-100">
              {/* <Ticket className="absolute -right-4 -bottom-4 text-indigo-500 w-24 h-24 rotate-12 opacity-50" /> */}
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">
                Guest Access Code
              </p>
              <p className="text-4xl font-black text-white tracking-tighter">
                {code}
              </p>
            </div>

            {email && (
              <div className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Mail size={18} className="text-indigo-600" />
                </div>
                <p className="text-sm font-bold text-slate-600">
                  Access code sent to email:
                </p>
                <p className="text-sm font-black text-indigo-600 break-all">
                  {email}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
