/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { checkSession, sendOtpApi, sendRegOtpApi } from "../services/apis";
import { states_lgas } from "../utils/states_lgas";
import toast from "react-hot-toast";
import { PlanSelectionModal } from "./PlanSelectionModal";
import { PlanSelectionData } from "../services/types";
import { ADDON_MODULES } from "../services/data";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser, setPlan, setContextEstateId } = useUser();
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [configuredPlan, setConfiguredPlan] = useState<PlanSelectionData>({
    selectedAddOns: [],
    isTrial: false,
  });
  const [planDuration, setPlanDuration] = useState<number>(1);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [lga, setLga] = useState("");
  const [adminName, setAdminName] = useState("");
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
        if (res.success && res?.user?.role == "ADMIN") {
          setUser(res.user);
          window.location.replace("/home/dashboard");
        } else if (!res.success || res?.user?.role !== "ADMIN") {
          setSessionLoading(false);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        setSessionLoading(false);
      }
    }

    cSessionCheck();
  }, [setUser]);

  const validateEmail = (text: string) => {
    const cleanedEmail = text.trim();
    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (reg.test(cleanedEmail)) {
      return true;
    }
    return false;
  };

  const resetFormState = () => {
    setName("");
    setEmail("");
    setPassword("");
    setState("");
    setLga("");
    setAdminName("");
    setConfiguredPlan({
      selectedAddOns: [],
      isTrial: false,
    });
    setPlanDuration(1);
    setOtp(["", "", "", "", "", ""]);
    setMetadata("");
    setError(null);
    setShowOtpInput(false);
    setShowPlanModal(false);
  };

  const handleRequestOtp = async () => {
    if (!isLogin && !configuredPlan.selectedAddOns) {
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
      const otpRes = await (!isLogin
        ? sendRegOtpApi(trimmedEmail)
        : sendOtpApi(trimmedEmail));
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

    if (!configuredPlan.selectedAddOns) {
      toast.error("Please select a plan");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await db.register(
        name,
        state,
        lga,
        configuredPlan,
        planDuration,
        trimmedEmail,
        password,
        enteredOtp,
        metadata,
        adminName,
      );

      if (data?.paymentLink) {
        resetFormState();
        window.location.href = data.paymentLink;
      } else {
        toast.error(data.error || "Registration failed. Please try again.");
      }

      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      toast.error(
        err.message || err.error || "Registration failed. Please try again.",
      );
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
      const response = await fetch(
        `${baseUrl}/api/estate-users/verify-login-otp`,
        {
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
          credentials: "include",
        },
      );

      const data = await response.json();

      if (data.success) {
        setUser(data.user);
        if (data.user?.estate_ids && data.user.estate_ids.length > 0) {
          setContextEstateId(data.user.estate_ids[0]);
          setPlan(data.user.estate_ids[0].plan);
        }
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

      if (!configuredPlan.selectedAddOns) {
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
          toast.success("A reset link has been sent to your email!");
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
          if (data.user?.estate_ids && data.user.estate_ids.length > 0) {
            setContextEstateId(data.user.estate_ids[0]);
            setPlan(data.user.estate_ids[0].plan);
          }
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
    <div className="min-h-screen w-full bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 overflow-y-auto">
      {/* Auth Form Container */}
      <div className="w-full max-w-md my-auto bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white space-y-6">
        {/* Mobile Branding: Logo & App Name */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="relative w-32 h-16 flex items-center justify-center overflow-hidden">
            <Image
              src="/gmadminlogo.jpg"
              alt="GateMan Logo"
              fill
              priority
              className="object-contain object-center"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black font-montserrat text-slate-900 tracking-tight">
              GateMan
            </h1>
            <p className="text-xs text-indigo-500 font-oswald tracking-wide">
              Modern Living, Simplified.
            </p>
          </div>
        </div>

        {/* Dynamic Title / Subtitle */}
        <div className="text-center pt-2">
          <h2 className="text-2xl font-montserrat font-bold text-slate-900 tracking-tight mb-1">
            {isLogin
              ? "Welcome back"
              : isForgot
                ? "Forgot Password"
                : "Create an account"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-sans">
            {isLogin
              ? "Enter your details to access your account"
              : isForgot
                ? "Enter your email to reset your password"
                : "Join your community today"}
          </p>
        </div>

        {/* Error Banner */}
        {error && !showOtpInput && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl flex items-center gap-3 text-sm font-bold border border-rose-100 animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
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
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 hover:border-indigo-200 text-left rounded-2xl transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider whitespace-nowrap">
                        {configuredPlan.selectedAddOns.length === 0
                          ? "No Add-ons Selected"
                          : "Active Plan Configuration"}
                      </span>

                      {configuredPlan.selectedAddOns.length > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 border border-indigo-200/80 tracking-wide whitespace-nowrap">
                          {configuredPlan.isTrial
                            ? "30-Day Trial"
                            : `${planDuration} ${planDuration === 1 ? "Month" : "Months"}`}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"></span>
                        <span className="text-xs text-slate-500 font-medium truncate">
                          Core Platform Access
                        </span>
                      </div>

                      {configuredPlan.selectedAddOns.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {configuredPlan.selectedAddOns.map((addOnId) => {
                            const ADDON_FEATURES = ADDON_MODULES.find(
                              (m) => m.id === addOnId,
                            );

                            return (
                              <span
                                key={addOnId}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                              >
                                {ADDON_FEATURES?.name || addOnId}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 whitespace-nowrap text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-xl border border-indigo-100 shadow-sm text-center">
                    Change
                  </span>
                </button>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
                placeholder="name@company.com"
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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
                  className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block transition-all outline-none font-medium"
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
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
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
                  className="ml-2 block text-xs sm:text-sm text-gray-700 font-sans"
                >
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsForgot(true);
                  setIsLogin(false);
                  setError(null);
                  setEmail("");
                }}
                className="text-xs sm:text-sm font-oswald text-indigo-600 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {!isLogin && !isForgot && (
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none"
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
                <label className="block text-sm font-oswald text-slate-700 mb-1.5 ml-1">
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 font-sans text-slate-900 text-sm rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 block outline-none font-medium appearance-none disabled:opacity-50"
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
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center text-white bg-primary hover:bg-primary/90 focus:ring-4 focus:ring-indigo-300 font-montserrat rounded-2xl text-base py-3.5 transition-all shadow-xl shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
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
                <ArrowRight size={18} className="ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Navigation Switchers */}
        <div className="text-center pt-2">
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
              <span className="font-oswald text-indigo-600 font-semibold">
                {isLogin ? "Sign up" : "Sign in"}
              </span>
            </button>
          )}

          {isForgot && (
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
          )}
        </div>
      </div>

      {/* OTP MODAL OVERLAY */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 sm:p-8 shadow-2xl scale-in-center border border-slate-100">
            <div className="text-center space-y-3 mb-6">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                {mfaType === "EMAIL" ? (
                  <Mail size={28} />
                ) : (
                  <Smartphone size={28} />
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {mfaType === "EMAIL"
                  ? "Verify your email"
                  : "Device Verification"}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                {mfaType === "EMAIL" ? (
                  <>
                    We&apos;ve sent a code to <br />
                    <span className="font-semibold text-slate-900">
                      {email}
                    </span>
                  </>
                ) : (
                  <>Enter the 6-digit code from your authenticator app.</>
                )}
              </p>
            </div>

            <div className="flex justify-between gap-1.5 sm:gap-2 mb-6">
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
                  className="w-10 h-12 text-center text-xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all outline-none"
                />
              ))}
            </div>

            <button
              onClick={handleCancelOtp}
              className="w-full py-2 text-slate-500 text-sm font-medium hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>

            {error && (
              <div className="mt-4 bg-rose-50 text-rose-600 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <p className="text-center text-xs text-slate-400 mt-6">
              Didn&apos;t receive code?{" "}
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
      <PlanSelectionModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onConfirm={([updatedSelection, duration]) => {
          setConfiguredPlan(updatedSelection);
          setPlanDuration(duration);
        }}
        allowTrial={true}
      />
    </div>
  );
}
