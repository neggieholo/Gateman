"use client";

import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Search,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Ban,
  Trash2,
  Eye,
  User as UserIcon,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  deleteAdminProfileApi,
  fetchAllAdminsApi,
  toggleAdminStatusApi,
  updateAdminMfaPolicyApi,
} from "../services/apis";
import AdminProfileModal from "./AdminProfileModal";
import UserLogsPage from "./UsersLogsPage";
import AdminPermissionsModal from "./AdminPermissionsModal";
import { useUser } from "../UserContext";
import AdminPasswordOverrideModal from "./AdminPasswordOverrideModal";
import SecurityActionWarningModal from "./SecurityActionWarningModal";
import { User } from "../services/types";

export const showAccessDeniedToast = () => {
  toast.error(
    `Access Denied. You do not hold the authorized credentials required for this operation.`,
    {
      id: "unauthorized-users-page-lock",
      duration: 4000,
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
};

export default function ManageUsersPage() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProfileUser, setSelectedProfileUser] =
    useState<User | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsId, setLogsId] = useState("");
  const [logsName, setLogsName] = useState("");
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [selectedPermissionsUser, setSelectedPermissionsUser] =
    useState<User | null>(null);
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [selectedOverrideUser, setSelectedOverrideUser] =
    useState<User | null>(null);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [warningConfig, setWarningConfig] = useState<{
    title: string;
    message: string;
    confirmText: string;
    variant: "warning" | "danger";
    onConfirm: () => Promise<void> | void;
  }>({
    title: "",
    message: "",
    confirmText: "",
    variant: "warning",
    onConfirm: () => {},
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAdminsApi();
      if (data.success) {
        setUsers(data.users ?? []);
        setAdminCount(data.count ?? 0);
      } else {
        toast.error("Failed to load users.");
      }
    } catch (err) {
      toast.error("Network handshake exception.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenProfile = (user: User) => {
    setSelectedProfileUser(user);
    setIsProfileOpen(true);
  };

  const handleOpenLogs = (id: string, name: string) => {
    const canViewLogs =
      user?.permissions.includes("logs_management") ||
      user?.permissions.includes("view_user_logs") ||
      user?.permissions.includes("all-access");

    if (!canViewLogs) {
      showAccessDeniedToast();
      return;
    }
    setLogsId(id);
    setIsLogsOpen(true);
    setLogsName(name);
  };

  const handleEditPermissions = (User: User) => {
    const canManagePermissions =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_user_permissions") ||
      user?.permissions.includes("all-access");

    if (!canManagePermissions) {
      showAccessDeniedToast();
      return;
    }
    setSelectedPermissionsUser(User);
    setIsPermissionsOpen(true);
  };

  const handleResetPassword = (targetUser: User) => {
    const canOverrideCredentials =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_pass") ||
      user?.permissions.includes("all-access");

    if (!canOverrideCredentials) {
      showAccessDeniedToast();
      return;
    }

    setSelectedOverrideUser(targetUser);
    setIsOverrideOpen(true);
  };

  const handleToggleMfa = async (id: string, currentMfa: boolean) => {
    const canManageSecurity =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_mfa") ||
      user?.permissions.includes("all-access");

    if (!canManageSecurity) {
      showAccessDeniedToast();
      return;
    }


    toast.promise(
      updateAdminMfaPolicyApi(id, currentMfa),
      {
        loading: "Synchronizing remote MFA security matrix fields...",
        success: (res) => {
          if (res.success) {
            fetchAdmins();
            return currentMfa
              ? "MFA guard constraints successfully enforced on account."
              : "MFA guard protection completely stripped from account configuration.";
          }
          throw new Error(res.message);
        },
        error: (err) =>
          err.message ||
          "Failed to update security credentials mapping parameters.",
      },
      {
        style: { fontWeight: "bold", borderRadius: "10px" },
      },
    );
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    const canToggleStatus =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("modify_users_mfa") ||
      user?.permissions.includes("all-access");

    if (!canToggleStatus) {
      showAccessDeniedToast();
      return;
    }

    toast.promise(
      toggleAdminStatusApi(id, status),
      {
        loading: "Updating system status parameters...",
        success: (res) => {
          if (res.success) {
            fetchAdmins();
            return `Account access successfully updated.`;
          }
          throw new Error(res.message);
        },
        error: (err) => {
          return err.message || "Failed to update target row state status.";
        },
      },
      { style: { fontWeight: "bold", borderRadius: "10px" } },
    );
  };

  const handleDeleteUser = async (id: string) => {
    const canDeleteUser =
      user?.permissions.includes("users_management") ||
      user?.permissions.includes("delete_user") ||
      user?.permissions.includes("all-access");

    if (!canDeleteUser) {
      showAccessDeniedToast();
      return;
    }

    toast.promise(
      deleteAdminProfileApi(id),
      {
        loading: "Purging security database structures...",
        success: (res) => {
          if (res.success) {
            fetchAdmins();
            return "Administrator profile entirely stripped from core registries.";
          }
          throw new Error(res.message);
        },
        error: (err) => {
          return (
            err.message ||
            "An exception occurred handling database pruning commands."
          );
        },
      },
      { style: { fontWeight: "bold", borderRadius: "10px" } },
    );
  };

  const triggerToggleStatusWarning = (targetUser: User) => {
    const targetNewActiveState = !targetUser.is_active;
    setWarningConfig({
      title: targetUser.is_active
        ? "Suspend Account Profile"
        : "Activate Account Profile",
      message: `Are you certain you want to shift the operational status for ${targetUser.name}? ${
        targetUser.is_active
          ? "This will instantly terminate their platform workstation handshake authentication keys."
          : "This will restore their system permissions access vector loops immediately."
      }`,
      confirmText: targetUser.is_active ? "Suspend User" : "Activate User",
      variant: targetUser.is_active ? "danger" : "warning",
      onConfirm: async () => {
        await handleToggleStatus(targetUser.id, targetNewActiveState);
      },
    });
    setIsWarningOpen(true);
  };

  const triggerToggleMfaWarning = (targetUser: User) => {
    const targetNewMfaState = !targetUser.mfa_enabled;

    setWarningConfig({
      title: targetNewMfaState
        ? "Enforce Security MFA"
        : "Strip Account MFA Guard",
      message: targetNewMfaState
        ? `Are you sure you want to enforce default Multi-Factor Authentication policy guards for ${targetUser.name}?`
        : `CRITICAL ACTION ALERT: Are you completely certain you want to bypass and disable Multi-Factor Authentication protection for ${targetUser.name}? This lowers account security guidelines.`,
      confirmText: targetNewMfaState ? "Enforce MFA" : "Disable MFA Protection",
      variant: targetNewMfaState ? "warning" : "danger",
      onConfirm: async () => {
        await handleToggleMfa(targetUser.id, targetNewMfaState);
      },
    });
    setIsWarningOpen(true);
  };

  const triggerDeleteUserWarning = (targetUser: User) => {
    setWarningConfig({
      title: "Purge Admin Account Vector",
      message: `CRITICAL DATA DELETION FORCE CHALLENGE: Are you completely certain you want to permanently purge "${targetUser.name}" from the GateMan core database repository? This action is absolute and cannot be undone.`,
      confirmText: "Delete Account Profile",
      variant: "danger",
      onConfirm: async () => {
        await handleDeleteUser(targetUser.id);
      },
    });
    setIsWarningOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLogsOpen) {
    return (
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200/70 shadow-2xs space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            setIsLogsOpen(false);
          }}
          className="flex items-center gap-2 text-xs font-sans font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <UserLogsPage
          isolatedAdminId={logsId}
          isolatedAdminName={logsName}
          role="ADMIN"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 font-sans text-slate-700 min-w-0">
      {/* Structural Workspace Header Block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-white rounded-2xl border border-slate-200/70 p-5 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-montserrat font-black text-slate-800 uppercase tracking-tight leading-none">
            User Workstation Hub
          </h1>
          <p className="text-slate-400 text-xs font-medium mt-1">
            Manage admin privileges, assign core credentials, and audit security
            events.
          </p>
        </div>
      </div>

      {/* TAB CONTENT MATRICES */}
      <div
        key={loading ? "loading-state" : "loaded-state"}
        className="space-y-4 animate-in fade-in zoom-in-99 duration-150"
      >
        {/* Search Filter Strip */}
        <div className="flex flex-col gap-1.5 max-w-sm ml-2">
          <label className="text-[12px] font-oswald font-bold text-slate-400 uppercase tracking-wider block">
            Search Operators
          </label>
          <div className="relative flex items-center">
            <Search
              className="absolute left-4 text-slate-450 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search active admins by signature or endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/60 rounded-xl font-sans font-bold text-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Main Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-200">
              <thead>
                <tr className="bg-slate-50/85 border-b border-slate-150 text-[12px] font-oswald font-bold uppercase tracking-widest text-slate-500">
                  <th className="p-4 w-1/3">Identity Profile</th>
                  <th className="p-4 w-1/5">MFA Guard Status</th>
                  <th className="p-4 w-1/6">Status</th>
                  <th className="p-4 text-center w-1/4">
                    Security Core Controls
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans text-xs text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-16 text-center text-slate-400 font-bold"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-xs text-slate-450 font-medium">
                            Synchronizing registry arrays...
                          </span>
                        </div>
                      ) : (
                        "No administrative configurations found matching the search context footprint"
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Name / Email Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-montserrat font-black text-sm shadow-inner shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-slate-850 font-bold text-sm leading-tight truncate">
                              {u.name}
                            </h4>
                            <span className="text-[12px] text-slate-400 font-medium font-mono block truncate mt-0.5">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MFA Guard Column */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {u.mfa_enabled ? (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/80">
                              <ShieldCheck size={12} />
                              <span className="text-xs font-oswald font-bold uppercase tracking-wider">
                                {u.mfa_type} Active
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50/75 text-rose-500 rounded-lg border border-rose-100/80">
                              <ShieldAlert size={12} />
                              <span className="text-xs font-oswald font-bold uppercase tracking-wider">
                                Unprotected
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Account Status Column */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-oswald font-bold uppercase tracking-wider border ${
                            u.is_active
                              ? "bg-emerald-50/50 border-emerald-100 text-emerald-600"
                              : "bg-rose-50/50 border-rose-100 text-rose-600"
                          }`}
                        >
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Security Operations Controls Column */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Inspect Footprint Button */}
                          <button
                            onClick={() => handleOpenProfile(u)}
                            title="View User's Profile"
                            className="p-2 bg-slate-50 text-slate-450 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all border border-slate-200/50"
                          >
                            <UserIcon size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenLogs(u.id, u.name)}
                            title="Inspect Activity Logs"
                            className="p-2 bg-slate-50 text-slate-450 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all border border-slate-200/50"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Edit Permissions & Custom Roles Button */}
                          <button
                            onClick={() => handleEditPermissions(u)}
                            title="Modify Custom Roles & Permissions Matrix"
                            className="p-2 bg-slate-50 text-slate-450 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all border border-slate-200/50"
                          >
                            <ShieldAlert size={14} />
                          </button>

                          {/* Reset Password Button */}
                          <button
                            onClick={() => handleResetPassword(u)}
                            title="Trigger Password Reset Email Challenge"
                            className="p-2 bg-slate-50 text-slate-450 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all border border-slate-200/50"
                          >
                            <RotateCcw size={14} />
                          </button>

                          {/* Toggle MFA Protection Explicitly */}
                          <button
                            onClick={() => triggerToggleMfaWarning(u)}
                            title={
                              u.mfa_enabled
                                ? "Deactivate Security MFA Restriction Override"
                                : "Enforce Default MFA Protection Loop"
                            }
                            className={`p-2 rounded-lg transition-all border ${
                              u.mfa_enabled
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                : "bg-slate-50 text-slate-455 hover:text-emerald-600 hover:bg-emerald-50/50 border-slate-200/50"
                            }`}
                          >
                            <ShieldCheck size={14} />
                          </button>

                          {/* Suspend / Enable Toggle */}
                          <button
                            onClick={() => triggerToggleStatusWarning(u)}
                            title={
                              u.is_active
                                ? "Suspend Admin Account Interception"
                                : "Re-activate Core Account Link"
                            }
                            className={`p-2 rounded-lg transition-all border ${
                              u.is_active
                                ? "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                                : "bg-slate-50 text-slate-455 hover:text-rose-600 hover:bg-rose-50/50 border-slate-200/50"
                            }`}
                          >
                            <Ban size={14} />
                          </button>

                          {/* Delete Admin Account Matrix */}
                          <button
                            onClick={() => triggerDeleteUserWarning(u)}
                            title="Purge Core Admin Authorization Profile"
                            className="p-2 bg-slate-50 text-slate-455 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all border border-slate-200/50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminProfileModal
        user={selectedProfileUser}
        isOpen={isProfileOpen}
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedProfileUser(null);
        }}
      />
      <AdminPermissionsModal
        user={selectedPermissionsUser}
        isOpen={isPermissionsOpen}
        onClose={() => {
          setIsPermissionsOpen(false);
          setSelectedPermissionsUser(null);
        }}
        onUpdateSuccess={fetchAdmins}
      />
      <AdminPasswordOverrideModal
        user={selectedOverrideUser}
        isOpen={isOverrideOpen}
        onClose={() => {
          setIsOverrideOpen(false);
          setSelectedOverrideUser(null);
        }}
      />

      <SecurityActionWarningModal
        isOpen={isWarningOpen}
        onClose={() => setIsWarningOpen(false)}
        title={warningConfig.title}
        message={warningConfig.message}
        confirmText={warningConfig.confirmText}
        variant={warningConfig.variant}
        onConfirm={warningConfig.onConfirm}
      />
    </div>
  );
}
