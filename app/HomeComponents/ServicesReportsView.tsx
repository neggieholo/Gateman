/* eslint-disable @typescript-eslint/no-explicit-any */

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
  Receipt,
  Gavel,
} from "lucide-react";
import { getEstateReports, updateReportStatus } from "../services/apis";
import { EstateReport, ReportStatus } from "../services/types";

export default function ServicesReportsView() {
  const [reports, setReports] = useState<EstateReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EstateReport | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReportStatus>("ALL");
  const [loading, setLoading] = useState(true);
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
          // Filter strictly for SECURITY type before updating state
          const securityOnly = res.reports.filter(
            (report: EstateReport) => report.type === "SERVICES",
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

  const handleViewDetails = (report: EstateReport) => {
    setSelectedReport(report);
  };

  // 1. Just opens the modal and sets the context
  const triggerStatusUpdate = (id: string, status: "REVIEWED" | "RESOLVED") => {
    setShowFeedbackModal({ id, status });
    setAdminFeedback(""); // Reset feedback
  };

  // 2. Final confirmation that calls the API
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
    (r) => statusFilter === "ALL" || r.status === statusFilter,
  );

  if (selectedReport) {
    const isReviewed = selectedReport.status === "REVIEWED";
    const isResolved = selectedReport.status === "RESOLVED";
    return (
      <div className="bg-white rounded-4xl sm:rounded-[3rem] border border-slate-100 p-5 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-20 font-sans">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-montserrat font-bold"
        >
          <ArrowLeft size={20} /> Back to List
        </button>

        <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-50 pb-6 sm:pb-8 overflow-y-auto sm:overflow-visible">
          <div className="flex-1 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-montserrat font-black uppercase tracking-widest bg-blue-100 text-blue-600">
                  COMPLAINT
                </span>
                <span className="text-slate-400 font-sans font-medium text-sm flex items-center gap-1">
                  <Calendar size={14} />{" "}
                  {new Date(selectedReport.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                <button
                  disabled={isReviewed || isResolved}
                  onClick={() =>
                    triggerStatusUpdate(selectedReport.id, "REVIEWED")
                  }
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-montserrat font-bold text-xs sm:text-sm transition-all ${isReviewed || isResolved ? "bg-slate-50 text-slate-300" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                  <Eye size={16} />{" "}
                  {isReviewed || isResolved ? "Reviewed" : "Mark as Reviewed"}
                </button>

                <button
                  disabled={isResolved}
                  onClick={() =>
                    triggerStatusUpdate(selectedReport.id, "RESOLVED")
                  }
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-montserrat font-bold text-xs sm:text-sm transition-all ${isResolved ? "bg-emerald-50 text-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  <CheckCircle size={16} />{" "}
                  {isResolved ? "Resolved" : "Mark as Resolved"}
                </button>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 leading-tight">
              {selectedReport.subject}
            </h2>
            <div className="flex items-center gap-2 text-slate-600 font-sans font-bold bg-slate-50 self-start px-4 py-2 rounded-xl text-sm">
              <User size={18} /> Reporter:{" "}
              {selectedReport.reporter_name || "Resident"}
            </div>
          </div>
        </div>

        <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-oswald font-black mt-6 mb-4">
          Report Description
        </h4>
        <div className="py-4 sm:py-8 flex-1 flex flex-col gap-4 overflow-y-auto pb-10">
          <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-sans font-medium whitespace-pre-wrap">
            {selectedReport.description}
          </p>
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-200 font-sans">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className={`p-3 rounded-2xl ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                >
                  {showFeedbackModal.status === "RESOLVED" ? (
                    <CheckCircle size={24} />
                  ) : (
                    <Eye size={24} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-montserrat font-black text-slate-900">
                    Mark as {showFeedbackModal.status.toLowerCase()}?
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-sans font-medium">
                    Add an optional message for the resident.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm h-40 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-sans font-medium placeholder:text-slate-400"
                placeholder="e.g. This issue has been noted and addressed by the head of security."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowFeedbackModal(null)}
                  className="flex-1 py-3.5 text-slate-500 font-montserrat font-bold hover:bg-slate-50 rounded-2xl transition-colors text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={loadingAction}
                  className={`flex-1 py-3.5 text-white rounded-2xl font-montserrat font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg ${
                    loadingAction
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-[1.02] active:scale-95"
                  } ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-600 shadow-emerald-200" : "bg-amber-600 shadow-amber-200"}`}
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
    <div className="space-y-6 p-2 sm:p-3 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-20 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-0">
        <div className="flex gap-4 items-center sm:p-3 sm:border sm:border-slate-50">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <Gavel size={24} />
          </div>
          <h1 className="text-lg sm:text-xl font-montserrat font-black text-slate-900 uppercase tracking-tight">
            Complaints
          </h1>
        </div>
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-fit sm:pr-2 sm:mr-3">
          {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`flex-1 sm:flex-none text-center px-3 sm:px-4 py-2 sm:py-1.5 rounded-xl text-[10px] font-oswald font-bold tracking-widest transition-all ${statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-10">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => handleViewDetails(report)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-white border border-slate-100 rounded-2xl sm:rounded-4xl hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all text-left gap-4"
            >
              <div className="flex items-center gap-4 sm:gap-6">
                <div
                  className={`p-3 sm:p-4 rounded-2xl shrink-0 ${report.type === "SECURITY" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                >
                  {report.type === "SECURITY" ? (
                    <Shield size={24} />
                  ) : (
                    <Info size={24} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-montserrat font-bold text-sm sm:text-base text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 sm:line-clamp-1">
                      {report.subject}
                    </h3>
                  </div>
                  {/* Inline metadata visualization row optimized for mobile viewports */}
                  <div className="sm:hidden text-[11px] text-slate-400 font-sans space-x-2">
                    <span className="font-bold text-slate-700">
                      {report.reporter_name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                <div className="text-left sm:text-right hidden sm:block shrink-0">
                  <p className="text-xs font-montserrat font-bold text-slate-900">
                    {report.reporter_name}
                  </p>
                  <p className="text-[10px] font-oswald font-medium text-slate-400">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all ml-auto sm:ml-0">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center font-sans text-sm">
            {loading ? "Loading..." : "No reports"}
          </p>
        )}
      </div>
    </div>
  );
}
