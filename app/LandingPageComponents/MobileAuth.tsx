/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { db } from "../services/database";
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeClosed,
  MapPin,
} from "lucide-react";
import { useUser } from "../UserContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { checkSession, sendOtpApi } from "../services/apis";
import { states_lgas } from "../utils/states_lgas";

export default function MobileAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useUser();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("rememberMe") === "true";
    }
    return false;
  });

  const availableLgas = useMemo(() => {
    const stateData = states_lgas.find((s) => s.state === state);
    return stateData ? stateData.lgas : [];
  }, [state]);

  useEffect(() => {
    async function cSessionCheck() {
      const hasAttemptedLogout = sessionStorage.getItem("loggedOut") === "true";

      if (hasAttemptedLogout) {
        sessionStorage.removeItem("loggedOut");
        setSessionLoading(false);
        return;
      }

      try {
        const res = await checkSession();
        if (res.success) {
          setUser(res.user);
          window.location.replace("/home/dashboard");
        } else {
          setSessionLoading(false);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setSessionLoading(false);
      }
    }

    cSessionCheck();
  }, []);

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return reg.test(cleanedEmail);
  };

  const handleRequestOtp = async () => {
    const trimmedEmail = email.trim();
    if (!validateEmail(trimmedEmail)) {
      alert("Invalid Email. Check your email format.");
      setLoading(false);
      return;
    }

    setError("");
    setRequestingOtp(true);

    try {
      const otpRes = await sendOtpApi(trimmedEmail);
      if (otpRes.success) {
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setRequestingOtp(false);
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
      handleRegister(finalOtpString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setShowOtpInput(false);
  };

  const handleRegister = async (enteredOtp: string) => {
    const trimmedEmail = email.trim();

    if (enteredOtp.length !== 6) {
      setError("Please enter the 6-digit code sent to your email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await db.register(
        name,
        trimmedEmail,
        password,
        state,
        lga,
        enteredOtp,
        metadata,
      );

      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isForgot) {
        const res = await db.forgotPassword(email, "admin");

        if (res.success) {
          alert("A reset link has been sent to your email!");
          setIsForgot(false);
          setIsLogin(true);
        } else {
          throw new Error(res.message || "Failed to send reset link");
        }
      } else if (isLogin) {
        const data = await db.authenticate(email, password, rememberMe);
        if (
          !data ||
          (typeof data === "string" && data.includes("<!DOCTYPE html>"))
        ) {
          setError("Server error. Please try again later.");
          return;
        }
        if (data.success) {
          setUser(data.user);
          router.push("/home/dashboard");
        } else {
          const errorMessage =
            data.error || data.message || "Authentication failed";

          if (
            errorMessage.includes("Unexpected token") ||
            errorMessage.includes("fetch")
          ) {
            setError("Server is currently restarting. Please wait a moment.");
          } else {
            setError(errorMessage);
          }
        }
      } else {
        handleRequestOtp();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading)
    return (
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white font-sans">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <Image
            src="/gmlogo_nobg.jpg"
            alt="GateMan Logo"
            width={80}
            height={80}
            priority
            className="object-contain"
          />
          <div className="absolute inset-0 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );

  return (
    <div className="min-h-screen flex bg-[linear-gradient(to_bottom,#0A1F44_50%,#f1f5f9_50%)] font-sans">
      <div
        className="hidden lg:flex lg:w-2/3 bg-gm-navy relative overflow-hidden"
        style={{ borderRadius: "0px 0px 120px 0px" }}
      >
        <div className="absolute inset-0 mix-blend-multiply z-10" />
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

      {/* Auth UI Viewport Wrapper */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-slate-100"
        style={{
          borderRadius: "120px 0px 0px 0px",
        }}
      >
        <div className="w-full max-w-md space-y-8 bg-white p-6 sm:p-8 md:p-12 rounded-4xl sm:rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white my-auto">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 tracking-tight mb-2">
              {isLogin
                ? "Welcome back"
                : isForgot
                  ? "Forgot Password"
                  : "Create an account"}
            </h2>
            <p className="text-slate-500 font-sans text-sm sm:text-base font-medium">
              {isLogin
                ? "Enter your details to access your account"
                : isForgot
                  ? "Enter your email to reset your password"
                  : "Join your community today"}
            </p>
          </div>

          <div
            className={`${error ? "bg-rose-50" : "bg-white"} text-rose-600 p-2 h-12 rounded-xl flex items-center gap-3 text-sm font-sans font-bold ${error && "border border-rose-100"} animate-shake`}
          >
            {error && !showOtpInput && (
              <>
                <AlertCircle size={18} />
                <span className="truncate">{error}</span>
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!isLogin && !isForgot && (
              <>
                <div>
                  <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                    Estate Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-sans font-bold"
                      placeholder="Platinum Estate"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  size={20}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-sans font-bold"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type={show ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-sans font-bold"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {show ? <Eye size={20} /> : <EyeClosed size={20} />}
                  </button>
                </div>
              </div>
            )}

            {isLogin && !isForgot && (
              <div className="flex items-center mt-3 sm:mt-4">
                <input
                  id="remember_me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setRememberMe(isChecked);
                    localStorage.setItem("rememberMe", String(isChecked));
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label
                  htmlFor="remember_me"
                  className="ml-2 block text-sm text-gray-700 font-sans font-medium"
                >
                  Remember me
                </label>
              </div>
            )}

            {!isLogin && !isForgot && (
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-bold appearance-none"
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

                <div>
                  <label className="block text-xs font-oswald font-black text-slate-700 uppercase tracking-wider mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-bold appearance-none disabled:opacity-50"
                    >
                      <option value="">Select LGA</option>
                      {availableLgas.map((lgaItem) => (
                        <option key={lgaItem} value={lgaItem}>
                          {lgaItem}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isLogin && !isForgot && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgot(true);
                    setIsLogin(false);
                    setError(null);
                    setEmail("");
                  }}
                  className="text-sm font-sans font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <span className="font-oswald font-black uppercase tracking-wider text-indigo-600">
                    Forgot password?
                  </span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white bg-primary/60 hover:bg-primary focus:ring-4 focus:ring-indigo-300 font-montserrat font-black rounded-2xl text-base sm:text-lg px-5 py-3.5 sm:py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {loading || requestingOtp ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin
                    ? "Sign In"
                    : isForgot
                      ? "Get Reset Link"
                      : "Create Account"}
                  <ArrowRight size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            {!isForgot && (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setEmail("");
                  setPassword("");
                  setLga("");
                  setName("");
                }}
                className="text-sm font-sans font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <span className="font-oswald font-black text-indigo-600 uppercase tracking-wider">
                  {isLogin ? "Sign up" : "Sign in"}
                </span>
              </button>
            )}
          </div>

          {isForgot && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  setIsLogin(true);
                  setError(null);
                }}
                className="text-sm font-sans font-black text-indigo-600 uppercase tracking-wider"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>

      {/* OTP MODAL OVERLAY */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-4xl sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl scale-in-center border border-slate-100">
            <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Mail size={30} />
              </div>
              <h3 className="text-xl sm:text-2xl font-montserrat font-black text-slate-900">
                Verify your email
              </h3>
              <p className="text-slate-500 font-sans font-medium text-xs sm:text-sm">
                We&apos;ve sent a 6-digit code to <br />
                <span className="font-bold text-slate-900">{email}</span>
              </p>
            </div>

            <div className="flex justify-between gap-1.5 sm:gap-2 mb-6 sm:mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-sans font-black bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <button
                onClick={() => handleRegister(otp.join(""))}
                disabled={loading || otp.some((d) => !d)}
                className="w-full py-3.5 sm:py-4 bg-indigo-600 text-white rounded-2xl font-sans font-black text-base sm:text-lg shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center uppercase tracking-wider"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Register"
                )}
              </button>

              <button
                onClick={handleCancelOtp}
                className="w-full py-2 text-slate-500 font-oswald font-bold uppercase tracking-wider text-sm hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div
              className={`mb-4 sm:mb-6 ${error ? "bg-rose-50" : "bg-transparent"} text-rose-600 p-3 min-h-12 rounded-xl flex items-center gap-3 text-sm font-sans font-bold transition-all duration-300`}
            >
              {error && (
                <>
                  <AlertCircle size={18} className="shrink-0" />
                  <span className="animate-in slide-in-from-left-1">
                    {error}
                  </span>
                </>
              )}
            </div>

            <p className="text-center text-xs text-slate-400 font-sans font-medium mt-6 sm:mt-8">
              Didn&apos;t receive the code?{" "}
              <button
                onClick={handleRequestOtp}
                className="text-indigo-600 font-bold hover:underline"
              >
                Resend
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
