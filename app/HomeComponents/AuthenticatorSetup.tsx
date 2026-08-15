"use client";

import React, { useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ShieldCheck, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface TotpMfaSetupProps {
  onComplete: (secret: string) => void;
}

export default function TotpMfaSetupComponent({
  onComplete,
}: TotpMfaSetupProps) {
  const [loading, setLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false); // 👈 Linked below
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // State from Backend response
  const [tempSecret, setTempSecret] = useState<string | null>(null);
  const [qrCodeUri, setQrCodeUri] = useState<string | null>(null);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // Step 1: Tell backend to generate a fresh secret
  const handleInitiateMfa = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/estate-users/mfa/setup`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) {
        setTempSecret(data.secret);
        setQrCodeUri(data.qrCodeUri);
      } else {
        setError(data.message || "Failed to initialize MFA setup.");
        toast.error(data.message || "Failed to initialize MFA setup.");
      }
    } catch (err) {
      setError("Network connectivity error.");
      toast.error("Network connectivity error.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const finalOtpString = newOtp.join("");
    if (finalOtpString.length === 6) {
      handleVerifyAndActivate(finalOtpString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = ""; // Clear out preceding block cleanly
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Modern Clipboard Interception Flow
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();

    if (/^\d{6}$/.test(pastedData)) {
      const pastedArray = pastedData.split("");
      setOtp(pastedArray);
      inputRefs.current[5]?.focus();
      handleVerifyAndActivate(pastedData);
    } else {
      toast.error("Please paste a valid 6-digit numeric token.");
    }
  };

  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
  };

  // Step 2: Validate the user's first generated app code
  const handleVerifyAndActivate = async (tokenString: string) => {
    if (!tokenString || tokenString.length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    const currentSecret = tempSecret;

    if (!currentSecret) {
      setError("MFA session expired. Please restart setup.");
      return;
    }

    setVerificationLoading(true); // 👈 Toggles on state wrapper
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/api/estate-users/mfa/verify-totp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenString,
          secret: currentSecret,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setQrCodeUri(null);
        toast.success("MFA synchronization verified completely!");

        setTimeout(() => {
          onComplete(currentSecret);
        }, 800);

        setTempSecret(null);
      } else {
        setError(data.message || "Invalid code matrix mismatch.");
        toast.error(data.message || "Invalid code matrix mismatch.");
        setOtp(["", "", "", "", "", ""]); // Reset layout values on mismatch error
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Verification failed.");
      toast.error("Verification failed.");
    } finally {
      setVerificationLoading(false); // 👈 Shuts off state wrapper
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-4xl border border-slate-100 shadow-xl shadow-slate-100/40">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 font-montserrat">
            Authenticator App
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Secure root terminal operations
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-100 text-rose-600 p-3.5 rounded-xl flex items-center gap-2 text-sm font-medium">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">MFA Activated Status</p>
            <p className="text-xs text-emerald-600/80">
              Google Authenticator is now successfully linked.
            </p>
          </div>
        </div>
      )}

      {!qrCodeUri && !success && (
        <button
          onClick={handleInitiateMfa}
          disabled={loading}
          className="w-full py-3.5 bg-gm-charcoal hover:bg-slate-800 text-white rounded-2xl font-semibold tracking-wide shadow-lg transition-all flex items-center justify-center disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Enable App Authentication"
          )}
        </button>
      )}

      {qrCodeUri && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-center">
            <QRCodeSVG
              value={qrCodeUri}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>

          <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed font-sans">
            <p>
              1. Open your Authenticator Application (Google Authenticator,
              Authy, etc.).
            </p>
            <p>
              2. Tap the scan button and focus on the code grid QR window image
              shown above.
            </p>
            <p>
              3. Enter the changing 6-digit confirmation key below to link
              settings variables.
            </p>
          </div>

          <div className="flex flex-col">
            {/* Added onPaste handler container */}
            <div
              className="flex justify-between gap-2 mb-6"
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  disabled={verificationLoading}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-12 h-14 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-gm-charcoal focus:ring-4 focus:ring-indigo-50 outline-none transition-all disabled:opacity-50"
                />
              ))}
            </div>

            <div className="space-y-3">
              {/* Swapped token state references to verificationLoading */}
              {verificationLoading && (
                <div className="w-full py-3 bg-slate-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-sans font-bold text-slate-500">
                  <Loader2
                    className="animate-spin text-gm-charcoal"
                    size={16}
                  />
                  Validating Core Secrets...
                </div>
              )}

              {!verificationLoading && (
                <button
                  onClick={handleCancelOtp}
                  className="w-full py-2 text-slate-400 font-medium hover:text-slate-600 text-xs transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
