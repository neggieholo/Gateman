/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  ArrowLeft,
  ShieldAlert,
  Users,
  ExternalLink,
  MapPin,
  GitMerge,
  FileText,
  Home,
  Plus,
  Send,
  X,
} from "lucide-react";
import { db } from "../services/database";
import { Tenant, LocationPair } from "../services/types";
import ResidentsSuggestionsView from "./ResidentSuggestionsView";
import { useUser } from "../UserContext";
import { useRouter, useSearchParams } from "next/navigation";
import UserLogsPage from "./UsersLogsPage";
import AddResidentForm from "./AddResidentForm";
import { showAccessDeniedToast } from "./Users";
import JoinRequestsPage from "./JoinRequestPage";
import { sendResidentNotification } from "../services/apis";
import toast from "react-hot-toast";

export default function UnifiedResidentPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "REQUESTS" | "TENANTS" | "REPORTS" | "LOGS" | "ADD"
  >("TENANTS");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [viewIndividualLogs, setViewIndividualLogs] = useState(false);
  const [openMessagePortal, setOpenMessagePortal] = useState(false);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // 🌟 Navigation Stack tracking previous sub-account profiles
  const [historyStack, setHistoryStack] = useState<Tenant[]>([]);
  const searchParams = useSearchParams();
  const authorId = searchParams.get("author_id");
  const showRequests = searchParams.get("requests") === "true";

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "co_user">("all");

  const { user, contextEstateId } = useUser();

  const canView =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("view_residents") ||
    user?.permissions?.includes("all-access");

  const canAdd =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("add_resident") ||
    user?.permissions?.includes("all-access");

  const canMangeRequests =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("manage_join_requests") ||
    user?.permissions?.includes("all-access");

  const canDelete =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("delete_resident_account") ||
    user?.permissions?.includes("all-access");

  const canViewLogs =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("view_resident_logs") ||
    user?.permissions?.includes("all-access");

  const canViewRecords =
    user?.permissions?.includes("estate_administration") ||
    user?.permissions?.includes("view_estate_records") ||
    user?.permissions?.includes("all-access");

  const canSendNotification =
    user?.permissions?.includes("notifications_management") ||
    user?.permissions?.includes("send_notifications") ||
    user?.permissions?.includes("all-access");

  useEffect(() => {
    if (showRequests) {
      if (canMangeRequests) {
        setActiveTab("REQUESTS");
      } else {
        showAccessDeniedToast();
      }
      // Safe to strip immediately since no async DB call depends on this param
      window.history.replaceState(
        { ...window.history.state },
        "",
        window.location.pathname,
      );
    }
  }, [showRequests, canMangeRequests]);

  const fetchData = useCallback(async () => {
    if (!contextEstateId) return; // Guard clause if estate ID isn't available yet

    setLoading(true);
    try {
      const tenantData = await db.getAllTenants(contextEstateId);
      setTenants(tenantData);
      console.log("Tenants:", tenantData[1]);

      if (authorId) {
        const targetTenant = tenantData.find((t) => t.id === authorId);
        if (targetTenant) {
          setActiveTab("TENANTS");
          setSelectedTenant(targetTenant);
        }

        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state }, "", newUrl);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [contextEstateId, authorId, setSelectedTenant, setActiveTab]);

  useEffect(() => {
    if (!canView) {
      showAccessDeniedToast();
      return;
    }
    fetchData();
  }, [canView, fetchData]);

  const getResidentLocationsString = (tenant: Tenant): string => {
    if (!tenant?.locations || !contextEstateId) return "No Location Bound";
    const estateLocations: LocationPair[] = tenant.locations[contextEstateId];
    if (!estateLocations || estateLocations.length === 0)
      return "No Location Bound";

    return estateLocations
      .map((loc) => {
        const unitsString = loc.unit?.join(", ") || "No Unit";
        return `Block ${loc.block || "N/A"}, Unit(s) ${unitsString}`;
      })
      .join(" | ");
  };

  const filteredTenants = tenants.filter((tenant) => {
    // 1. Filter by active estate context first
    if (contextEstateId && !tenant.estate_ids?.includes(contextEstateId)) {
      return false;
    }

    // 2. Co-User Check (Checks sub-users array OR parent account link)
    const hasSubCoUsers = (tenant.sub_users || []).some((subId) =>
      tenants.some(
        (item) =>
          item.id === subId && item.estate_ids?.includes(contextEstateId!),
      ),
    );

    const isLinkedCoUser = Boolean(
      tenant.parent_account_id &&
      tenants.some(
        (item) =>
          item.id === tenant.parent_account_id &&
          item.estate_ids?.includes(contextEstateId!),
      ),
    );

    const isCoUserAccount = hasSubCoUsers || isLinkedCoUser;

    // Apply Filter: "co_user" tab shows only accounts with linked co-users
    if (filterType === "co_user" && !isCoUserAccount) return false;

    // 3. Search Query Filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const locationString = getResidentLocationsString(tenant).toLowerCase();

      const matchesName = tenant.name?.toLowerCase().includes(searchLower);
      const matchesEmail = tenant.email?.toLowerCase().includes(searchLower);
      const matchesLocation = locationString.includes(searchLower);

      return matchesName || matchesEmail || matchesLocation;
    }

    return true;
  });

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      showAccessDeniedToast();
      return;
    }
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await db.deleteTenant(id, contextEstateId!);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setSelectedTenant(null);
      setHistoryStack([]); // Clear navigation trail upon deletion
    } catch (err) {
      console.error("Failed to delete tenant:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !msgTitle.trim() ||
      !msgBody.trim() ||
      !selectedTenant ||
      !contextEstateId
    ) {
      return;
    }

    setIsSendingMsg(true);
    try {
      const data = await sendResidentNotification(
        contextEstateId,
        selectedTenant.id,
        msgTitle.trim(),
        msgBody.trim(),
      );

      if (data.success) {
        toast.success("Notification sent successfully!");
        setMsgTitle("");
        setMsgBody("");
        setOpenMessagePortal(false);
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch (error) {
      console.error("Failed to send notification:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSendingMsg(false);
    }
  };

  // 🌟 Fixed: Secure, functional useMemo implementation with safe JSON parsing fallback
  const locations = useMemo(() => {
    if (!selectedTenant?.contract_urls || !contextEstateId) return [];

    const rawData = selectedTenant.contract_urls;
    if (typeof rawData === "string") {
      try {
        const parsed = JSON.parse(rawData);
        return parsed[contextEstateId] || [];
      } catch {
        return [];
      }
    }
    return rawData[contextEstateId] || [];
  }, [selectedTenant, contextEstateId]);

  // 🌟 Handles diving deeper into a Parent Account
  const handleNavigateToRelatedAccount = (id: string) => {
    const targetTenant = tenants.find(
      (t) => t.id === id && t.estate_ids.includes(contextEstateId!),
    );

    if (targetTenant) {
      if (selectedTenant) {
        setHistoryStack((prev) => [...prev, selectedTenant]);
      }
      setSelectedTenant(targetTenant);
    } else {
      toast.error("Account does not belong to the active estate.");
    }
  };

  // 🌟 Handles calculating the logical step backwards
  const handleGoBack = () => {
    if (historyStack.length > 0) {
      // Pop the last sub-account from the array
      const previousTenant = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, -1));
      setSelectedTenant(previousTenant);
    } else {
      setSelectedTenant(null);
      setHistoryStack([]);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 font-sans">
      {/* --- MASTER TAB NAVIGATION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-4xl shadow-inner max-w-full overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              if (activeTab !== "TENANTS") {
                setActiveTab("TENANTS");
                setHistoryStack([]);
              }
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "TENANTS"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users size={18} />
            RESIDENTS{" "}
            {/* <span className="font-oswald text-[13px] ml-0.5">
              ({tenants.length})
            </span> */}
          </button>
          <button
            onClick={() => {
              if (!canMangeRequests) {
                showAccessDeniedToast();
                return;
              }
              setActiveTab("REQUESTS");
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "REQUESTS"
                ? "bg-white text-blue-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users size={18} />
            REQUESTS
          </button>
          <button
            onClick={() => {
              if (!canViewRecords) {
                showAccessDeniedToast();
                return;
              }
              setActiveTab("REPORTS");
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "REPORTS"
                ? "bg-white text-rose-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldAlert size={18} />
            SUGGESTIONS & REPORTS
          </button>
          <button
            onClick={() => {
              if (!canViewLogs) {
                showAccessDeniedToast();
                return;
              }
              setActiveTab("LOGS");
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "LOGS"
                ? "bg-white text-purple-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <FileText size={18} />
            COLLECTIVE LOGS
          </button>
          <button
            onClick={() => {
              if (!canAdd) {
                showAccessDeniedToast();
                return;
              }
              setActiveTab("ADD");
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "ADD"
                ? "bg-white text-indigo-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Plus size={18} />
            REGISTER TENANT
          </button>
        </div>
      </div>

      {activeTab === "TENANTS" && !selectedTenant && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 w-full">
          {/* Filter Type Pills */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit shrink-0">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-xl text-xs font-montserrat font-bold transition-all ${
                filterType === "all"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Residents
            </button>
            <button
              type="button"
              onClick={() => setFilterType("co_user")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-montserrat font-bold transition-all ${
                filterType === "co_user"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              Co-Users
            </button>
          </div>

          {/* Search Box Wrapper */}
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              size={18}
            />
            <input
              type="text"
              placeholder="Quick find resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 shadow-sm"
            />
          </div>
        </div>
      )}

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
        {activeTab === "REQUESTS" && (
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <JoinRequestsPage onApprove={fetchData} />
          </div>
        )}

        {activeTab === "TENANTS" && (
          <>
            {/* 1. INDIVIDUAL LOGS VIEW (Takes highest priority if active) */}
            {selectedTenant && viewIndividualLogs && (
              <div className="bg-white p-2 sm:p-8 rounded-4xl border border-slate-100 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <button
                  onClick={() => setViewIndividualLogs(false)}
                  className="flex items-center gap-2 text-xs font-sans font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <UserLogsPage
                  isolatedAdminId={selectedTenant.id}
                  isolatedAdminName={selectedTenant.name}
                  role="TENANT"
                />
              </div>
            )}

            {/* 2. TENANT DETAIL VIEW (Shows if selected, but NOT viewing logs) */}
            {selectedTenant &&
              !viewIndividualLogs &&
              (() => {
                // Filter sub-accounts to ONLY include valid objects matching the active estate
                const availableSubAccounts = (selectedTenant?.sub_users || [])
                  .map((subId) => tenants.find((t) => t.id === subId))
                  .filter(
                    (sub): sub is Tenant =>
                      sub !== undefined &&
                      Boolean(sub?.estate_ids?.includes(contextEstateId!)),
                  );

                // Find parent account matching the active estate
                const parentAccount = tenants.find(
                  (t) =>
                    t.id === selectedTenant?.parent_account_id &&
                    t.estate_ids?.includes(contextEstateId!),
                );

                return (
                  <div className="bg-white rounded-[3rem] border border-slate-100 p-4 sm:p-8 animate-in slide-in-from-right duration-300 min-w-0">
                    {/* Adaptive Back Button */}
                    <button
                      onClick={handleGoBack}
                      className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-montserrat font-bold transition-colors"
                    >
                      <ArrowLeft size={20} /> Back
                    </button>

                    <div className="flex flex-col lg:flex-row gap-12 min-w-0">
                      {/* Profile Sidebar */}
                      <div className="w-full lg:w-1/3 flex flex-col items-center bg-slate-50 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shrink-0 min-w-0">
                        <img
                          src={
                            contextEstateId && selectedTenant.avatar
                              ? selectedTenant.avatar[contextEstateId]
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTenant.name)}`
                          }
                          className="w-full max-w-[20rem] aspect-square rounded-[2.5rem] object-cover shadow-2xl border-4 border-white mb-6 shrink-0"
                          alt=""
                        />
                        <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-1 text-center wrap-break-word w-full px-1">
                          {selectedTenant.name}
                        </h2>

                        {/* Parent Account Banner */}
                        {parentAccount && (
                          <div className="w-full mt-2 flex flex-col items-center p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-center shrink-0">
                            <span className="text-[10px] bg-amber-500 text-white font-oswald font-bold tracking-widest px-2 py-0.5 rounded-md uppercase mb-2">
                              Sub Account
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleNavigateToRelatedAccount(parentAccount.id)
                              }
                              className="flex items-center gap-1 text-xs text-amber-800 font-bold hover:text-indigo-600 transition-colors"
                            >
                              <GitMerge size={12} className="shrink-0" /> View
                              Parent Account
                            </button>
                          </div>
                        )}

                        {/* Sub-Accounts Banner (Checked via .length > 0) */}
                        {availableSubAccounts.length > 0 && (
                          <div className="w-full mt-2 flex flex-col items-center p-4 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-center shrink-0">
                            <span className="text-[10px] bg-emerald-500 text-white font-oswald font-bold tracking-widest px-2 py-0.5 rounded-md uppercase mb-2">
                              Main Account
                            </span>
                            <div className="flex flex-wrap gap-3 justify-center">
                              {availableSubAccounts.map((sub) => (
                                <button
                                  type="button"
                                  key={sub.id}
                                  onClick={() =>
                                    handleNavigateToRelatedAccount(sub.id)
                                  }
                                  className="flex items-center gap-1 text-xs text-emerald-800 font-bold hover:text-indigo-600 transition-colors"
                                >
                                  <GitMerge size={12} className="shrink-0" />{" "}
                                  View Subaccount ({sub.name})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="flex-1 space-y-8 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
                          <div className="p-6 bg-white border border-slate-100 rounded-3xl flex flex-col justify-center min-w-0">
                            <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Email
                            </p>
                            <p className="text-base sm:text-xl font-medium text-slate-800 mt-1 truncate block w-full">
                              {selectedTenant.email}
                            </p>
                          </div>
                          <div className="p-6 bg-white border border-slate-100 rounded-3xl flex flex-col justify-center min-w-0">
                            <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest mb-1">
                              Phone
                            </p>
                            <p className="text-base sm:text-xl font-oswald font-medium tracking-wide text-slate-800 mt-1 truncate block w-full">
                              {selectedTenant.phone || "No Phone"}
                            </p>
                          </div>
                        </div>

                        <div className="p-6 bg-white border border-slate-100 rounded-3xl flex flex-col justify-center min-w-0">
                          <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Assigned Locations
                          </p>
                          <div className="flex items-start gap-2 mt-1 min-w-0">
                            <MapPin
                              size={16}
                              className="text-indigo-500 shrink-0 mt-1"
                            />
                            <p className="text-base font-medium text-slate-800 leading-tight min-w-0 flex-1">
                              {getResidentLocationsString(selectedTenant)}
                            </p>
                          </div>
                        </div>

                        {/* Contracts Section */}
                        <section className="min-w-0 w-full">
                          <h4 className="text-xs font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-4 shrink-0">
                            <Home size={14} /> Assigned Locations & Contracts
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
                            {locations && locations.length > 0 ? (
                              locations.map((blockGroup: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3 min-w-0"
                                >
                                  <div className="text-sm font-oswald font-bold text-slate-900 bg-slate-200/60 px-3 py-1 rounded-lg w-fit uppercase tracking-wide">
                                    Block: {blockGroup.block}
                                  </div>
                                  <div className="space-y-2 min-w-0">
                                    {blockGroup.units?.map(
                                      (unitItem: any, uIdx: number) => (
                                        <div
                                          key={uIdx}
                                          className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-lg shadow-sm min-w-0 gap-2"
                                        >
                                          <span className="text-sm font-medium text-slate-700 truncate">
                                            Unit {unitItem.unit}
                                          </span>
                                          {unitItem.contract_url ? (
                                            <a
                                              href={unitItem.contract_url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg font-montserrat font-bold transition-all shrink-0"
                                            >
                                              <FileText size={14} /> View
                                              Contract{" "}
                                              <ExternalLink size={12} />
                                            </a>
                                          ) : (
                                            <span className="text-xs text-amber-500 italic font-medium shrink-0">
                                              No Contract Doc
                                            </span>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-1 md:col-span-2 p-4 border border-dashed border-slate-200 rounded-xl text-center text-sm text-slate-400 italic bg-slate-50/50">
                                No active contract assets found for this estate
                                context.
                              </div>
                            )}
                          </div>
                        </section>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-8 shrink-0">
                          <button
                            type="button"
                            className="py-3.5 px-4 bg-slate-800 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-slate-900 transition-all active:scale-95 shadow-sm text-center"
                            onClick={() => setViewIndividualLogs(true)}
                          >
                            View Logs
                          </button>
                          <button
                            type="button"
                            className="py-3.5 px-4 bg-emerald-600 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 shadow-sm text-center"
                            onClick={() => {
                              if (!canViewRecords) {
                                showAccessDeniedToast();
                                return;
                              }
                              router.push(
                                `/home/payments?resident_=${selectedTenant.name}`,
                              );
                            }}
                          >
                            Payment History
                          </button>
                          <button
                            type="button"
                            className="py-3.5 px-4 bg-indigo-600 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-indigo-700 transition-all active:scale-95 shadow-sm text-center"
                            onClick={() => {
                              if (!canSendNotification) {
                                showAccessDeniedToast();
                                return;
                              }
                              setOpenMessagePortal(true);
                            }}
                          >
                            Notify
                          </button>
                          <button
                            type="button"
                            className="py-3.5 px-4 bg-rose-600 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-rose-700 transition-all active:scale-95 shadow-sm text-center"
                            onClick={() => handleDelete(selectedTenant.id)}
                          >
                            Remove Resident
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* 3. EMPTY STATE (Shows if directory is empty and no selection active) */}
            {!selectedTenant && filteredTenants.length === 0 && (
              <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center font-medium">
                {loading ? "Loading..." : "No residents found"}
              </p>
            )}

            {/* 4. RESIDENT DIRECTORY GRID CARDS LAYOUT (Shows if no selection active) */}
            {!selectedTenant && filteredTenants.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-hidden pb-16 p-3">
                {filteredTenants.map((t) => {
                  const availableSubAccounts = (t?.sub_users || [])
                    .map((subId) =>
                      tenants.find((tenant) => tenant.id === subId),
                    )
                    .filter(
                      (sub): sub is Tenant =>
                        sub !== undefined &&
                        sub.estate_ids.includes(contextEstateId!),
                    );

                  // Find parent account matching active estate
                  const parentAccount = tenants.find(
                    (tenant) =>
                      tenant.id === t.parent_account_id &&
                      tenant.estate_ids.includes(contextEstateId!),
                  );

                  // Check length for sub-accounts, or existence of parent account
                  const hasCoUser =
                    availableSubAccounts.length > 0 || Boolean(parentAccount);

                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTenant(t);
                        setHistoryStack([]);
                      }}
                      className="group flex items-center gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all relative overflow-hidden text-left min-w-0 w-full"
                    >
                      {/* Avatar Container */}
                      <div className="relative shrink-0">
                        <img
                          src={
                            contextEstateId && t.avatar
                              ? t.avatar[contextEstateId]
                              : `https://ui-avatars.com/api/?name=${t.name}`
                          }
                          className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                          alt=""
                        />
                        {hasCoUser && (
                          <span className="absolute -top-1 -left-1 bg-amber-500 text-[8px] font-oswald font-bold tracking-widest text-white px-1.5 py-0.5 rounded-md uppercase shadow-sm">
                            Co-user
                          </span>
                        )}
                      </div>

                      {/* Details Section */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-montserrat font-black text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {t.name}
                        </h3>
                        <span className="inline-flex items-center text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {getResidentLocationsString(t)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "REPORTS" && (
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <ResidentsSuggestionsView />
          </div>
        )}

        {activeTab === "LOGS" && (
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <UserLogsPage role="TENANT" />
          </div>
        )}

        {activeTab === "ADD" && (
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <AddResidentForm
              onSubmitSuccess={() => {
                setActiveTab("TENANTS");
                fetchData();
              }}
            />
          </div>
        )}
      </div>
      {openMessagePortal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col gap-6 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-montserrat font-black text-slate-900">
                  Notify Resident
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Sending to:{" "}
                  <span className="text-indigo-600 font-bold">
                    {selectedTenant.name}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenMessagePortal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Message Form */}
            <form onSubmit={handleSendMessage} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-oswald font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Notice Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Utility Maintenance Notice"
                  value={msgTitle}
                  onChange={(e) => setMsgTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-oswald font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Message Body
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type your message here..."
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenMessagePortal(false)}
                  className="px-5 py-3 text-xs font-montserrat font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingMsg}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-montserrat font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md disabled:opacity-50"
                >
                  {isSendingMsg ? (
                    "Sending..."
                  ) : (
                    <>
                      <Send size={14} /> Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
