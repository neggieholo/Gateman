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
  Loader2,
} from "lucide-react";
import { getEstateReports, updateReportStatus } from "../services/apis";
import { EstateReport, ReportStatus } from "../services/types";

export default function ResidentsSuggestionsView() {
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
          // Filter strictly for GENERAL type before updating state
          const securityOnly = res.reports.filter(
            (report: EstateReport) => report.type === "GENERAL",
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
    (r) => statusFilter === "ALL" || r.status === statusFilter,
  );

  if (selectedReport) {
    const isReviewed = selectedReport.status === "REVIEWED";
    const isResolved = selectedReport.status === "RESOLVED";
    return (
      <div className="bg-white rounded-xl border border-slate-200/60 p-4 sm:p-5 shadow-2xs animate-in slide-in-from-right duration-200 flex flex-col h-full min-h-0 overflow-hidden font-sans">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-blue-600 mb-4 font-montserrat font-bold text-xs uppercase tracking-wider transition-colors shrink-0 self-start"
        >
          <ArrowLeft size={14} /> Back to Directory
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0 min-w-0">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/30 text-[9px] font-oswald font-bold uppercase tracking-wide">
                REPORT LOG
              </span>
              <span className="text-slate-400 font-medium text-xs flex items-center gap-1 font-oswald tracking-wide">
                <Calendar size={12} className="text-slate-400" />{" "}
                {new Date(selectedReport.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-montserrat font-black text-slate-800 tracking-tight break-words w-full">
              {selectedReport.subject}
            </h2>
            <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs bg-slate-50 border border-slate-200/40 px-2.5 py-1 rounded-lg w-fit mt-2">
              <User size={13} className="text-blue-600 shrink-0" />
              <span>
                Reporter: {selectedReport.reporter_name || "Resident"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
            <button
              disabled={isReviewed || isResolved}
              onClick={() => triggerStatusUpdate(selectedReport.id, "REVIEWED")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-colors shadow-3xs ${
                isReviewed || isResolved
                  ? "bg-slate-100 border border-slate-200/40 text-slate-400 cursor-not-allowed"
                  : "bg-amber-50 border border-amber-200/40 text-amber-700 hover:bg-amber-100"
              }`}
            >
              <Eye size={12} />{" "}
              <span>{isReviewed || isResolved ? "Reviewed" : "Review"}</span>
            </button>

            <button
              disabled={isResolved}
              onClick={() => triggerStatusUpdate(selectedReport.id, "RESOLVED")}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-montserrat font-bold text-xs uppercase tracking-wider transition-colors shadow-3xs ${
                isResolved
                  ? "bg-emerald-50 border border-emerald-200/30 text-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98"
              }`}
            >
              <CheckCircle size={12} />{" "}
              <span>{isResolved ? "Resolved" : "Resolve"}</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden mt-4">
          <h4 className="text-slate-400 text-[9px] font-oswald font-bold uppercase tracking-wider mb-2 shrink-0">
            Report Description
          </h4>
          <div className="flex-1 overflow-y-auto pr-0.5 bg-slate-50/50 border border-slate-200/30 rounded-xl p-4 custom-scrollbar min-w-0">
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm font-medium whitespace-pre-wrap font-sans break-words w-full">
              {selectedReport.description}
            </p>
          </div>
        </div>

        {showFeedbackModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center p-4 z-50 font-sans">
            <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200 text-left">
              <div className="flex items-start gap-3 mb-4 border-b border-slate-50 pb-2">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    showFeedbackModal.status === "RESOLVED"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200/40"
                      : "bg-amber-50 text-amber-600 border border-amber-200/40"
                  }`}
                >
                  {showFeedbackModal.status === "RESOLVED" ? (
                    <CheckCircle size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide">
                    Mark as {showFeedbackModal.status.toLowerCase()}?
                  </h3>
                  <p className="text-slate-400 text-xs font-medium font-sans mt-0.5">
                    Add an optional response brief for the resident logs.
                  </p>
                </div>
              </div>

              <textarea
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs h-32 focus:border-blue-500 outline-none text-slate-700 font-medium placeholder:text-slate-400 font-sans resize-none"
                placeholder="e.g. This layout variant has been completely addressed by management."
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                autoFocus
              />

              <div className="flex gap-3 mt-4 shrink-0">
                <button
                  onClick={() => setShowFeedbackModal(null)}
                  className="flex-1 py-2 text-slate-500 font-montserrat font-bold hover:bg-slate-50 border border-transparent hover:border-slate-200/60 rounded-lg transition-colors text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  disabled={loadingAction}
                  className={`flex-1 py-2 text-white rounded-lg font-montserrat font-bold transition-all flex items-center justify-center gap-1 text-xs uppercase tracking-wider shadow-3xs ${
                    loadingAction
                      ? "opacity-70 cursor-not-allowed"
                      : "active:scale-98"
                  } ${showFeedbackModal.status === "RESOLVED" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-amber-600 hover:bg-amber-700"}`}
                >
                  {loadingAction ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full min-h-0 overflow-hidden p-1 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-white rounded-xl p-3 border border-slate-200/60 shadow-2xs shrink-0 min-w-0">
        <div className="flex gap-3 items-center min-w-0">
          <div className="p-2.5 bg-blue-600 rounded-xl text-white shrink-0">
            <Receipt size={20} />
          </div>
          <h2 className="text-base sm:text-lg font-montserrat font-black text-slate-800 uppercase tracking-tight truncate">
            Resident Reports
          </h2>
        </div>
        <div className="flex gap-0.5 p-0.5 bg-slate-100 rounded-lg w-fit overflow-x-auto shrink-0 max-w-full">
          {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-3 py-1.5 rounded-md text-[9px] font-oswald font-bold tracking-wider uppercase transition-colors shrink-0 ${
                statusFilter === s
                  ? "bg-white text-slate-800 shadow-3xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 custom-scrollbar min-w-0">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => handleViewDetails(report)}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200/60 rounded-xl hover:border-blue-400/50 hover:shadow-xs transition-all duration-200 text-left min-w-0 gap-3 group"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div
                  className={`p-3 rounded-xl border shrink-0 ${
                    report.type === "SECURITY"
                      ? "bg-rose-50 text-rose-500 border-rose-100"
                      : "bg-blue-50 text-blue-500 border-blue-100"
                  }`}
                >
                  {report.type === "SECURITY" ? (
                    <Shield size={20} />
                  ) : (
                    <Info size={20} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-montserrat font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors truncate block w-full">
                    {report.subject}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 md:hidden text-[10px] font-oswald font-medium text-slate-400 uppercase tracking-wide">
                    <span>{report.reporter_name}</span>
                    <span>•</span>
                    <span>
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden md:block min-w-0">
                  <p className="text-xs font-sans font-semibold text-slate-700 truncate max-w-[8rem]">
                    {report.reporter_name}
                  </p>
                  <p className="text-[10px] font-oswald font-bold text-slate-400 uppercase tracking-wide mt-0.5">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-200/40 text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shrink-0">
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="p-8 bg-white rounded-xl border-2 border-dashed border-slate-200 text-center min-w-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-slate-400">
                <Loader2
                  size={20}
                  className="animate-spin text-blue-600 mb-2"
                />
                <p className="text-[10px] font-montserrat font-bold uppercase tracking-wider">
                  Syncing Issue Matrices...
                </p>
              </div>
            ) : (
              <p className="text-slate-400 text-xs font-medium font-sans">
                No dynamic estate logs found for this category criteria.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
