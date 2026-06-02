/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Wrench,
  Phone,
  Mail,
  CheckCircle2,
  Truck,
  AlertTriangle,
  X,
  Loader2,
  Trash2,
  Edit,
  User,
  UserPlus,
  Search,
} from "lucide-react";
import { EstateReport, EstateService, ServiceRequest } from "../services/types";
import { getEstateReports } from "../services/apis";
import ServicesReportsView from "./ServicesReportsView";

interface VendorInput {
  name: string;
  phone: string;
  email: string;
}

export default function ServicesManagementPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const [activeTab, setActiveTab] = useState<
    "catalog" | "requests" | "complaints"
  >("catalog");
  const [loading, setLoading] = useState(true);

  // Core Arrays
  const [services, setServices] = useState<EstateService[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State Control Blocks
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<EstateService | null>(
    null,
  );
  const [serviceName, setServiceName] = useState("");

  // Dynamic Vendor Array State Handler
  const [vendorList, setVendorList] = useState<VendorInput[]>([
    { name: "", phone: "", email: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  // --- New Vendor Assignment Dispatch Modal States ---
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  // --- New Vendor View Modal States ---
  const [viewVendorsModalOpen, setViewVendorsModalOpen] = useState(false);
  const [activeVendorsList, setActiveVendorsList] = useState<VendorInput[]>([]);
  const [activeServiceNameForView, setActiveServiceNameForView] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "catalog") {
        const res = await fetch(`${baseUrl}/api/services`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setServices(data.services);
      } else if (activeTab === "requests") {
        const res = await fetch(`${baseUrl}/api/services/requests`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) setRequests(data.requests);
      }
    } catch (err) {
      console.error("Error fetching services module state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const addVendorFields = () => {
    setVendorList([...vendorList, { name: "", phone: "", email: "" }]);
  };

  const removeVendorFields = (index: number) => {
    if (vendorList.length === 1) return;
    setVendorList(vendorList.filter((_, idx) => idx !== index));
  };

  const handleVendorChange = (
    index: number,
    field: keyof VendorInput,
    value: string,
  ) => {
    const updated = [...vendorList];
    updated[index][field] = value;
    setVendorList(updated);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const url = editingService
      ? `${baseUrl}/api/services/${editingService.id}`
      : `${baseUrl}/api/services`;
    const method = editingService ? "PUT" : "POST";

    const payload = {
      service_name: serviceName,
      vendors: vendorList.filter(
        (v) =>
          v.name.trim() !== "" &&
          v.phone.trim() !== "" &&
          v.email.trim() !== "",
      ),
    };

    console.log("Service edit Payload:", payload);

    try {
      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowServiceModal(false);
        setEditingService(null);
        setServiceName("");
        setVendorList([{ name: "", phone: "", email: "" }]);
        fetchData();
      }
    } catch (err) {
      alert("Error parsing network commit profiles.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to remove this service category?"))
      return;
    try {
      const res = await fetch(`${baseUrl}/api/services/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Failed cleaning data mapping.");
    }
  };

  const handleOpenDispatchModal = (req: any) => {
    setActiveRequest(req);
    // Pre-populate checkboxes if vendors are already assigned
    setSelectedVendorIds(req.dispatched_vendors || []);
    setDispatchModalOpen(true);
  };

  const toggleVendorSelection = (vendorId: string) => {
    setSelectedVendorIds((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId],
    );
  };

  const handleCommitDispatch = async () => {
    if (!activeRequest) return;
    if (selectedVendorIds.length === 0) {
      alert("Please select at least one vendor to dispatch.");
      return;
    }

    try {
      const res = await fetch(
        `${baseUrl}/api/services/requests/${activeRequest.id}/status`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_dispatched: true,
            dispatched_vendors: selectedVendorIds,
          }),
        },
      );
      if (res.ok) {
        setDispatchModalOpen(false);
        setActiveRequest(null);
        fetchData(); // reload datasets
      }
    } catch (err) {
      console.error("Failed to commit dispatch roster:", err);
    }
  };

  return (
    <div className="p-6 mx-auto space-y-8">
      {/* <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            Services & Utility Directory
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Manage estate service rosters, providers, and work orders.
          </p>
        </div>
      </div> */}

      {/* Tabs Menu Panel Control */}
      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
        {["catalog", "requests", "complaints"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-5 py-2 rounded-lg font-bold text-sm uppercase tracking-tight transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            {tab === "catalog"
              ? "Services"
              : tab === "requests"
                ? "Requests"
                : "Complaints"}
          </button>
        ))}
      </div>

      {/* Views Rendering Core */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <Loader2 className="animate-spin text-indigo-600" size={36} />
        </div>
      ) : (
        <>
          {/* CATALOG TAB (WITH INNER NESTED VENDORS MAPPINGS) */}
          {activeTab === "catalog" && (
            <>
              <div className="flex justify-between gap-5">
                <div className="relative group w-[80%]">
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search by service or vendor info..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                  />
                </div>
                <button
                  onClick={() => {
                    setEditingService(null);
                    setServiceName("");
                    setVendorList([{ name: "", phone: "", email: "" }]);
                    setShowServiceModal(true);
                  }}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
                >
                  <Plus size={16} /> Add Service Category
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.length === 0 ? (
                  <div className="col-span-full text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 italic text-sm bg-white">
                    No service entries found. Click add option above.
                  </div>
                ) : (
                  services.map((svc) => {
                    const vendorArray: VendorInput[] = Array.isArray(
                      svc.vendors,
                    )
                      ? svc.vendors
                      : [];
                    return (
                      <div
                        key={svc.id}
                        className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                              <Wrench size={22} />
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingService(svc);
                                  setServiceName(svc.service_name);
                                  setVendorList(
                                    vendorArray.length > 0
                                      ? vendorArray
                                      : [{ name: "", phone: "", email: "" }],
                                  );
                                  setShowServiceModal(true);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteService(svc.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-xl font-black text-slate-800 tracking-tight">
                              {svc.service_name}
                            </h4>
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black tracking-widest uppercase px-2 py-0.5 rounded-md mt-1 inline-block">
                              {vendorArray.length} Provider
                              {vendorArray.length > 1 ? "s" : ""} Added
                            </span>
                          </div>

                          {/* Renders all dynamic nested vendors allocated into this catalog node */}
                          <div className="pt-4 border-t border-slate-100 mt-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveVendorsList(vendorArray);
                                setActiveServiceNameForView(svc.service_name);
                                setViewVendorsModalOpen(true);
                              }}
                              disabled={vendorArray.length === 0}
                              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${
                                vendorArray.length > 0
                                  ? "bg-slate-50 border-slate-200 text-indigo-600 hover:bg-indigo-50/50 hover:border-indigo-200"
                                  : "bg-slate-50/50 border-slate-100 text-slate-400 cursor-not-allowed italic"
                              }`}
                            >
                              <User size={14} />
                              {vendorArray.length === 0
                                ? "No Vendors Attached"
                                : `${vendorArray.length} ${vendorArray.length === 1 ? "Vendor" : "Vendors"} Attached`}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === "requests" && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 italic text-sm bg-white">
                  No maintenance work requests found.
                </div>
              ) : (
                requests.map((req: any) => (
                  <div
                    key={req.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-slate-100 font-black text-slate-700 text-xs px-2.5 py-1 rounded-md">
                          Unit: {req.resident_unit}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {req.resident_name}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          • {new Date(req.requested_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-indigo-600">
                        {req.service_name || "General Service Maintenance"}
                      </h4>
                      <p className="text-sm text-slate-600 font-medium">
                        {req.description ||
                          "No specific brief detailed by user."}
                      </p>
                      <div className="flex gap-2 items-center">
                        <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md w-fit">
                          Preferred Slot: {req.time_preferred}
                        </div>
                        {/* Dynamic Status Readout Badge from Resident Actions */}
                        {req.is_dispatched && (
                          <div
                            className={`text-xs font-black uppercase tracking-tight px-2.5 py-1 rounded-md ${
                              req.is_completed
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {req.is_completed ? "Completed" : "Not Completed"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <button
                        onClick={() => handleOpenDispatchModal(req)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black border transition-all ${
                          req.is_dispatched
                            ? "bg-amber-50 border-amber-200 text-amber-700"
                            : "bg-indigo-600 border-transparent text-white hover:bg-indigo-700"
                        }`}
                      >
                        <Truck size={14} />{" "}
                        {req.is_dispatched
                          ? "Dispatched"
                          : "Mark as Dispatched"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* EXISTING COMPLAINTS TAB LINKAGE */}
          {activeTab === "complaints" && <ServicesReportsView />}
        </>
      )}

      {/* --- ADD/EDIT COMPREHENSIVE MODAL FOR MULTIPLE VENDORS --- */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-lg font-black text-slate-900">
                {editingService
                  ? "Modify Category Group"
                  : "Register New Service & Roster"}
              </h3>
              <button
                onClick={() => setShowServiceModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleSaveService}
              className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar"
            >
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Service Category Name
                </label>
                <input
                  required
                  type="text"
                  className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 font-bold mt-1"
                  placeholder="e.g. Plumbing, Pest Control, Inverter Repair"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              {/* Dynamic Vendor Array Mapping Block Container */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                    Assigned Contractors/Vendors Directory
                  </label>
                  <button
                    type="button"
                    onClick={addVendorFields}
                    className="flex items-center gap-1 text-xs text-indigo-600 font-black bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all"
                  >
                    <UserPlus size={14} /> Add Vendor Row
                  </button>
                </div>

                <div className="space-y-4 max-h-[40vh] overflow-y-auto p-3">
                  {vendorList.map((vendor, idx) => (
                    <div
                      key={idx}
                      className="relative p-4 border border-slate-200 bg-slate-50/50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150"
                    >
                      {vendorList.length > 0 && (
                        <button
                          type="button"
                          onClick={() => removeVendorFields(idx)}
                          className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors z-10 shadow-sm"
                        >
                          <X size={12} />
                        </button>
                      )}
                      <div>
                        <input
                          required
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium"
                          placeholder="Vendor Name"
                          value={vendor.name}
                          onChange={(e) =>
                            handleVendorChange(idx, "name", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <input
                          required
                          type="tel"
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium"
                          placeholder="Phone Number"
                          value={vendor.phone}
                          onChange={(e) =>
                            handleVendorChange(idx, "phone", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium"
                          placeholder="Email (Optional)"
                          value={vendor.email}
                          onChange={(e) =>
                            handleVendorChange(idx, "email", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowServiceModal(false);
                  setSubmitting(false);
                }}
                className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveService}
                disabled={submitting}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-opacity text-sm shadow flex items-center justify-center"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LIVE CONTRACTORS MULTI-SELECTION DISPATCH MODAL --- */}
      {dispatchModalOpen && activeRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Dispatch Contractors
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Select vendors for: {activeRequest.service_name}
                </p>
              </div>
              <button
                onClick={() => setDispatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[45vh] overflow-y-auto p-1">
              {activeRequest.available_vendors?.length > 0 ? (
                activeRequest.available_vendors.map((vendor: any) => {
                  const isChecked = selectedVendorIds.includes(vendor.id);
                  return (
                    <div
                      key={vendor.id}
                      onClick={() => toggleVendorSelection(vendor.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                        isChecked
                          ? "border-indigo-600 bg-indigo-50/40"
                          : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="text-sm font-black text-slate-800 uppercase">
                          {vendor.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                          {vendor.phone}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by structural row click handler container
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 font-medium italic">
                  No vendors registered under this service category path yet.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitDispatch}
                className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 text-sm shadow"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW STATIC CONTRACTORS VISUALIZATION MODAL --- */}
      {viewVendorsModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  Assigned Vendors
                </h3>
                <p className="text-xs text-indigo-600 font-bold tracking-tight">
                  Directory for: {activeServiceNameForView}
                </p>
              </div>
              <button
                onClick={() => setViewVendorsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar">
              {activeVendorsList.map((vendor, vIdx) => (
                <div
                  key={vIdx}
                  className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5"
                >
                  <div className="font-black text-slate-800 uppercase text-xs flex items-center gap-1.5">
                    <User size={13} className="text-indigo-500" /> {vendor.name}
                  </div>
                  <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                    <Phone size={12} className="text-slate-400" />{" "}
                    {vendor.phone}
                  </div>
                  {vendor.email && (
                    <div className="text-xs text-slate-600 flex items-center gap-2 font-medium">
                      <Mail size={12} className="text-slate-400" />{" "}
                      {vendor.email}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setViewVendorsModalOpen(false)}
                className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-sm hover:bg-slate-800 transition-colors shadow-sm"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
