"use client";

import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Lock,
  Trash2,
  CreditCard,
  ShieldAlert,
  ChevronRight,
  Search,
  Plus,
  AlertCircle,
  Mail,
  CheckCircle2,
  Phone,
  Loader2,
} from "lucide-react";
import "react-phone-number-input/style.css";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { useUser } from "../UserContext";
import { EmergencyContact } from "../services/types";
import { sendPofileChangeOtpApi } from "../services/apis";

export default function Settings() {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("manual");
  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [selectedBank, setSelectedBank] = useState<{
    name: string;
    code: string;
  }>({ name: "", code: "" });
  const [accountNumber, setAccountNumber] = useState(
    user?.bank_account_number ? user.bank_account_number : "Not set",
  );
  const [accountName, setAccountName] = useState(
    user?.bank_account_name ? user.bank_account_name : "Not set",
  );
  const [bankName, setBankName] = useState(
    user?.bank_name ? user.bank_name : "Not set",
  );
  const [isResolving, setIsResolving] = useState(false);
  const [externalUrl, setExternalUrl] = useState(user?.external_api_url || "");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [metadata, setMetadata] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyingField, setVerifyingField] = useState<
    "email" | "phone" | null
  >(null);

  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >(user?.emergency_contacts || []);
  const [newContact, setNewContact] = useState({ name: "", phone: "" });

  const [profile, setProfile] = useState({
    estateName: user?.estate_name || "Not set",
    estateCode: user?.estate_code,
    adminName: user?.name || "Not set",
    email: user?.email || "Not set",
    phone: user?.phone_number || undefined,
    phone_verified: false,
    email_verified: false,
  });
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const hasChanges =
    profile.adminName !== (user?.name || "") ||
    profile.email !== (user?.email || "") ||
    profile.phone !== (user?.phone_number || "") ||
    paymentMethod !== (user?.payment_type || "manual") ||
    externalUrl !== (user?.external_api_url || "") ||
    JSON.stringify(emergencyContacts) !==
      JSON.stringify(user?.emergency_contacts || []) ||
    accountNumber !== (user?.bank_account_number || "") ||
    selectedBank.code !== (user?.bank_code || "");

  useEffect(() => {
    if (user) {
      setProfile({
        estateName: user.estate_name || "Not set",
        estateCode: user.estate_code,
        adminName: user.name || (isEditing ? "" : "Not set"),
        email: user.email || (isEditing ? "" : "Not set"),
        phone: user.phone_number || (isEditing ? "" : undefined),
        phone_verified: true,
        email_verified: true,
      });

      // Apply same fix for account number
      setAccountNumber(
        user.bank_account_number || (isEditing ? "" : "Not set"),
      );

      setAccountName(user.bank_account_name || "Not set");
      setBankName(user.bank_name || "Not set");
      setExternalUrl(user.external_api_url || "");
      setEmergencyContacts(user.emergency_contacts || []);
    }
  }, [user, isEditing]);

  const handleFieldChange = (field: "email" | "adminName", value: string) => {
    setProfile((prev) => {
      let isVerified = false;
      // Always compare against the source of truth (user context)
      if (field === "email") isVerified = value === user?.email;

      return {
        ...prev,
        [field]: value,
        [`${field}_verified`]: isVerified,
      };
    });
  };

  const handlePhoneChange = (value: string | undefined) => {
    if (value)
      {if (!isValidPhoneNumber(value)) {
      alert(
        "Invalid phone number format. Please check the number and country code.",
      );
      return;
    }}
    const phoneValue = value || "";
    setProfile((prev) => {
      const originalPhone = user?.phone_number || "";
      const isUnchanged = phoneValue === originalPhone;
      const isVerified = isUnchanged;

      return {
        ...prev,
        phone: phoneValue,
        phone_verified: isVerified,
      };
    });
  };

  const handleRequestOtp = async (target: string, type: "email" | "phone") => {
    setVerifyingField(type);
    setOtpLoading(true);
    setError(null);
    try {
      const otpRes = await sendPofileChangeOtpApi(target, type);
      if (otpRes.success) {
        console.log("OTP return:", otpRes);
        setMetadata(otpRes.metadata);
        setShowOtpInput(true);
      } else {
        console.log("OTP fail return:", otpRes);
        alert(otpRes.message);
        setError(otpRes.message || "Failed to send OTP");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setOtpLoading(false);
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
      handleOtpVerify(finalOtpString);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpVerify = async (finalOtp:string) => {
    setOtpLoading(true);
    try {
      const res = await fetch("/api/admin/verify-otp-only", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: finalOtp,
          metadata: metadata,
          target: verifyingField === "email" ? profile.email : profile.phone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          [`${verifyingField}_verified`]: true,
        }));
        setShowOtpInput(false);
        setOtp(["", "", "", "", "", ""]);
      } else {
        setError(data.message || "Invalid Code");
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleCancelOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    setShowOtpInput(false);
    setVerifyingField(null);
  };

  const addEmergencyContact = () => {
    if (!newContact.name.trim() || !newContact.phone) {
      alert("Please enter both a name and a phone number.");
      return;
    }

    // 2. Strict E.164 validation
    if (!isValidPhoneNumber(newContact.phone)) {
      alert(
        "Invalid phone number format. Please check the number and country code.",
      );
      return;
    }

    // 3. Prevent duplicates
    const isDuplicate = emergencyContacts.some(
      (c) => c.phone === newContact.phone,
    );
    if (isDuplicate) {
      alert("This number is already in your emergency contacts.");
      return;
    }
    setEmergencyContacts([
      ...emergencyContacts,
      { ...newContact, id: Date.now() },
    ]);
    setNewContact({ name: "", phone: "" });
  };

  const removeContact = (id: number) => {
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const resolveAccount = async () => {
    if (accountNumber.length === 10 && selectedBank.code) {
      setIsResolving(true);
      try {
        const res = await fetch(
          `/api/kyc/resolve-bank?accountNumber=${accountNumber}&bankCode=${selectedBank.code}`,
        );
        const data = await res.json();
        setAccountName(
          data.status ? data.data.account_name : "Invalid Account",
        );
      } catch (err) {
        setAccountName("Error connecting to server");
      } finally {
        setIsResolving(false);
      }
    }
  };

  const handleSaveConfig = async () => {
    if (!hasChanges) {
      alert("No changes detected to save.");
      // setIsEditing(false);
      return;
    }

    const isEmailChanged = profile.email !== user?.email;
    const isPhoneChanged = profile.phone !== user?.phone_number;

    if (isEmailChanged && !profile.email_verified) {
      alert("Please verify your new email address before saving.");
      return; // Exit the function early
    }

    if (isPhoneChanged && !profile.phone_verified) {
      alert("Please verify your new phone number before saving.");
      return; // Exit the function early
    }
    setSaving(true);
    const payload = {
      config: {
        admin_name: profile.adminName,
        email: profile.email,
        phone_number: profile.phone,
        payment_type: paymentMethod,
        external_api_url: externalUrl,
        emergency_contacts: emergencyContacts,
        bank_details: {
          bank_name: selectedBank.name,
          bank_code: selectedBank.code,
          account_number: accountNumber,
          account_name: accountName,
        },
      },
    };

    try {
      const res = await fetch("/api/admin/update-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        window.location.reload();
        setIsEditing(false);
        alert("Configuration saved!");
      } else {
        setError(data.message || "Update failed");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAccountName(user?.bank_account_name || "Not set");
    setAccountNumber(user?.bank_account_number || "Not set");
    setBankName(user?.bank_name || "Not set");
    setExternalUrl(user?.external_api_url || "");
    setEmergencyContacts(user?.emergency_contacts || []);
    setProfile({
      estateName: user?.estate_name || "Not set",
      estateCode: user?.estate_code,
      adminName: user?.name || "Not set",
      email: user?.email || "Not set",
      phone: user?.phone_number || "Not set",
      phone_verified: false,
      email_verified: false,
    });
    setIsEditing(false);
    setError(null);
  };

  const confirmAction = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/admin/terminate-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        alert("Account terminated successfully.");
        window.location.href = "/";
      } else {
        alert(data.message || "Failed to terminate account");
      }
    } catch (err) {
      alert("A network error occurred.");
    } finally {
      setLoadingAction(false);
      setShowDeletePrompt(false);
    }
  };

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch("https://api.paystack.co/bank", {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY}`,
          },
        });
        const data = await res.json();
        setBanks(data.data);
      } catch (err) {
        console.error("Failed to fetch banks");
      }
    };
    fetchBanks();
  }, []);

  return (
    <div className="relative flex-1 overflow-y-auto p-6 space-y-8 h-[calc(100vh-120px)] bg-slate-50/50">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Estate Configuration
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Configure how residents interact with the estate
          </p>
        </div>
        <div className="flex gap-3">
          {isEditing && (
            <button
              onClick={handleCancel}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
          )}
          <button
            onClick={() =>
              isEditing ? handleSaveConfig() : setIsEditing(true)
            }
            disabled={isEditing && (saving || !hasChanges)}
            className={`px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all ${
              isEditing
                ? !hasChanges || saving
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95" 
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50" 
            }`}
          >
            {isEditing
              ? saving
                ? "Saving..."
                : "Save Configuration"
              : "Edit Settings"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Section */}
          <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="text-indigo-600" size={20} />
              <h2 className="font-bold text-slate-900">Core Identity</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Estate Name
                </label>
                <div className="p-4 bg-slate-100 rounded-2xl font-bold text-slate-500 flex items-center gap-2">
                  <Lock size={14} /> {profile.estateName}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Public Estate ID
                </label>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-600">
                  <code>{profile.estateCode}</code>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Primary Admin Name
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.adminName}
                  onChange={(e) =>
                    handleFieldChange("adminName", e.target.value)
                  }
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900"
                />
              </div>

              {/* Email with Verification */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={profile.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 pr-32"
                  />
                  <div className="absolute right-2 top-2 bottom-2 flex items-center">
                    {profile.email_verified ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 animate-in zoom-in">
                        <CheckCircle2 size={16} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          Verified
                        </span>
                      </div>
                    ) : (
                      isEditing && (
                        <button
                          onClick={() =>
                            handleRequestOtp(profile.email, "email")
                          }
                          className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-transform"
                        >
                          {otpLoading ? "Sending OTP" : "Verify"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Phone with Verification */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Phone Number
                </label>
                <div
                  className={`flex items-center justify-center w-full p-4 bg-slate-50 rounded-2xl border-2 transition-all ${isEditing ? "border-transparent focus-within:border-indigo-500 bg-white shadow-sm" : "border-transparent"}`}
                >
                  {!isEditing && !profile.phone ? (
                    /* Show the "Not set" placeholder only when NOT editing */
                    <div className="flex-1 p-3 font-bold text-slate-400">
                      Not set
                    </div>
                  ) : (
                    /* Only render the actual Input if we are editing OR if there is a number to show */
                    <PhoneInput
                      international
                      defaultCountry="NG"
                      disabled={!isEditing}
                      /* Ensure we never pass "Not set" to the value prop */
                      value={
                        profile.phone === "Not set" ? undefined : profile.phone
                      }
                      onChange={handlePhoneChange}
                      className="flex-1 font-bold text-slate-900 ml-2"
                    />
                  )}

                  {/* Verification UI remains the same */}
                  <div className="flex items-center">
                    {profile.phone_verified ? (
                      <div className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={16} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                          Verified
                        </span>
                      </div>
                    ) : (
                      isEditing &&
                      profile.phone && (
                        <button
                          onClick={() =>
                            handleRequestOtp(profile.phone!, "phone")
                          }
                          className="bg-amber-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase active:scale-95 transition-transform whitespace-nowrap"
                        >
                          {otpLoading ? "Sending..." : "Verify"}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white p-8 rounded-4xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={20} />
                <h2 className="font-bold text-slate-900">Payment Routing</h2>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {["manual", "api"].map((type) => (
                  <button
                    key={type}
                    disabled={!isEditing}
                    onClick={() => setPaymentMethod(type)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      paymentMethod === type
                        ? "bg-white shadow-sm text-slate-900"
                        : "text-slate-400"
                    }`}
                  >
                    {type === "manual" ? "Direct Bank" : "Legacy Site"}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === "manual" ? (
              <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isEditing ? (
                    <select
                      disabled={!isEditing}
                      className="p-4 bg-white border-none rounded-2xl font-bold text-slate-900 shadow-sm"
                      value={selectedBank.code}
                      onChange={(e) => {
                        const b = banks.find((b) => b.code === e.target.value);
                        if (b) {
                          setSelectedBank(b);
                          setBankName(b.name);
                        }
                      }}
                    >
                      <option value="">Select Bank</option>
                      {banks.map((bank, index) => (
                        <option key={`${bank.code}-${index}`} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="p-4 bg-white border-none rounded-2xl font-bold text-slate-900 shadow-sm">
                      {bankName}
                    </p>
                  )}

                  {isEditing ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        disabled={!isEditing}
                        placeholder="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="flex-1 p-4 bg-white border-none rounded-2xl font-bold text-slate-900 shadow-sm"
                      />
                      <button
                        onClick={resolveAccount}
                        className="bg-emerald-600 text-white px-4 rounded-2xl hover:bg-emerald-700 transition-colors"
                      >
                        <Search size={18} />
                      </button>
                    </div>
                  ) : (
                    <p className="flex-1 p-4 bg-white border-none rounded-2xl font-bold text-slate-900 shadow-sm">
                      {accountNumber}
                    </p>
                  )}
                </div>
                <div className="px-4 py-2 bg-emerald-100/50 rounded-xl text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                  {isEditing && isResolving
                    ? "Verifying..."
                    : accountName || "No account Name"}
                </div>
              </div>
            ) : (
              <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  External Payment URL
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://your-legacy-portal.com"
                  className="w-full p-4 bg-white border-none rounded-2xl font-bold text-slate-900 shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Emergency Contacts */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-6 rounded-4xl text-white flex flex-col h-[400px] shadow-xl">
            <div className="flex items-center gap-2 mb-4 shrink-0">
              <ShieldAlert className="text-red-400" size={20} />
              <h2 className="font-bold">Emergency Contacts</h2>
            </div>

            {/* Scrollable Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {emergencyContacts.length > 0 ? (
                emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase text-slate-500 mb-1 leading-none">
                        {contact.name}
                      </p>
                      <div className="flex items-center">
                        <PhoneInput
                          international
                          defaultCountry="NG"
                          disabled={!isEditing}
                          value={contact.phone}
                          onChange={() => {}}
                          className="flex items-center text-sm font-bold text-white [&_input]:bg-transparent [&_input]:border-none [&_input]:p-0"
                        />
                      </div>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeContact(contact.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-slate-500 text-xs italic">
                  No emergency numbers added.
                </div>
              )}
            </div>

            {/* Fixed Bottom Section (Outside the scroll) */}
            {isEditing && (
              <div className="pt-4 mt-4 border-t border-white/10 space-y-2 shrink-0">
                <input
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  placeholder="Service Name (e.g. Security)"
                  className="w-full p-3 bg-white/10 rounded-xl text-sm font-bold text-white outline-none border border-transparent focus:border-indigo-500 transition-all placeholder:text-slate-500"
                />

                <div className="flex gap-2">
                  {/* The Phone Input Container */}
                  <div className="flex-1 flex items-center bg-white/10 rounded-xl px-3 border border-transparent focus-within:border-indigo-500 transition-all">
                    <PhoneInput
                      international
                      defaultCountry="NG"
                      value={newContact.phone}
                      onChange={(val) =>
                        setNewContact({ ...newContact, phone: val || "" })
                      }
                      className="flex-1 flex items-center text-sm font-bold text-white [&_input]:bg-transparent [&_input]:border-none [&_input]:outline-none [&_input]:p-3 [&_input]:w-full [&_select]:bg-transparent [&_select]:text-white"
                    />
                  </div>

                  <button
                    onClick={addEmergencyContact}
                    disabled={!newContact.name || !newContact.phone}
                    className={`px-4 rounded-xl font-black text-[10px] uppercase flex items-center gap-1 transition-all ${
                      newContact.name && newContact.phone
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 active:scale-95"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Security Actions */}
          <div className="bg-white p-6 rounded-4xl border border-slate-100 shadow-sm space-y-2">
            <button
              onClick={() =>
                (window.location.href = "/home/settings/change-password")
              }
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Lock size={18} />
                </div>
                <span className="font-bold text-slate-700 text-sm">
                  Security & Password
                </span>
              </div>
              <ChevronRight size={16} className="text-slate-300" />
            </button>
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-2xl transition-colors group"
              onClick={() => setShowDeletePrompt(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 text-red-600 rounded-lg group-hover:scale-110 transition-transform">
                  <Trash2 size={18} />
                </div>
                <span className="font-bold text-red-600 text-sm">
                  Terminate Account
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* OTP MODAL */}
      {showOtpInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl scale-in-center border border-slate-100">
            <div className="text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {verifyingField === "email" ? (
                  <Mail size={32} />
                ) : (
                  <Phone size={32} />
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Verify your {verifyingField}
              </h3>
              <p className="text-slate-500 text-sm">
                Enter the code sent to <br />
                <span className="font-semibold text-slate-900">
                  {verifyingField === "email" ? profile.email : profile.phone}
                </span>
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
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onChange={(e) => handleOtpChange(e.target.value, index)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-indigo-500 transition-all outline-none"
                />
              ))}
            </div>

            <div className="space-y-4">
              <button
                disabled={otpLoading || otp.some((d) => !d)}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center"
              >
                {otpLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify Code"
                )}
              </button>
              <button
                onClick={handleCancelOtp}
                className="w-full py-2 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600"
              >
                Cancel
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-rose-50 text-rose-600 p-3 rounded-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-2">
                <AlertCircle size={18} /> <span>{error}</span>
              </div>
            )}
          </div>
        </div>
      )}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-4xl p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6">
              <ShieldAlert size={32} />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Terminate Estate?
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              This action is{" "}
              <span className="font-bold text-slate-900 underline">
                irreversible
              </span>
              . By terminating your account, you will permanently delete this
              estate, all resident data, payment histories, and access for all
              associated users.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={confirmAction}
                disabled={loadingAction}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-red-200 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loadingAction ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  "Yes, Terminate Everything"
                )}
              </button>
              <button
                onClick={() => setShowDeletePrompt(false)}
                className="w-full py-3 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel and Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
