/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Shield, Loader2, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { PermissionNode, User } from "../services/types";
import { fetchSystemPermissionsApi } from "../services/apis";

interface AdminPermissionsViewModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPermissionsViewModal({
  user,
  isOpen,
  onClose,
}: AdminPermissionsViewModalProps) {
  const [loading, setLoading] = useState(false);
  const [systemPermissions, setSystemPermissions] = useState<PermissionNode[]>(
    [],
  );

  // 🎯 Hydrate system permissions schema to map IDs to friendly display names
  useEffect(() => {
    if (!isOpen || !user) return;

    const hydratePermissions = async () => {
      setLoading(true);
      try {
        const permData = await fetchSystemPermissionsApi();
        if (permData.success) {
          setSystemPermissions(permData.permissions);
        }
      } catch (err) {
        toast.error("Failed to load permission details.");
      } finally {
        setLoading(false);
      }
    };

    hydratePermissions();
  }, [isOpen, user]);

  // Map user's permission IDs to their actual names
  const activePermissions = useMemo(() => {
    if (!user?.permissions) return [];

    // If the user has "all-access", they inherently have everything
    const hasAllAccess =
      user.permissions.includes("all-access") ||
      user.permissions.includes("all_access");

    if (hasAllAccess) {
      return [{ id: "all-access", name: "All Access (Complete Control)" }];
    }

    return systemPermissions
      .filter((perm) => user.permissions.includes(perm.id))
      .map((perm) => ({
        id: perm.id,
        name: perm.name,
      }));
  }, [user, systemPermissions]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gm-navy/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Card */}
      <div className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200/70 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header Block */}
        <div className="p-5 bg-gm-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gm-navy rounded-xl text-white">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="text-xs font-montserrat font-black uppercase tracking-wider text-slate-200">
                Assigned System Permissions
              </h3>
              <p className="text-[10px] text-slate-400 font-medium font-sans">
                Active capabilities for:{" "}
                <span className="text-slate-200 font-bold font-mono">
                  {user.name} ({user.email})
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-750 text-red-600 transition-all outline-none"
          >
            <X size={14} />
          </button>
        </div>

        {/* Permissions Grid Workspace */}
        <div className="p-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-450 font-oswald font-bold text-xs uppercase tracking-wider">
              <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
              Mapping privilege parameters...
            </div>
          ) : activePermissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {activePermissions.map((perm) => {
                const isAllAccess = perm.id === "all-access";
                return (
                  <div
                    key={perm.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
                      isAllAccess
                        ? "bg-red-50 border-red-200 text-red-700"
                        : "bg-slate-50 border-slate-150 text-slate-700"
                    }`}
                  >
                    <KeyRound
                      size={14}
                      className={
                        isAllAccess ? "text-red-500" : "text-slate-400"
                      }
                    />
                    <span className="truncate" title={perm.name}>
                      {perm.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-xs font-medium">
                No active administrative permissions assigned to this account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
