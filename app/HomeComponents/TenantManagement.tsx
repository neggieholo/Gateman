/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { db } from "../services/database";
import { Tenant, LocationPair } from "../services/types";
import ResidentsSuggestionsView from "./ResidentSuggestionsView";
import { useUser } from "../UserContext";
import { useSearchParams } from "next/navigation";

export default function UnifiedResidentPortal() {
  const [activeTab, setActiveTab] = useState<"TENANTS" | "REPORTS">("TENANTS");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // 🌟 Navigation Stack tracking previous sub-account profiles
  const [historyStack, setHistoryStack] = useState<Tenant[]>([]);
  const searchParams = useSearchParams();
  const authorId = searchParams.get("author_id");

  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tenantData = await db.getAllTenants();
        setTenants(tenantData);
        if (authorId) {
          const targetTenant = tenantData.find((t) => t.id === authorId);
          if (targetTenant) {
            setSelectedTenant(targetTenant);
            setActiveTab("TENANTS");
          }

          const newUrl = window.location.pathname;
          window.history.replaceState({ ...window.history.state }, "", newUrl);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getResidentLocationsString = (tenant: Tenant): string => {
    if (!tenant?.locations || !user?.estate_id) return "No Location Bound";
    const estateLocations: LocationPair[] = tenant.locations[user.estate_id];
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
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await db.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setSelectedTenant(null);
      setHistoryStack([]); // Clear navigation trail upon deletion
    } catch (err) {
      console.error("Failed to delete tenant:", err);
    }
  };

  // 🌟 Fixed: Secure, functional useMemo implementation with safe JSON parsing fallback
  const locations = useMemo(() => {
    if (!selectedTenant?.contract_urls || !user?.estate_id) return [];

    const rawData = selectedTenant.contract_urls;
    if (typeof rawData === "string") {
      try {
        const parsed = JSON.parse(rawData);
        return parsed[user.estate_id] || [];
      } catch {
        return [];
      }
    }
    return rawData[user.estate_id] || [];
  }, [selectedTenant, user?.estate_id]);

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
      // Nothing remains in history trace; safe to exit back to directory view
      setSelectedTenant(null);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden p-4 font-sans">
      {/* --- MASTER TAB NAVIGATION --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-2">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-4xl shadow-inner max-w-full overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              setActiveTab("TENANTS");
              setSelectedTenant(null);
              setHistoryStack([]); // Clear history on explicit root tab switch
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "TENANTS"
                ? "bg-white text-indigo-600 shadow-md"
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
            onClick={() => setActiveTab("REPORTS")}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-montserrat font-black transition-all whitespace-nowrap ${
              activeTab === "REPORTS"
                ? "bg-white text-rose-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldAlert size={18} />
            SUGGESTIONS & REPORTS
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
        {activeTab === "TENANTS" ? (
          selectedTenant ? (
            /* --- TENANT DETAIL VIEW --- */
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
                      selectedTenant.avatar ||
                      `https://ui-avatars.com/api/?name=${selectedTenant.name}`
                    }
                    className="w-full max-w-[20rem] aspect-square rounded-[2.5rem] object-cover shadow-2xl border-4 border-white mb-6 shrink-0"
                    alt=""
                  />
                  <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-1 text-center break-words w-full px-1">
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
                        <GitMerge size={12} className="shrink-0" /> View Parent
                        Account
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

                  <div className="flex gap-4 pt-8 shrink-0">
                    <button
                      className="flex-1 py-4 bg-red-500 border-2 border-transparent text-white rounded-2xl font-montserrat font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all active:scale-98 shadow-sm"
                      onClick={() => handleDelete(selectedTenant.id)}
                    >
                      Remove Resident
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center font-medium">
              {loading ? "Loading..." : "No pending join requests"}
            </p>
          ) : (
            /* --- RESIDENT DIRECTORY GRID CARDS LAYOUT --- */
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-w-0">
              {filteredTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTenant(t);
                    setHistoryStack([]); // Clear history stack when opening profile directly from grid
                  }}
                  className="group flex flex-col items-center bg-white p-4 sm:p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden text-center min-w-0"
                >
                  <div className="absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 bg-slate-50 rounded-bl-[2.5rem] group-hover:bg-indigo-50 transition-colors" />

                  {t.parent_account_id && (
                    <div className="absolute top-3 left-3 bg-amber-500 text-[8px] font-oswald font-bold tracking-widest text-white px-2 py-0.5 rounded-md uppercase z-20 shadow-sm">
                      Sub
                    </div>
                  )}

                  <img
                    src={
                      t.avatar || `https://ui-avatars.com/api/?name=${t.name}`
                    }
                    className="w-16 h-16 sm:w-24 sm:h-24 rounded-4xl object-cover mb-4 relative z-10 border-4 border-white shadow-lg group-hover:scale-105 transition-transform shrink-0"
                    alt=""
                  />
                  <h3 className="font-montserrat font-black text-sm sm:text-base text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 w-full px-1 break-all">
                    {t.name}
                  </h3>
                </button>
              ))}
            </div>
          )
        ) : (
          /* --- REPORTS COMPONENT --- */
          <div className="animate-in fade-in duration-500 h-full min-w-0">
            <ResidentsSuggestionsView />
          </div>
        )}
      </div>
    </div>
  );
}
