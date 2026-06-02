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
  Receipt,
} from "lucide-react";
import { getEstateReports, updateReportStatus } from "../services/apis";
import { EstateReport, ReportStatus } from "../services/types";

export default function PaymentDisputesPage() {
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
            (report: EstateReport) => report.type === "PAYMENT",
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
      <div className="bg-white rounded-3xl sm:rounded-[3rem] border border-slate-100 p-4 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-20 font-sans">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-oswald font-bold text-xs uppercase tracking-wider text-left"
        >
          <ArrowLeft size={16} /> Back to List
        </button>

        <div className="flex flex-col gap-6 border-b border-slate-50 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-oswald font-bold uppercase tracking-wider bg-blue-100 text-blue-600">
                REPORT
              </span>
              <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                <Calendar size={14} />{" "}
                {new Date(selectedReport.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                disabled={isReviewed || isResolved}
                onClick={() =>
                  triggerStatusUpdate(selectedReport.id, "REVIEWED")
                }
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wide transition-all ${isReviewed || isResolved ? "bg-slate-50 text-slate-300" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
              >
                <Eye size={16} />{" "}
                {isReviewed || isResolved ? "Reviewed" : "Mark Reviewed"}
              </button>

              <button
                disabled={isResolved}
                onClick={() =>
                  triggerStatusUpdate(selectedReport.id, "RESOLVED")
                }
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-montserrat font-bold text-xs uppercase tracking-wide transition-all ${isResolved ? "bg-emerald-50 text-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"}`}
              >
                <CheckCircle size={16} />{" "}
                {isResolved ? "Resolved" : "Mark Resolved"}
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-4 tracking-tight">
              {selectedReport.subject}
            </h2>
            <div className="inline-flex items-center gap-2 text-slate-600 font-bold bg-slate-50 px-4 py-2 rounded-xl text-sm">
              <User size={16} /> Reporter:{" "}
              {selectedReport.reporter_name || "Resident"}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-slate-400 text-[11px] uppercase tracking-wider font-oswald font-bold">
            Report Description
          </h4>
        </div>

        <div className="py-4 flex-1 overflow-y-auto pb-10">
          <p className="text-slate-700 leading-relaxed text-base sm:text-lg font-medium whitespace-pre-wrap max-w-3xl">
            {selectedReport.description}
          </p>
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 text-left">
              <div className="flex items-start gap-3 mb-6">
                <div
                  className={`p-3 rounded-2xl shrink-0 ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
                >
                  {showFeedbackModal.status === "RESOLVED" ? (
                    <CheckCircle size={22} />
                  ) : (
                    <Eye size={22} />
                  )}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-montserrat font-black text-slate-900">
                    Mark as {showFeedbackModal.status.toLowerCase()}?
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm font-medium mt-0.5">
                    Add an optional message for the resident.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm h-36 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium placeholder:text-slate-400"
                placeholder="e.g. This issue has been noted and addressed by the head of security."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeedbackModal(null)}
                  className="flex-1 py-3.5 text-slate-500 font-oswald font-bold hover:bg-slate-50 rounded-xl transition-colors text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={loadingAction}
                  className={`flex-1 py-3.5 text-white rounded-xl font-montserrat font-bold transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-md ${
                    loadingAction
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:scale-[1.01] active:scale-95"
                  } ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-600 shadow-emerald-100" : "bg-amber-600 shadow-amber-100"}`}
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
    <div className="space-y-6 p-1 flex flex-col h-[calc(100vh-100px)] overflow-hidden pb-20 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white rounded-3xl p-4 border border-slate-100 shadow-2xs">
        <div className="flex gap-3 items-center">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shrink-0">
            <Receipt size={22} />
          </div>
          <h1 className="text-lg sm:text-xl font-montserrat font-black text-slate-900 tracking-tight">
            Reports
          </h1>
        </div>
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
          {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-oswald font-bold tracking-wider uppercase transition-all flex-1 sm:flex-initial ${statusFilter === s ? "bg-white text-slate-900 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-10 pr-0.5 custom-scrollbar">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => handleViewDetails(report)}
              className="group flex items-center justify-between p-4 sm:p-6 bg-white border border-slate-100 rounded-3xl hover:border-rose-200 hover:shadow-md transition-all text-left gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`p-3 sm:p-4 rounded-2xl shrink-0 ${report.type === "SECURITY" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                >
                  {report.type === "SECURITY" ? (
                    <Shield size={22} />
                  ) : (
                    <Info size={22} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-montserrat font-black text-slate-900 group-hover:text-rose-600 transition-colors text-base truncate w-full tracking-tight">
                    {report.subject}
                  </h3>
                  <div className="md:hidden mt-1 flex items-center gap-2 text-xs font-oswald font-bold text-slate-400 uppercase tracking-wide">
                    <span className="truncate max-w-[120px]">
                      {report.reporter_name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-montserrat font-bold text-slate-900">
                    {report.reporter_name}
                  </p>
                  <p className="text-[11px] font-oswald font-bold text-slate-400 mt-0.5">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="text-slate-500 p-8 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="font-medium text-sm">
              {loading ? "Loading..." : "No reports found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
