/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import {
  Search,
  ArrowLeft,
  ShieldAlert,
  Users,
  ExternalLink,
} from "lucide-react";
import { db } from "../services/database";
import { Tenant } from "../services/types";
import ResidentsSuggestionsView from "./ResidentSuggestionsView";

export default function UnifiedResidentPortal() {
  const [activeTab, setActiveTab] = useState<"TENANTS" | "REPORTS">("TENANTS");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const tenantData = await db.getAllTenants();
        console.log("Tenant data:", tenantData)
        setTenants(tenantData);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTenants = tenants.filter((t) =>
    [t.name, t.block, t.unit].some((field) =>
      field?.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
  );

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await db.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setSelectedTenant(null); // go back to list after delete
    } catch (err) {
      console.error("Failed to delete tenant:", err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden p-4">
      {/* --- MASTER TAB NAVIGATION --- */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-4xl shadow-inner">
          <button
            onClick={() => {
              setActiveTab("TENANTS");
              setSelectedTenant(null);
            }}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-black transition-all ${
              activeTab === "TENANTS"
                ? "bg-white text-indigo-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Users size={18} />
            RESIDENTS ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab("REPORTS")}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-black transition-all ${
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
          <div className="relative group w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Quick find resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
            />
          </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "TENANTS" ? (
          selectedTenant ? (
            /* --- TENANT DETAIL VIEW --- */
            <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300">
              <button
                onClick={() => setSelectedTenant(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-8 font-bold"
              >
                <ArrowLeft size={20} /> Back to Directory
              </button>

              <div className="flex flex-col lg:flex-row gap-12">
                {/* Profile Sidebar */}
                <div className="w-full lg:w-1/3 flex flex-col items-center bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
                  <img
                    src={
                      selectedTenant.avatar ||
                      `https://ui-avatars.com/api/?name=${selectedTenant.name}`
                    }
                    className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white mb-6"
                    alt=""
                  />
                  <h2 className="text-3xl font-black text-slate-900 mb-1">
                    {selectedTenant.name}
                  </h2>
                  <p className="text-slate-500 font-bold mb-6 italic">
                    {selectedTenant.email}
                  </p>
                </div>

                {/* Info Grid */}
                <div className="flex-1 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Location
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        Block {selectedTenant.block} • Unit{" "}
                        {selectedTenant.unit}
                      </p>
                    </div>
                    <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Contact
                      </p>
                      <p className="text-xl font-black text-slate-800">
                        {selectedTenant.phone || "No Phone"}
                      </p>
                    </div>
                  </div>
                  <section>
                    <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 px-1">
                      Verification Documents
                    </h4>

                    <div className="space-y-10">
                      {/* Identity Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest">
                            {selectedTenant.id_type || "Government ID"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <DocPreview
                            url={selectedTenant.id_front_url}
                            label="ID Front View"
                          />
                          <DocPreview
                            url={selectedTenant.id_back_url}
                            label="ID Back View"
                          />
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Address Verification
                          </span>
                        </div>
                        <div className="max-w-md">
                          <DocPreview
                            url={selectedTenant.utility_bill_url}
                            label="Utility Bill"
                          />
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex gap-4 pt-8">
                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                      Suggestion History
                    </button>
                    <button className="flex-1 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Billing History
                    </button>
                    <button
                      className="flex-1 py-4 bg-red-500 border-2 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                      onClick={()=> {handleDelete(selectedTenant.id)}}
                    >
                      Remove Resident
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredTenants.length === 0 ? (
            <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
              {loading ? "Loading..." : "No pending join requests"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTenant(t)}
                  className="group flex flex-col items-center bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-bl-[2.5rem] group-hover:bg-indigo-50" />
                  <img
                    src={
                      t.avatar || `https://ui-avatars.com/api/?name=${t.name}`
                    }
                    className="w-24 h-24 rounded-4xl object-cover mb-4 relative z-10 border-4 border-white shadow-lg group-hover:scale-105 transition-transform"
                    alt=""
                  />
                  <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase mt-2">
                    Block {t.block || "--"} • Unit {t.unit || "--"}
                  </p>
                </button>
              ))}
            </div>
          )
        ) : (
          /* --- REPORTS COMPONENT --- */
          <div className="animate-in fade-in duration-500 h-full">
            <ResidentsSuggestionsView />
          </div>
        )}
      </div>
    </div>
  );
}

const DocPreview = ({ url, label }: { url?: string; label: string }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">
        {label}
      </span>
      {url && (
        <a
          href={url}
          target="_blank"
          className="text-blue-500 hover:text-blue-700"
        >
          <ExternalLink size={14} />
        </a>
      )}
    </div>
    {url ? (
      <img
        src={url}
        className="w-full h-40 object-cover rounded-lg border border-slate-200 bg-slate-100"
        alt={label}
      />
    ) : (
      <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center">
        <span className="text-slate-300 text-sm italic font-medium">
          Not Provided
        </span>
      </div>
    )}
  </div>
);
