/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useRef, useState } from "react";
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
import { sendOtpApi } from "../services/apis";
import { states_lgas } from "../utils/states_lgas";

export default function Auth() {
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
  // const [town, setTown] = useState('');
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [show, setShow] = useState(false);

  const availableLgas = useMemo(() => {
    const stateData = states_lgas.find((s) => s.state === state);
    return stateData ? stateData.lgas : [];
  }, [state]);

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
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
    const cleanValue = value.replace(/[^0-9]/g, "").slice(-1); // Only last char
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Move focus forward
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    const finalOtpString = newOtp.join("");
    if (finalOtpString.length === 6) {
      handleRegister(finalOtpString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    // Move focus back on backspace if current field is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Inside your component
  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]); // Reset the 6 boxes
    setError(""); // Clear any previous "Invalid Code" errors
    setShowOtpInput(false); // Close the modal
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
      // Matches your db.register(name, email, password, city, town, newOtp, metadata)
      await db.register(
        name,
        trimmedEmail,
        password,
        state,
        lga,
        enteredOtp,
        metadata,
      );

      // If db.register finishes without throwing an error,
      // it means the popup/redirect was triggered.
      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      // This catches the "throw new Error" from your db.register
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
          setIsForgot(false); // Send them back to login
          setIsLogin(true);
        } else {
          throw new Error(res.message || "Failed to send reset link");
        }
      } else if (isLogin) {
        const data = await db.authenticate(email, password);
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
          console.log("login error:",data.error)
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

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/40 mix-blend-multiply z-10" />
        <img
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
          alt="Modern Apartment"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between h-full p-16 text-white">
          <div className="relative w-full h-32 rounded-2xl flex items-center overflow-hidden">
            <Image
              src="/gateman_w_nobg_cropped.png"
              alt="GateMan Logo"
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-bold leading-tight">
              Modern Living,
              <br />
              Simplified.
            </h1>
            <p className="text-lg text-indigo-100/90 leading-relaxed">
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
                <span className="font-bold text-sm">2,000+ Residents</span>
                <span className="text-xs text-indigo-200">Trust Gateman</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-indigo-200/60 font-medium">
            © 2026 Gateman Inc. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-100">
        <div className="w-full max-w-md space-y-8 bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {isLogin
                ? "Welcome back"
                : isForgot
                  ? "Forgot Password"
                  : "Create an account"}
            </h2>
            <p className="text-slate-500">
              {isLogin
                ? "Enter your details to access your account"
                : isForgot
                  ? "Enter your email to reset your password"
                  : "Join your community today"}
            </p>
          </div>

          <div
            className={`${error ? "bg-rose-50" : "bg-white"} text-rose-600 p-2 h-12 rounded-xl flex items-center gap-3 text-sm font-bold ${error && "border border-rose-100"} animate-shake`}
          >
            {error && !showOtpInput && (
              <>
                <AlertCircle size={18} />
                {error}
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && !isForgot && (
              <>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                      placeholder="Platinum Estate"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
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
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                    placeholder="••••••••"
                  />
                  {/* Moved to the right and added cursor-pointer */}
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

            {!isLogin && !isForgot && (
              <div className="grid grid-cols-1 gap-4">
                {/* State Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none"
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

                {/* City (LGA) Select */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none disabled:opacity-50"
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

                {/* Town Input */}
                {/* <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">
                    Town / Street Address
                  </label>
                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type="text"
                      required
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium"
                      placeholder="e.g. 12 Chevron Drive"
                    />
                  </div>
                </div> */}
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
                  className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                >
                  <span className="font-bold text-indigo-600">
                    Forgot password?
                  </span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white bg-primary/60 hover:bg-primary focus:ring-4 focus:ring-indigo-300 font-bold rounded-2xl text-lg px-5 py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
              >
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <span className="font-bold text-indigo-600">
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
                className="text-sm font-medium text-slate-500 hover:text-indigo-600"
              >
                <span className="font-bold text-indigo-600">Back to Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* OTP MODAL OVERLAY */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl scale-in-center border border-slate-100">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Verify your email
              </h3>
              <p className="text-slate-500 text-sm">
                We&apos;ve sent a 6-digit code to <br />
                <span className="font-semibold text-slate-900">{email}</span>
              </p>
            </div>

            <div className="flex justify-between gap-2 mb-8">
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
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleRegister(otp.join(""))}
                disabled={loading || otp.some((d) => !d)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Register"
                )}
              </button>

              <button
                onClick={handleCancelOtp}
                className="w-full py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div
              className={`mb-6 ${error ? "bg-rose-50" : "bg-transparent"} text-rose-600 p-3 min-h-12 rounded-xl flex items-center gap-3 text-sm font-bold transition-all duration-300`}
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

            <p className="text-center text-xs text-slate-400 mt-8">
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
