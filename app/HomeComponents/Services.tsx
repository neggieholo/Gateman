// "use client";

// import React, { useState, useEffect } from "react";
// import { Plus, Wrench, Phone, Mail, CheckCircle2, Truck, AlertTriangle, X, Loader2, Trash2, Edit, User, UserPlus } from "lucide-react";
// import { EstateService, ServiceRequest, EstateComplaint } from "./types";

// interface VendorInput {
//   name: string;
//   phone: string;
//   email: string;
// }

// export default function ServicesManagementPage() {
//   const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
//   const [activeTab, setActiveTab] = useState<"catalog" | "requests" | "complaints">("catalog");
//   const [loading, setLoading] = useState(true);

//   // Core Arrays
//   const [services, setServices] = useState<EstateService[]>([]);
//   const [requests, setRequests] = useState<ServiceRequest[]>([]);
//   const [complaints, setComplaints] = useState<EstateComplaint[]>([]);

//   // Modal State Control Blocks
//   const [showServiceModal, setShowServiceModal] = useState(false);
//   const [editingService, setEditingService] = useState<EstateService | null>(null);
//   const [serviceName, setServiceName] = useState("");
  
//   // Dynamic Vendor Array State Handler
//   const [vendorList, setVendorList] = useState<VendorInput[]>([{ name: "", phone: "", email: "" }]);
//   const [submitting, setSubmitting] = useState(false);

//   useEffect(() => {
//     fetchData();
//   }, [activeTab]);

//   const fetchData = async () => {
//     setLoading(true);
//     try {
//       if (activeTab === "catalog") {
//         const res = await fetch(`${baseUrl}/api/admin/services`, { credentials: "include" });
//         const data = await res.json();
//         if (data.success) setServices(data.services);
//       } else if (activeTab === "requests") {
//         const res = await fetch(`${baseUrl}/api/admin/services/requests`, { credentials: "include" });
//         const data = await res.json();
//         if (data.success) setRequests(data.requests);
//       } else {
//         const res = await fetch(`${baseUrl}/api/admin/services/complaints`, { credentials: "include" });
//         const data = await res.json();
//         if (data.success) setComplaints(data.complaints);
//       }
//     } catch (err) {
//       console.error("Error fetching services module state:", err);
//     } finaly {
//       setLoading(false);
//     }
//   };

//   // Append new empty row constructor fields
//   const addVendorFields = () => {
//     setVendorList([...vendorList, { name: "", phone: "", email: "" }]);
//   };

//   // Splice target fields index cleanly out of roster matrix mapping state
//   const removeVendorFields = (index: number) => {
//     if (vendorList.length === 1) return; // Keep at least one form block active
//     setVendorList(vendorList.filter((_, idx) => idx !== index));
//   };

//   // Process manual inline mutation bindings across array strings
//   const handleVendorChange = (index: number, field: keyof VendorInput, value: string) => {
//     const updated = [...vendorList];
//     updated[index][field] = value;
//     setVendorList(updated);
//   };

//   const handleSaveService = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitting(true);
//     const url = editingService ? `${baseUrl}/api/admin/services/${editingService.id}` : `${baseUrl}/api/admin/services`;
//     const method = editingService ? "PUT" : "POST";

//     const payload = {
//       service_name: serviceName,
//       vendors: vendorList.filter(v => v.name.trim() !== "" && v.phone.trim() !== "") // Clean out dead blanks
//     };

//     try {
//       const res = await fetch(url, {
//         method,
//         credentials: "include",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });
//       if (res.ok) {
//         setShowServiceModal(false);
//         setEditingService(null);
//         setServiceName("");
//         setVendorList([{ name: "", phone: "", email: "" }]);
//         fetchData();
//       }
//     } catch (err) {
//       alert("Error parsing network commit profiles.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDeleteService = async (id: string) => {
//     if (!confirm("Are you sure you want to remove this service category?")) return;
//     try {
//       const res = await fetch(`${baseUrl}/api/admin/services/${id}`, { method: "DELETE", credentials: "include" });
//       if (res.ok) fetchData();
//     } catch (err) {
//       alert("Failed cleaning data mapping.");
//     }
//   };

//   return (
//     <div className="p-6 max-w-7xl mx-auto space-y-8">
//       {/* Page Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h2 className="text-3xl font-black text-slate-900 tracking-tight">Services & Utility Directory</h2>
//           <p className="text-sm text-slate-500 font-medium">Manage estate service rosters, providers, and work orders.</p>
//         </div>
//         {activeTab === "catalog" && (
//           <button
//             onClick={() => { 
//               setEditingService(null); 
//               setServiceName(""); 
//               setVendorList([{ name: "", phone: "", email: "" }]); 
//               setShowServiceModal(true); 
//             }}
//             className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all"
//           >
//             <Plus size={16} /> Add Service Category
//           </button>
//         )}
//       </div>

//       {/* Tabs Menu Panel Control */}
//       <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-fit">
//         {["catalog", "requests", "complaints"].map((tab) => (
//           <button
//             key={tab}
//             onClick={() => setActiveTab(tab as any)}
//             className={`px-5 py-2 rounded-lg font-bold text-sm uppercase tracking-tight transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
//           >
//             {tab === "catalog" ? "Services Catalog" : tab === "requests" ? "Resident Requests" : "Complaints Ledger"}
//           </button>
//         ))}
//       </div>

