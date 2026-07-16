/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Shield,
  Layers,
  CheckSquare,
  Square,
  Loader2,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  PermissionNode,
  CustomRoleMapping,
  User,
} from "../services/types";
import {
  fetchSystemPermissionsApi,
  fetchCustomRolesApi,
  updateAdminPermissionsApi,
} from "../services/apis";
import { useUser } from "../UserContext";
import { ESTATE_PERMISSIONS } from "../services/data";

interface AdminPermissionsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: () => void;
}

export default function AdminPermissionsModal({
  user,
  isOpen,
  onClose,
  onUpdateSuccess,
}: AdminPermissionsModalProps) {
  const { user: currentUser } = useUser();
  const myPermissions = currentUser?.permissions || [];
  const iHaveAllAccess = myPermissions.includes("all-access");

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Schema matrices repositories
  const [systemPermissions, setSystemPermissions] = useState<PermissionNode[]>(
    [],
  );
  const [savedRoles, setSavedRoles] = useState<CustomRoleMapping[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // 📡 Sync & Hydrate structural schemas on open
  useEffect(() => {
    if (!isOpen || !user) return;

    const hydrateModalLayout = async () => {
      setLoading(true);
      try {
        const [permData, roleData] = await Promise.all([
          fetchSystemPermissionsApi(),
          fetchCustomRolesApi(),
        ]);

        if (permData.success) setSystemPermissions(permData.permissions);
        if (roleData.success) setSavedRoles(roleData.roles);

        // 🎯 Pre-populate all currently ticked access permissions for this individual user
        setSelectedPermissions(user.permissions || []);
      } catch (err) {
        toast.error(
          "Failed to sync permissions mapping matrix schema definitions.",
        );
      } finally {
        setLoading(false);
      }
    };

    hydrateModalLayout();
  }, [isOpen, user]);

  // Hierarchical structural evaluation loops
  const parentPermissions = useMemo(() => {
    return systemPermissions.filter((p) => p.parent_permission === null);
  }, [systemPermissions]);

  const handleTogglePermission = (id: string, isParent: boolean) => {
    if ((id === "all-access" || id === "all_access") && !iHaveAllAccess) {
      toast.error(
        `Access Denied. You require "All Access" permission to grant this.`,
      );
      return;
    }

    let updated = [...selectedPermissions];

    if (isParent) {
      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
      } else {
        const childrenIds = systemPermissions
          .filter((p) => p.parent_permission === id)
          .map((p) => p.id);
        updated = updated.filter((item) => !childrenIds.includes(item));
        updated.push(id);
      }
    } else {
      const targetNode = systemPermissions.find((p) => p.id === id);
      const parentId = targetNode?.parent_permission;

      if (updated.includes(id)) {
        updated = updated.filter((item) => item !== id);
      } else if (parentId && updated.includes(parentId)) {
        const siblingIds = systemPermissions
          .filter((p) => p.parent_permission === parentId && p.id !== id)
          .map((p) => p.id);
        updated = updated.filter((item) => !parentId.includes(item)); // clean typecast safety
        updated = updated.filter((item) => item !== parentId);
        updated = Array.from(new Set([...updated, ...siblingIds]));
      } else {
        updated.push(id);
      }
    }
    setSelectedPermissions(updated);
  };

  const handleApplyPresetRole = (rolePermissions: string[]) => {
    const containsAllAccess = rolePermissions.some(
      (p) => p === "all-access" || p === "all_access",
    );
    if (containsAllAccess && !iHaveAllAccess) {
      toast.error(
        'Access Denied. Preset contains "All Access" which your configuration lacks.',
      );
      return;
    }
    setSelectedPermissions(rolePermissions);
    toast.success("Role preset layout mapped.");
  };

  const handleSavePermissions = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const res = await updateAdminPermissionsApi(user.id, selectedPermissions);
      if (res.success) {
        toast.success(
          `Security authorization matrix reconfigured for ${user.name}`,
        );
        onUpdateSuccess();
        onClose();
      } else {
        toast.error(
          res.message || "Failed to finalize structural privilege updates.",
        );
      }
    } catch (err) {
      toast.error("Internal transaction handshake intercept timeout error.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gm-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl border border-slate-200/70 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Block */}
        <div className="p-5 bg-gm-navy text-white flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gm-navy rounded-xl text-white">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-xs font-montserrat font-black uppercase tracking-wider text-slate-200">
                Modify Administrative Privileges
              </h3>
              <p className="text-[10px] text-slate-400 font-medium font-sans">
                Isolating operational token maps for Admin signature:{" "}
                <span className="text-slate-200 font-bold font-mono">
                  {user.name} ({user.email})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-750 text-red-600 hover:text-white transition-all outline-none"
          >
            <X size={14} />
          </button>
        </div>

        {/* Workspace Middle Body Grid */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0 custom-scrollbar">
          {loading ? (
            <div className="col-span-1 lg:col-span-3 flex flex-col items-center justify-center h-full gap-2.5 text-slate-450 font-oswald font-bold text-xs uppercase tracking-wider">
              <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
              Synchronizing privilege mapping schemas...
            </div>
          ) : (
            <>
              {/* Left Column - Core Access Panels */}
              <div className="lg:col-span-2 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                {parentPermissions.map((parent) => {
                  const subPermissions = systemPermissions.filter(
                    (p) => p.parent_permission === parent.id,
                  );
                  const isParentChecked = selectedPermissions.includes(
                    parent.id,
                  );

                  return (
                    <div
                      key={parent.id}
                      className="border border-slate-200/70 rounded-xl overflow-hidden bg-white"
                    >
                      {/* Sub-Header Container */}
                      <div className="bg-slate-50/50 px-4 py-3 flex items-center justify-between border-b border-slate-200/70">
                        <span className="text-[10px] font-montserrat font-black uppercase text-slate-800 tracking-wide">
                          {parent.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleTogglePermission(parent.id, true)
                          }
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-oswald font-bold uppercase tracking-wider transition-all border active:scale-98 ${
                            isParentChecked
                              ? "bg-gm-navy text-white border-gm-nvbg-gm-navy hover:bg-slate-800"
                              : "bg-white text-slate-450 border-slate-200/70 hover:text-slate-700 hover:bg-slate-50/50"
                          }`}
                        >
                          {isParentChecked ? "Revoke Group" : "Authorize Group"}
                        </button>
                      </div>

                      {/* Privilege Grid */}
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subPermissions.map((child) => {
                          const isChildChecked =
                            selectedPermissions.includes(child.id) ||
                            isParentChecked;
                          return (
                            <div
                              key={child.id}
                              onClick={() =>
                                handleTogglePermission(child.id, false)
                              }
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                isChildChecked
                                  ? "bg-slate-900/5 border-slate-900 text-slate-900"
                                  : "bg-white border-slate-200/50 text-slate-600 hover:bg-slate-50/50"
                              }`}
                            >
                              {isChildChecked ? (
                                <CheckSquare
                                  size={13}
                                  className="text-slate-900 shrink-0"
                                />
                              ) : (
                                <Square
                                  size={13}
                                  className="text-slate-300 shrink-0"
                                />
                              )}
                              <span className="text-[11px] font-bold leading-tight select-none">
                                {child.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Side Column - Preset Blueprints */}
              <div className="space-y-4 overflow-y-auto bg-slate-50/50 p-4 rounded-xl border border-slate-200/70 custom-scrollbar">
                <div className="flex items-center gap-2 text-slate-900 border-b border-slate-200/70 pb-2.5">
                  <Layers size={13} className="text-slate-450" />
                  <h4 className="text-[10px] font-oswald font-bold uppercase tracking-wider text-slate-500">
                    Custom Roles
                  </h4>
                </div>

                <div className="space-y-3">
                  {savedRoles.map((role) => (
                    <div
                      key={role.id}
                      className="p-3 bg-white border border-slate-200/70 rounded-xl flex flex-col gap-2 hover:border-slate-300 transition-all shadow-3xs"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[11px] font-bold text-slate-800">
                          {role.role_name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPresetRole(role.permission_ids)
                          }
                          className="px-2 py-0.5 bg-slate-50 hover:bg-slate-900 hover:text-white text-[9px] font-oswald font-bold uppercase tracking-wider rounded-lg border border-slate-200/70 transition-all shrink-0 active:scale-95"
                        >
                          Apply
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                        {role.permission_ids?.map((pId) => {
                          const matchedPermission = ESTATE_PERMISSIONS.find(
                            (p) => p.id === pId,
                          );
                          return (
                            <span
                              key={pId}
                              className="px-1.5 py-0.5 bg-slate-50 border border-slate-100 font-mono text-[10px] rounded text-slate-600 whitespace-nowrap"
                            >
                              {matchedPermission?.name || pId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200/70 flex justify-end gap-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-5 py-3 bg-white border border-slate-200 text-slate-500 font-oswald font-bold uppercase tracking-wider text-[10px] rounded-xl hover:bg-slate-50 transition-all active:scale-98 shadow-3xs"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSaving || loading}
            onClick={handleSavePermissions}
            className="px-6 py-3 bg-gm-navy hover:bg-slate-850 text-white font-oswald font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-3xs flex items-center gap-2 disabled:opacity-50 active:scale-98"
          >
            {isSaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Save size={13} />
            )}
            Commit Permission Changes
          </button>
        </div>
      </div>
    </div>
  );
}
