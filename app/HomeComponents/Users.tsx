"use client";

import React, { useState, useEffect } from "react";
import AddAdmin from "./AddUsers";
import ManageUsersPage from "./ManageUsersPage";
import UserLogsPage from "./UsersLogsPage";
import { History, User, UserPlus, ShieldAlert } from "lucide-react";
import { toast } from "react-hot-toast";
import { useUser } from "../UserContext";

// 🔐 TARGET TAB TO PERMISSION ARRAYS
const TAB_PERMISSIONS = {
  users: "view_users",
  add: "add_user",
  logs: "view_user_logs",
  my_logs: "self", // Self logs are readable by any authenticated user
};

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<
    "users" | "add" | "logs" | "my_logs"
  >("users");
  const { user } = useUser();

  // 🧠 LIFECYCLE 1: Force immediate check on mount & clean up toasts on unmount
  useEffect(() => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");
    const hasInitialAccess =
      userPermissions.includes(TAB_PERMISSIONS["users"]) ||
      userPermissions.includes("users_management");

    // If they land on the page and have neither all_access nor view_users permission
    if (!hasAllAccess && !hasInitialAccess) {
      toast.error(
        `Access Denied. You do not hold the authorized credentials required to view the USERS panel workspace.`,
        {
          id: "unauthorized-users-page-lock", // 🚀 Fixed ID stops duplicate toast stacking
          duration: Infinity,
          position: "top-center",
          style: {
            fontWeight: "bold",
            borderRadius: "12px",
            background: "#1E293B",
            color: "#FFFFFF",
            maxWidth: "450px",
          },
        },
      );
    }

    // 🧼 THE CLEANUP FUNCTION: Runs automatically when the user leaves this page component
    return () => {
      toast.dismiss("unauthorized-users-page-lock");
    };
  }, [user]); // Fires immediately when user data context loads up

  /**
   * Intercepts manual tab switching clicks
   */
  const handleTabSwitch = (targetTab: "users" | "add" | "logs" | "my_logs") => {
    const userPermissions = user?.permissions || [];
    const hasAllAccess = userPermissions.includes("all-access");

    // "my_logs" is universally accessible to any logged-in operator
    const isSelfLogRequest = targetTab === "my_logs";
    const hasRequiredPermission =
      isSelfLogRequest ||
      userPermissions.includes(TAB_PERMISSIONS[targetTab]) ||
      userPermissions.includes("users_management");

    // Clear any previous error toasts before checking the next action tab state
    toast.dismiss("unauthorized-users-page-lock");

    if (!hasAllAccess && !hasRequiredPermission) {
      toast.error(
        `Access Denied. You do not hold the authorized credentials required to view the ${targetTab.replace("_", " ").toUpperCase()} panel workspace.`,
        {
          id: "unauthorized-users-page-lock",
          duration: Infinity,
          position: "top-center",
          style: {
            fontWeight: "bold",
            borderRadius: "12px",
            background: "#1E293B",
            color: "#FFFFFF",
            maxWidth: "450px",
          },
        },
      );
      return;
    }

    setActiveTab(targetTab);
  };

  // 🛡️ Conditional execution layout guard
  const currentPermissions = user?.permissions || [];
  const hasAccessToCurrentPanel =
    activeTab === "my_logs" || // Always true for personal logs
    currentPermissions.includes("all-access") ||
    currentPermissions.includes(TAB_PERMISSIONS[activeTab]) ||
    currentPermissions.includes("users_management");

  return (
    <div className="space-y-6 p-4 sm:p-6 font-sans flex flex-col max-h-screen overflow-hidden">
      {/* Dynamic Navigation Bar Layout Tab Controls */}
      <div className="flex justify-start mb-4 shrink-0 min-w-0">
        <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-200/20 shadow-inner">
          <button
            onClick={() => handleTabSwitch("users")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "users"
                ? "bg-white text-blue-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <User size={14} /> Manage Users
          </button>

          <button
            onClick={() => handleTabSwitch("add")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "add"
                ? "bg-white text-blue-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus size={14} /> Add User
          </button>

          <button
            onClick={() => handleTabSwitch("logs")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "logs"
                ? "bg-white text-blue-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History size={14} /> Audit Logs
          </button>

          <button
            onClick={() => handleTabSwitch("my_logs")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "my_logs"
                ? "bg-white text-blue-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History size={14} className="text-gm-gold" /> My Activity Logs
          </button>
        </div>
      </div>

      {/* ─── TAB CONTENT PANELS ─── */}
      <div className="mt-2 animate-in fade-in duration-200 h-[calc(100vh-210px)] overflow-y-auto pb-10 custom-scrollbar pr-1">
        {hasAccessToCurrentPanel ? (
          <>
            {activeTab === "users" && <ManageUsersPage />}
            {activeTab === "add" && <AddAdmin />}
            {activeTab === "logs" && <UserLogsPage role="ADMIN" />}
            {activeTab === "my_logs" && (
              <UserLogsPage
                isolatedAdminId={user?.id}
                isolatedAdminName={user?.name}
                role="ADMIN"
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200/80 max-w-xl mx-auto my-8">
            <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
              <ShieldAlert size={28} />
            </div>
            <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide mb-1">
              Workspace Access Restricted
            </h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
              You do not currently hold the authorized digital credentials or
              clear operational rights needed to view this interface panel.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