//       {/* Views Rendering Core */}
//       {loading ? (
//         <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={36} /></div>
//       ) : (
//         <>
//           {/* CATALOG TAB (WITH INNER NESTED VENDORS MAPPINGS) */}
//           {activeTab === "catalog" && (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {services.length === 0 ? (
//                 <div className="col-span-full text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 italic text-sm bg-white">No service entries found. Click add option above.</div>
//               ) : (
//                 services.map((svc) => {
//                   const vendorArray: VendorInput[] = Array.isArray(svc.vendors) ? svc.vendors : [];
//                   return (
//                     <div key={svc.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
//                       <div className="space-y-4">
//                         <div className="flex justify-between items-start">
//                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100"><Wrench size={22} /></div>
//                           <div className="flex gap-1">
//                             <button 
//                               onClick={() => { 
//                                 setEditingService(svc); 
//                                 setServiceName(svc.service_name); 
//                                 setVendorList(vendorArray.length > 0 ? vendorArray : [{ name: "", phone: "", email: "" }]); 
//                                 setShowServiceModal(true); 
//                               }} 
//                               className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
//                             >
//                               <Edit size={16} />
//                             </button>
//                             <button onClick={() => handleDeleteService(svc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
//                           </div>
//                         </div>

//                         <div>
//                           <h4 className="text-xl font-black text-slate-800 tracking-tight">{svc.service_name}</h4>
//                           <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black tracking-widest uppercase px-2 py-0.5 rounded-md mt-1 inline-block">
//                             {vendorArray.length} Providers Listed
//                           </span>
//                         </div>

//                         {/* Renders all dynamic nested vendors allocated into this catalog node */}
//                         <div className="space-y-3 pt-4 border-t border-slate-100">
//                           {vendorArray.map((vendor, vIdx) => (
//                             <div key={vIdx} className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 text-sm space-y-1">
//                               <div className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1">
//                                 <User size={12} className="text-slate-400" /> {vendor.name}
//                               </div>
//                               <div className="text-xs text-slate-600 flex items-center gap-2"><Phone size={11} className="text-slate-400" /> {vendor.phone}</div>
//                               {vendor.email && <div className="text-xs text-slate-600 flex items-center gap-2"><Mail size={11} className="text-slate-400" /> {vendor.email}</div>}
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </div>
//                   );
//                 })
//               )}
//             </div>
//           )}

//           {/* ... keeping your existing Resident Requests and Complaints layouts active here ... */}
//         </>
//       )}

//       {/* --- ADD/EDIT COMPREHENSIVE MODAL FOR MULTIPLE VENDORS --- */}
//       {showServiceModal && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-xl shadow-2xl max-h-[85vh] flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">
//             <div className="flex justify-between items-center border-b border-slate-100 pb-3 shrink-0">
//               <h3 className="text-lg font-black text-slate-900">{editingService ? "Modify Category Group" : "Register New Service & Roster"}</h3>
//               <button onClick={() => setShowServiceModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
//             </div>

//             <form onSubmit={handleSaveService} className="flex-1 overflow-y-auto py-4 space-y-6 pr-1 custom-scrollbar">
//               <div>
//                 <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Service Category Name</label>
//                 <input required type="text" className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none text-slate-800 font-bold mt-1" placeholder="e.g. Plumbing, Pest Control, Inverter Repair" value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
//               </div>

//               {/* Dynamic Vendor Array Mapping Block Container */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <label className="text-xs font-black text-indigo-600 uppercase tracking-widest">Assigned Contractors/Vendors Directory</label>
//                   <button type="button" onClick={addVendorFields} className="flex items-center gap-1 text-xs text-indigo-600 font-black bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-all">
//                     <UserPlus size={14} /> Add Vendor Row
//                   </button>
//                 </div>

//                 <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
//                   {vendorList.map((vendor, idx) => (
//                     <div key={idx} className="relative p-4 border border-slate-200 bg-slate-50/50 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
//                       {vendorList.length > 1 && (
//                         <button type="button" onClick={() => removeVendorFields(idx)} className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors z-10 shadow-sm"><X size={12} /></button>
//                       )}
//                       <div>
//                         <input required type="text" className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium" placeholder="Vendor Name" value={vendor.name} onChange={(e) => handleVendorChange(idx, "name", e.target.value)} />
//                       </div>
//                       <div>
//                         <input required type="tel" className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium" placeholder="Phone Number" value={vendor.phone} onChange={(e) => handleVendorChange(idx, "phone", e.target.value)} />
//                       </div>
//                       <div>
//                         <input type="email" className="w-full border border-slate-200 rounded-lg p-2.5 text-xs bg-white text-slate-800 font-medium" placeholder="Email (Optional)" value={vendor.email} onChange={(e) => handleVendorChange(idx, "email", e.target.value)} />
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </form>

//             <div className="flex gap-3 pt-3 border-t border-slate-100 shrink-0">
//               <button type="button" onClick={() => setShowServiceModal(false)} className="flex-1 py-2.5 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors text-sm">Cancel</button>
//               <button type="button" onClick={handleSaveService} disabled={submitting} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-opacity text-sm shadow flex items-center justify-center">
//                 {submitting ? <Loader2 className="animate-spin" size={18} /> : "Save Roster Catalog"}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }