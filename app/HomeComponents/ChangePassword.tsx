"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { changePassword } from "../services/apis";

export default function ChangePassword() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleUpdate = async () => {
    if (formData.new !== formData.confirm) {
      console.log("Passwords:", formData.new, formData.confirm);
      return alert("New Passwords do not match");
    }

    if (formData.new.length < 6) {
      return alert("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const role = "admin";
      const data = await changePassword(formData.current, formData.new, role);

      if (data.success) {
        alert("Password updated successfully");
        setFormData({ current: "", new: "", confirm: "" });
      } else {
        alert(data.message || "Could not update password");
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6">
      <Link
        href="/home/settings"
        className="flex items-center justify-start w-full gap-2 text-slate-500 font-bold text-sm hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Settings
      </Link>
      <div className="w-full max-w-md space-y-8 mt-10">
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Update Password
            </h1>
            <p className="text-slate-400 text-sm font-medium">
              Ensure your account stays secure
            </p>
          </div>

          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={formData.current}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current: e.target.value,
                    }))
                  }
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-4 text-slate-300"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                New Password
              </label>
              <input
                type="password"
                value={formData.new}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, new: e.target.value }))
                }
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="New secret key"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Confirm New Password
              </label>
              <input
                type="password"
                value={formData.confirm}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, confirm: e.target.value }))
                }
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                placeholder="Repeat new secret key"
              />
            </div>
          </div>

          <button
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            onClick={handleUpdate}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Updating...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
