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
  Sparkles,
  ShieldCheck,
  Home,
  X,
  Smartphone,
} from "lucide-react";
import { useUser } from "../UserContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { checkSession, sendOtpApi } from "../services/apis";
import { states_lgas } from "../utils/states_lgas";
import toast from "react-hot-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setPlan } = useUser();
  const router = useRouter();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [adminName, setAdminName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<
    "estate_management" | "security_only" | "combo" | null
  >(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  // const [town, setTown] = useState('');
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [mfaType, setMfaType] = useState<"EMAIL" | "TOTP" | "NONE">("NONE");
  const [otpLoading, setOtpLoading] = useState(false);
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

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
  };

  const handleRequestOtp = async () => {
    if (!isLogin && !selectedPlan) {
      setError("Please choose a subscription plan to continue.");
      setShowPlanModal(true);
      return;
    }

    const trimmedEmail = email.trim();

    if (!isLogin) {
      if (!validateEmail(trimmedEmail)) {
        toast.error("Invalid Email. Check your email format.");
        setLoading(false);
        return;
      }

      setError("");
      setRequestingOtp(true);
    }

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
      if (!isLogin) {
        handleRegister(finalOtpString);
      } else {
        handleOtpVerify(finalOtpString);
      }
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

    if (!selectedPlan) {
      alert("Please select a plan");
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
        adminName,
        selectedPlan,
      );

      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (finalOtp: string) => {
    setOtpLoading(true);
    setError(null);

    try {
      let coordinates = null;

      if (navigator.geolocation) {
        try {
          // 🎯 Explicitly define the Promise return signature as GeolocationPosition
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 7000,
              });
            },
          );

          coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch (geoError: any) {
          if (geoError.code === geoError.PERMISSION_DENIED) {
            setError(
              "Access Denied: Administrative security policy requires location verification.",
            );
            setLoading(false);
            return;
          }

          console.warn(
            "Hardware position unavailable. Falling back safely to IP anchoring.",
          );
        }
      } else {
        console.warn(
          "Browser environment does not support geolocation metrics.",
        );
      }
      const response = await fetch("/api/estate-users/verify-otp-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: finalOtp,
          target: email,
          type: mfaType === "TOTP" ? "totp" : "email",
          metadata: mfaType === "EMAIL" ? metadata : undefined,
          rememberMe: rememberMe,
          coordinates,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        router.push("/home/dashboard");
        setShowOtpInput(false);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(data.message || "Verification failed. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setError("Connection to verification engine failed. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin && !isForgot) {
      if (!adminName || !adminName.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!selectedPlan) {
        setError("Please choose a subscription plan to continue.");
        setShowPlanModal(true);
        return;
      }
    }
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
        let coordinates = null;

        if (navigator.geolocation) {
          try {
            // 🎯 Explicitly define the Promise return signature as GeolocationPosition
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true,
                  timeout: 7000,
                });
              },
            );

            coordinates = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
          } catch (geoError: any) {
            if (geoError.code === geoError.PERMISSION_DENIED) {
              setError(
                "Access Denied: Administrative security policy requires location verification.",
              );
              setLoading(false);
              return;
            }

            console.warn(
              "Hardware position unavailable. Falling back safely to IP anchoring.",
            );
          }
        } else {
          console.warn(
            "Browser environment does not support geolocation metrics.",
          );
        }

        const data = await db.authenticate(
          email,
          password,
          rememberMe,
          coordinates,
        );
        if (
          !data ||
          (typeof data === "string" && data.includes("<!DOCTYPE html>"))
        ) {
          setError("Server error. Please try again later.");
          return;
        }
        console.log("Auth Data:", data);

        if (data.status === "PASSWORD_RESET_REQUIRED") {
          setLoading(false);

          toast.error(
            (t) => (
              <div className="flex flex-col gap-1.5 p-1">
                <p className="font-sans font-black text-slate-900 text-sm tracking-tight">
                  Administrative Account Lock
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  An administrative password reset has been triggered for your
                  security profile. Please contact the{" "}
                  <strong>System Registrar</strong> to authorize and assign your
                  new login credentials.
                </p>
                <div className="flex justify-end mt-1">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              position: "top-center",
            },
          );
          return;
        }

        if (data.status === "MFA_DEADLINE_MISSED") {
          setLoading(false);

          toast.error(
            (t) => (
              <div className="flex flex-col gap-1.5 p-1">
                <p className="font-sans font-black text-slate-900 text-sm tracking-tight">
                  Administrative Account Lock
                </p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  An administrative block has been triggered due to failure to
                  set MFA. Please contact the <strong>System Registrar</strong>{" "}
                  to reslove the issue.
                </p>
                <div className="flex justify-end mt-1">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-oswald font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ),
            {
              duration: Infinity,
              position: "top-center",
            },
          );
          return;
        }

        if (data.success && data.user && !data.user.email_verified) {
          setUser(data.user);
          setMfaType("EMAIL");
          setLoading(false);

          await handleRequestOtp();
          return;
        }

        // CATCH EMAIL MFA INTERRUPTION
        if (data.status === "EMAIL_MFA_REQUIRED") {
          setUser(data.user);
          setMfaType("EMAIL");
          setLoading(false);

          // Fire off your native frontend OTP generator method automatically!
          await handleRequestOtp();
          return;
        }

        // CATCH TOTP AUTHENTICATOR APP INTERRUPTION
        if (data.status === "TOTP_MFA_REQUIRED") {
          setUser(data.user);
          setMfaType("TOTP");
          setShowOtpInput(true); // Open the entry boxes directly (no delivery cycle needed)
          setLoading(false);
          return;
        }

        if (data.success) {
          setUser(data.user);
          setPlan(data.user.plan);
          if (data.onboarding?.showPasswordWarningPopup) {
            localStorage.setItem("DASHBOARD_PASS_WARN", "true");
          }

          if (data.onboarding?.showMfaSetupOnboarding) {
            localStorage.setItem("DASHBOARD_MFA_WARN", "true");
          }
          router.push("/home/dashboard");
        } else {
          const errorMessage =
            data.error || data.message || "Authentication failed";

          if (
            errorMessage.includes("Unexpected token") ||
            errorMessage.includes("fetch")
          ) {
            setError("The core server is rebooting. Stand by.");
          } else {
            setError(errorMessage);
          }
        }
      } else {
        setMfaType("EMAIL");
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
      <div className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white">
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Your Logo */}
          <Image
            src="/gmlogo_nobg.jpg"
            alt="GateMan Logo"
            width={80}
            height={80}
            priority
            className="object-contain"
          />

          {/* Rotating Spinner Ring */}
          <div className="absolute inset-0 border-4 border-slate-100 border-t-gm-navy rounded-full animate-spin" />
        </div>
      </div>
    );

  return (
    <div className="max-h-screen flex bg-[linear-gradient(to_bottom,#0A1F44_50%,#f1f5f9_50%)] overflow-hidden">
      <div
        className="min-h-screen hidden lg:flex lg:w-2/3 bg-gm-navy relative overflow-hidden"
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

      {/* Right Side - Auth Form */}
      <div
        className="w-full lg:w-1/2 flex flex-col items-center p-8 bg-slate-100 overflow-y-auto h-screen"
        style={{ borderRadius: "120px 0px 0px 0px" }}
      >
        <div className="w-full max-w-md space-y-8 my-auto bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
          <div className="text-center">
            <h2 className="text-3xl font-montserrat text-slate-900 tracking-tight mb-2">
              {isLogin
                ? "Welcome back"
                : isForgot
                  ? "Forgot Password"
                  : "Create an account"}
            </h2>
            <p className="text-slate-500 font-sans">
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
                  <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <UserIcon
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      size={20}
                    />
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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

                <div>
                  <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
                    Subscription Tier
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPlanModal(true)}
                    className="w-full flex items-center justify-between px-5 py-3.5 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-left rounded-2xl transition-all group"
                  >
                    <div>
                      <span className="block text-xs font-semibold text-indigo-500 uppercase tracking-wider">
                        {!selectedPlan ? "No Selection" : "Active Selection"}
                      </span>
                      <span className="text-sm font-bold text-slate-900 capitalize">
                        {selectedPlan === "estate_management" &&
                          "Estate Management Plan"}
                        {selectedPlan === "security_only" &&
                          "Security Officers Plan"}
                        {selectedPlan === "combo" && "Combo Master Plan"}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm group-hover:scale-105 transition-transform">
                      Change Plan
                    </span>
                  </button>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm  font-oswald text-slate-700 mb-1.5 ml-1">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {!isForgot && (
              <div>
                <label className="block text-sm  font-oswald text-slate-700 mb-1.5 ml-1">
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
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
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

            {isLogin && !isForgot && (
              <div className="flex items-center mt-4">
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
                  className="ml-2 block text-sm text-gray-700 font-sans"
                >
                  Remember me
                </label>
              </div>
            )}

            {!isLogin && !isForgot && (
              <div className="grid grid-cols-1 gap-4">
                {/* State Select */}
                <div>
                  <label className="block text-sm  font-oswald text-slate-700 mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none"
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
                  <label className="block text-sm  font-oswald text-slate-700 mb-1.5 ml-1">
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
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none disabled:opacity-50"
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
                  <span className="font-oswald text-indigo-600">
                    Forgot password?
                  </span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center text-white bg-primary/60 hover:bg-primary focus:ring-4 focus:ring-indigo-300 font-montserrat rounded-2xl text-lg px-5 py-4 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
                <span className="font-oswald text-indigo-600">
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
                {mfaType === "EMAIL" ? (
                  <Mail size={32} />
                ) : (
                  <Smartphone size={32} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                {mfaType === "EMAIL"
                  ? "Verify your email"
                  : "Device Verification"}
              </h3>
              <p className="text-slate-500 text-sm">
                {mfaType === "EMAIL" ? (
                  <>
                    We&apos;ve sent a 6-digit code to <br />
                    <span className="font-semibold text-slate-900">
                      {email}
                    </span>
                  </>
                ) : (
                  <>
                    Open your authenticator security application and enter{" "}
                    <br />
                    the changing{" "}
                    <span className="font-semibold text-slate-900">
                      6-digit token
                    </span>{" "}
                    linked to your terminal.
                  </>
                )}
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
                // onClick={() => handleRegister(otp.join(""))}
                disabled={loading || otp.some((d) => !d)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify"
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
      {/* PLAN SELECTOR MODAL OVERLAY */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl scale-in-center border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div
              className="w-full h-fit text-md flex justify-end"
              onClick={() => setShowPlanModal(false)}
            >
              <X size={16} />
            </div>
            <div className="text-center space-y-2 mb-8">
              <h3 className="text-3xl font-montserrat text-slate-900 tracking-tight">
                Select Your Subscription Plan
              </h3>
              <p className="text-slate-500 font-sans text-sm">
                Choose the operational blueprint that fits your estate&apos;s
                needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Option 1: Estate Management */}
              <button
                type="button"
                onClick={() => setSelectedPlan("estate_management")}
                className={`flex flex-col text-left p-6 rounded-[1.8rem] border-2 transition-all h-full justify-between ${
                  selectedPlan === "estate_management"
                    ? "border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-100"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      selectedPlan === "estate_management"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Home size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                    Estate Management Plan
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Full coverage suite to register, manage, and coordinate all
                    residents, administrative properties, and security stations
                    with simplified security workflows.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100/80 w-full">
                  <span
                    className={`text-xs font-bold ${
                      selectedPlan === "estate_management"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedPlan === "estate_management"
                      ? "Selected"
                      : "Choose this Option"}
                  </span>
                </div>
              </button>

              {/* Option 2: Security Only */}
              <button
                type="button"
                onClick={() => setSelectedPlan("security_only")}
                className={`flex flex-col text-left p-6 rounded-[1.8rem] border-2 transition-all h-full justify-between ${
                  selectedPlan === "security_only"
                    ? "border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-100"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      selectedPlan === "security_only"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <ShieldCheck size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                    Security Only Plan
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Tailored strictly for gate security operations. Track active
                    guard duty rosters, process gatepass verifications, and
                    monitor visitor queues instantly.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100/80 w-full">
                  <span
                    className={`text-xs font-bold ${
                      selectedPlan === "security_only"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedPlan === "security_only"
                      ? "Selected"
                      : "Choose this Option"}
                  </span>
                </div>
              </button>

              {/* Option 3: Combo Master */}
              <button
                type="button"
                onClick={() => setSelectedPlan("combo")}
                className={`flex flex-col text-left p-6 rounded-[1.8rem] border-2 transition-all h-full justify-between relative ${
                  selectedPlan === "combo"
                    ? "border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-100"
                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                }`}
              >
                <div className="absolute top-3 right-3 bg-indigo-600 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Popular
                </div>
                <div>
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      selectedPlan === "combo"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    <Sparkles size={20} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base mb-2 leading-snug">
                    Combo Master Plan
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Get both administration management and full active security
                    system protocols. The ultimate system to synchronize staff,
                    residents, and gates in real time.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100/80 w-full">
                  <span
                    className={`text-xs font-bold ${
                      selectedPlan === "combo"
                        ? "text-indigo-600"
                        : "text-slate-400"
                    }`}
                  >
                    {selectedPlan === "combo"
                      ? "Selected"
                      : "Choose this Option"}
                  </span>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              className="w-full py-4 bg-slate-950 text-white hover:bg-slate-900 rounded-2xl font-bold text-lg transition-all"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
