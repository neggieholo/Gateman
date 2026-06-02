/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Calendar,
  User,
  Shield,
  Info,
  ArrowLeft,
  Eye,
  CheckCircle,
  X,
} from "lucide-react";
import { getEstateReports, updateReportStatus } from "../services/apis";
import { EstateReport, ReportStatus } from "../services/types";
import { securityDb } from "../services/database";
import { SecurityUser } from "../services/types";

export default function SecurityReportsView() {
  const [reports, setReports] = useState<EstateReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EstateReport | null>(
    null,
  );
  const [tabLabel, settabLabel] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<
    "ALL" | "COMPLAINT" | "INFORMATION"
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReportStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [associatedGuards, setAssociatedGuards] = useState<SecurityUser[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState<{
    id: string;
    status: "REVIEWED" | "RESOLVED";
  } | null>(null);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await getEstateReports();

        if (res.success) {
          const securityOnly = res.reports.filter(
            (report: EstateReport) => report.type === "SECURITY",
          );
          setReports(securityOnly);
        }
      } catch (error) {
        console.error("Failed to fetch security reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const fetchGuardDetails = async (ids: string[]) => {
    const res = await securityDb.getAllSecurity();
    if (res) {
      const filtered = res.filter((g: SecurityUser) => ids.includes(g.id));
      setAssociatedGuards(filtered);
    }
  };

  const handleViewDetails = (report: EstateReport) => {
    setSelectedReport(report);
    if (report.type === "SECURITY" && report.target_security_ids?.length > 0) {
      fetchGuardDetails(report.target_security_ids);
    } else {
      setAssociatedGuards([]);
    }
  };

  const typeFilterSet = (filter: "ALL" | "PERSONNEL" | "GENERAL") => {
    switch (filter) {
      case "ALL":
        setTypeFilter("ALL");
        settabLabel("ALL");
        break;
      case "PERSONNEL":
        setTypeFilter("COMPLAINT");
        settabLabel("PERSONNEL");
        break;
      case "GENERAL":
        setTypeFilter("INFORMATION");
        settabLabel("GENERAL");
        break;
      default:
        setTypeFilter("ALL");
        settabLabel("ALL");
    }
  };

  const triggerStatusUpdate = (id: string, status: "REVIEWED" | "RESOLVED") => {
    setShowFeedbackModal({ id, status });
    setAdminFeedback("");
  };

  const confirmStatusUpdate = async () => {
    if (!showFeedbackModal) return;

    setLoadingAction(true);
    try {
      const res = await updateReportStatus(
        showFeedbackModal.id,
        showFeedbackModal.status,
        adminFeedback,
      );

      if (res.success) {
        setReports(
          reports.map((r) =>
            r.id === showFeedbackModal.id
              ? {
                  ...r,
                  status: showFeedbackModal.status,
                  admin_response: adminFeedback,
                }
              : r,
          ),
        );
        setSelectedReport((prev) =>
          prev
            ? {
                ...prev,
                status: showFeedbackModal.status,
                admin_response: adminFeedback,
              }
            : null,
        );
        setShowFeedbackModal(null);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoadingAction(false);
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      (typeFilter === "ALL" || r.category === typeFilter) &&
      (statusFilter === "ALL" || r.status === statusFilter),
  );

  if (selectedReport) {
    const isReviewed = selectedReport.status === "REVIEWED";
    const isResolved = selectedReport.status === "RESOLVED";
    return (
      <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 p-5 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-24 md:pb-20 font-sans">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors mb-6 font-montserrat font-bold text-xs uppercase tracking-wider self-start"
        >
          <ArrowLeft size={16} /> Back to List
        </button>

        <div className="flex flex-col xl:flex-row justify-between gap-6 border-b border-slate-50 pb-6 sm:pb-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-lg text-[10px] font-oswald font-bold uppercase tracking-widest border ${
                    selectedReport.category === "COMPLAINT"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-blue-50 text-blue-600 border-blue-100"
                  }`}
                >
                  {selectedReport.category === "COMPLAINT"
                    ? "PERSONNEL"
                    : "GENERAL"}{" "}
                  REPORT
                </span>
                <span className="text-slate-400 font-oswald font-bold text-xs flex items-center gap-1 uppercase tracking-wide">
                  <Calendar size={13} className="text-slate-300" />{" "}
                  {new Date(selectedReport.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  disabled={isReviewed || isResolved}
                  onClick={() =>
                    triggerStatusUpdate(selectedReport.id, "REVIEWED")
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${isReviewed || isResolved ? "bg-slate-50 text-slate-300" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                  <Eye size={14} />{" "}
                  {isReviewed || isResolved ? "Reviewed" : "Review"}
                </button>

                <button
                  disabled={isResolved}
                  onClick={() =>
                    triggerStatusUpdate(selectedReport.id, "RESOLVED")
                  }
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all shadow-2xs ${isResolved ? "bg-emerald-50 text-emerald-300 shadow-none" : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-101 active:scale-98"}`}
                >
                  <CheckCircle size={14} />{" "}
                  {isResolved ? "Resolved" : "Resolve"}
                </button>
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-montserrat font-black text-slate-900 tracking-tight mb-4 break-words">
              {selectedReport.subject}
            </h2>
            <div className="inline-flex items-center gap-2 text-slate-500 font-sans font-semibold text-xs bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
              <User size={14} className="text-slate-400" /> Reporter:{" "}
              <span className="text-slate-700 font-bold">
                {selectedReport.reporter_name || "Resident"}
              </span>
            </div>
          </div>
        </div>

        <h4 className="text-slate-400 text-[10px] uppercase tracking-widest font-oswald font-bold mt-6 mb-3">
          Report Description
        </h4>
        <div className="py-2 flex-1 flex flex-col gap-4 overflow-y-auto pb-10 custom-scrollbar">
          <p className="text-slate-600 leading-relaxed text-sm sm:text-base font-medium whitespace-pre-wrap break-words bg-slate-50/30 p-4 sm:p-5 border border-slate-100/50 rounded-2xl">
            {selectedReport.description}
          </p>

          {selectedReport.category === "COMPLAINT" && (
            <div className="mt-2 pt-6 border-t border-slate-100">
              <h4 className="text-slate-400 text-[10px] uppercase tracking-widest font-oswald font-bold mb-4">
                Mentioned Personnel
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {associatedGuards.length > 0 ? (
                  associatedGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="flex items-center gap-4 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs group/card"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-50 border border-slate-100 cursor-pointer relative">
                        <img
                          src={guard.avatar}
                          onClick={() =>
                            guard.avatar && setSelectedImage(guard.avatar)
                          }
                          alt=""
                          className="w-full h-full object-cover transition-transform group-hover/card:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-montserrat font-black text-slate-800 text-sm truncate">
                          {guard.name}
                        </p>
                        <p className="text-xs text-slate-400 font-sans font-semibold mt-0.5 truncate">
                          {guard.phone}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs font-medium italic p-2">
                    No linked operational personnel entries connected.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {selectedImage && (
          <div
            className="fixed inset-0 z-100 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full flex flex-col items-center">
              <button
                className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all"
                onClick={() => setSelectedImage(null)}
              >
                <X size={28} />
              </button>
              <img
                src={selectedImage}
                className="max-h-[75vh] w-auto rounded-2xl shadow-2xl border-2 border-white/10 object-contain"
                alt="Guard Attachment Preview"
              />
            </div>
          </div>
        )}

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-200 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}
                >
                  {showFeedbackModal.status === "RESOLVED" ? (
                    <CheckCircle size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-montserrat font-black text-slate-900 tracking-tight">
                    Mark as {showFeedbackModal.status.toLowerCase()}?
                  </h3>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">
                    Provide optional notification log feedback data for
                    residents.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm h-36 focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none text-slate-800 font-medium placeholder:text-slate-400 transition-all shadow-2xs resize-none"
                placeholder="e.g. Action completed. Issue review processed by administrative team channels."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeedbackModal(null)}
                  className="flex-1 py-3.5 text-slate-400 font-montserrat font-bold hover:bg-slate-50 rounded-xl transition-colors text-xs uppercase tracking-wider border border-transparent hover:border-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={loadingAction}
                  className={`flex-1 py-3.5 text-white rounded-xl font-montserrat font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-sm ${
                    loadingAction
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:scale-102 active:scale-97"
                  } ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {loadingAction ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 sm:p-3 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-24 md:pb-20 font-sans">
      {/* Filter Toolbar Subsystem */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100/80 shadow-2xs">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-100">
          {["ALL", "PERSONNEL", "GENERAL"].map((f) => (
            <button
              key={f}
              onClick={() => typeFilterSet(f as any)}
              className={`px-5 py-2 rounded-lg text-xs font-montserrat font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                tabLabel === f
                  ? "bg-white text-slate-900 shadow-2xs border border-slate-200/40"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar border border-slate-100">
          {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-[10px] font-oswald font-bold tracking-widest whitespace-nowrap transition-all ${statusFilter === s ? "bg-white text-slate-900 shadow-2xs border border-slate-200/40" : "text-slate-400 hover:text-slate-500"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Dynamic List Track */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-10 custom-scrollbar">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => handleViewDetails(report)}
              className="group flex items-center justify-between p-4 sm:p-5 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-xs transition-all text-left min-w-0 gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`p-3 rounded-xl shrink-0 ${report.type === "SECURITY" ? "bg-rose-50 text-rose-500 border border-rose-100/40" : "bg-blue-50 text-blue-500 border border-blue-100/40"}`}
                >
                  {report.type === "SECURITY" ? (
                    <Shield size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-montserrat font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate tracking-tight pr-2">
                    {report.subject}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 md:hidden">
                    <span className="text-[10px] font-sans font-bold text-slate-700 truncate max-w-[100px]">
                      {report.reporter_name}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-[10px] font-oswald font-bold text-slate-400 tracking-wide">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden md:block min-w-[100px]">
                  <p className="text-xs font-montserrat font-bold text-slate-800 truncate">
                    {report.reporter_name}
                  </p>
                  <p className="text-[10px] font-oswald font-bold text-slate-400 mt-0.5 tracking-wider">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white border border-slate-100 group-hover:border-blue-600 transition-all shadow-3xs">
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-10 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="text-slate-400 font-sans font-medium text-sm">
              {loading
                ? "Syncing operational platform channels..."
                : "No administrative security reports recorded."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
