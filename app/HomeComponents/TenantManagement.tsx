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

export default function UnifiedResidentPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "REQUESTS" | "TENANTS" | "REPORTS" | "LOGS" | "ADD"
  >("TENANTS");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [viewIndividualLogs, setViewIndividualLogs] = useState(false);

  // 🌟 Navigation Stack tracking previous sub-account profiles
  const [historyStack, setHistoryStack] = useState<Tenant[]>([]);
  const searchParams = useSearchParams();
  const authorId = searchParams.get("author_id");
  const showRequests = searchParams.get("requests") === "true";

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
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

  const canEditStatus =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("modify_resident_status") ||
    user?.permissions?.includes("all-access");

  const canViewLogs =
    user?.permissions?.includes("residents_management") ||
    user?.permissions?.includes("view_resident_logs") ||
    user?.permissions?.includes("all-access");

  // const canViewPosts =
  //   user?.permissions?.includes("community_management") ||
  //   user?.permissions?.includes("view_community_posts") ||
  //   user?.permissions?.includes("all-access");

  const canViewReports =
    user?.permissions?.includes("estate_administration") ||
    user?.permissions?.includes("view_estate_reports") ||
    user?.permissions?.includes("all-access");

  // const canViewRecords =
  //   user?.permissions?.includes("estate_administration") ||
  //   user?.permissions?.includes("view_estate_records") ||
  //   user?.permissions?.includes("all-access");

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

  const filteredTenants = tenants.filter((t) => {
    const searchLower = searchQuery.toLowerCase();
    const locationString = getResidentLocationsString(t).toLowerCase();

    return (
      t.name?.toLowerCase().includes(searchLower) ||
      t.email?.toLowerCase().includes(searchLower) ||
      locationString.includes(searchLower)
    );
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
  const handleNavigateToParent = (parentId: string) => {
    const parentTenant = tenants.find((t) => t.id === parentId);
    if (parentTenant) {
      if (selectedTenant) {
        // Save sub-account into trace state before jumping profiles
        setHistoryStack((prev) => [...prev, selectedTenant]);
      }
      setSelectedTenant(parentTenant);
    } else {
      alert(
        "Parent account record data entry could not be found in active rosters.",
      );
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
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden p-4 font-sans">
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
            <span className="font-oswald text-[13px] ml-0.5">
              ({tenants.length})
            </span>
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
              if (!canViewReports) {
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

        {activeTab === "TENANTS" && !selectedTenant && (
          <div className="relative group w-full sm:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Quick find resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all text-slate-700"
            />
          </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-w-0">
        {activeTab === "REQUESTS" && (
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <JoinRequestsPage />
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
            {selectedTenant && !viewIndividualLogs && (
              <div className="bg-white rounded-[3rem] border border-slate-100 p-4 sm:p-8 animate-in slide-in-from-right duration-300 min-w-0">
                {/* 🌟 Adaptive Back Button Execution Element */}
                <button
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-montserrat font-bold transition-colors"
                >
                  <ArrowLeft size={20} />{" "}
                  {historyStack.length > 0
                    ? "Back to Sub-Account"
                    : "Back to Directory"}
                </button>

                <div className="flex flex-col lg:flex-row gap-12 min-w-0">
                  {/* Profile Sidebar */}
                  <div className="w-full lg:w-1/3 flex flex-col items-center bg-slate-50 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 shrink-0 min-w-0">
                    <img
                      src={
                        contextEstateId && selectedTenant.avatar
                          ? selectedTenant.avatar[contextEstateId]
                          : `https://ui-avatars.com/api/?name=${selectedTenant.name}`
                      }
                      className="w-full max-w-[20rem] aspect-square rounded-[2.5rem] object-cover shadow-2xl border-4 border-white mb-6 shrink-0"
                      alt=""
                    />
                    <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-1 text-center wrap-break-word w-full px-1">
                      {selectedTenant.name}
                    </h2>

                    {/* Dynamic Sub-Account Flag & Parent Redirection Engine Link */}
                    {selectedTenant.parent_account_id && (
                      <div className="w-full mt-2 flex flex-col items-center p-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl text-center shrink-0">
                        <span className="text-[10px] bg-amber-500 text-white font-oswald font-bold tracking-widest px-2 py-0.5 rounded-md uppercase mb-2">
                          Sub-Account
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleNavigateToParent(
                              selectedTenant.parent_account_id,
                            )
                          }
                          className="flex items-center gap-1 text-xs text-amber-800 font-bold hover:text-indigo-600 transition-colors"
                        >
                          <GitMerge size={12} className="shrink-0" /> View
                          Parent Account
                        </button>
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

                    <section className="min-w-0 w-full">
                      <h4 className="text-slate-400 text-[10px] font-oswald font-bold uppercase tracking-widest mb-6 px-1">
                        Rent Contracts
                      </h4>

                      <div className="space-y-3 min-w-0">
                        <h4 className="text-xs font-montserrat font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
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
                                            <FileText size={14} /> View Contract{" "}
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
                      </div>
                    </section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-8 shrink-0">
                      {/* 1. View Logs */}
                      <button
                        type="button"
                        className="py-3.5 px-4 bg-gm-navy/60 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-gm-navy/80 transition-all active:scale-95 shadow-sm text-center"
                        onClick={() => setViewIndividualLogs(true)}
                      >
                        View Logs
                      </button>

                      {/* 2. Payment History */}
                      <button
                        type="button"
                        className="py-3.5 px-4 bg-emerald-600 text-white rounded-2xl font-montserrat font-black text-[11px] uppercase tracking-wider hover:bg-emerald-700 transition-all active:scale-95 shadow-sm text-center"
                        onClick={() => {
                          router.push(
                            `/home/payments?resident_=${selectedTenant.name}`,
                          );
                        }}
                      >
                        Payment History
                      </button>

                      {/* 5. Remove Resident */}
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
            )}

            {/* 3. EMPTY STATE (Shows if directory is empty and no selection active) */}
            {!selectedTenant && filteredTenants.length === 0 && (
              <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center font-medium">
                {loading ? "Loading..." : "No residents found"}
              </p>
            )}

            {/* 4. RESIDENT DIRECTORY GRID CARDS LAYOUT (Shows if no selection active) */}
            {!selectedTenant && filteredTenants.length > 0 && (
              <div className="flex flex-col gap-3 min-w-0">
                {filteredTenants.map((t) => (
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
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                        alt=""
                      />
                      {t.parent_account_id && (
                        <span className="absolute -top-1 -left-1 bg-amber-500 text-[8px] font-oswald font-bold tracking-widest text-white px-1.5 py-0.5 rounded-md uppercase shadow-sm">
                          Sub
                        </span>
                      )}
                    </div>

                    {/* Details Section */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-montserrat font-black text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {t.name}
                      </h3>
                    </div>
                  </button>
                ))}
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
    </div>
  );
}
