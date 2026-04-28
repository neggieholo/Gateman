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

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await getEstateReports();
        console.log("Fetched reports:", res);

        if (res.success) {
          // Filter strictly for SECURITY type before updating state
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

  const handleStatusUpdate = async (
    id: string,
    newStatus: "REVIEWED" | "RESOLVED",
  ) => {
    console.log("status update clicked");
    const res = await updateReportStatus(id, newStatus);
    if (res.success) {
      setReports(
        reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
      setSelectedReport((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );
    }
  };

  // const MultipliedReports = Array(16).fill(reports).flat();
  const filteredReports = reports.filter(
    (r) =>
      (typeFilter === "ALL" || r.category === typeFilter) &&
      (statusFilter === "ALL" || r.status === statusFilter),
  );

  //   if (loading) {
  //     return (
  //       <div className="flex flex-col items-center justify-center p-20 bg-white rounded-[3rem] border border-slate-100">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
  //         <p className="mt-4 text-slate-500 font-medium">Loading reports...</p>
  //       </div>
  //     );
  //   }

  if (selectedReport) {
    const isReviewed = selectedReport.status === "REVIEWED";
    const isResolved = selectedReport.status === "RESOLVED";
    return (
      <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300 flex flex-col  h-[calc(100vh-100px)]  overflow-hidden pb-20">
        <button
          onClick={() => setSelectedReport(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 font-bold"
        >
          <ArrowLeft size={20} /> Back to List
        </button>

        <div className="flex flex-col md:flex-row justify-between gap-6 border-b border-slate-50 pb-8">
          <div className="flex-1">
            <div className="flex justify-between">
              <div className="flex items-center gap-3 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    selectedReport.category === "COMPLAINT"
                      ? "bg-rose-100 text-rose-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {selectedReport.category === "COMPLAINT"
                    ? "PERSONNEL"
                    : "GENERAL"}{" "}
                  REPORT
                </span>
                <span className="text-slate-400 font-medium text-sm flex items-center gap-1">
                  <Calendar size={14} />{" "}
                  {new Date(selectedReport.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex gap-8">
                <button
                  disabled={isReviewed || isResolved}
                  onClick={() =>
                    handleStatusUpdate(selectedReport.id, "REVIEWED")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isReviewed || isResolved ? "bg-slate-50 text-slate-300" : "bg-amber-50 text-amber-600 hover:bg-amber-100"}`}
                >
                  <Eye size={16} />{" "}
                  {isReviewed || isResolved ? "Reviewed" : "Mark as Reviewed"}
                </button>

                <button
                  disabled={isResolved}
                  onClick={() =>
                    handleStatusUpdate(selectedReport.id, "RESOLVED")
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isResolved ? "bg-emerald-50 text-emerald-300" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                >
                  <CheckCircle size={16} />{" "}
                  {isResolved ? "Resolved" : "Mark as Resolved"}
                </button>
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4">
              {selectedReport.subject}
            </h2>
            <div className="flex items-center gap-2 text-slate-600 font-bold bg-slate-50 self-start px-4 py-2 rounded-xl">
              <User size={18} /> Reporter:{" "}
              {selectedReport.reporter_name || "Resident"}
            </div>
          </div>
        </div>

        <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-4">
          Report Description
        </h4>
        <div className="py-8 flex-1 flex flex-col gap-4 overflow-y-auto pb-10">
          <p className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap">
            {selectedReport.description}
          </p>

          {selectedReport.category === "COMPLAINT" && (
            <div className="mt-4 pt-8 border-t border-slate-50">
              <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-6">
                Mentioned Personnel
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {associatedGuards.length > 0 ? (
                  associatedGuards.map((guard) => (
                    <div
                      key={guard.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <img
                        src={guard.avatar}
                        onClick={() =>
                          guard.avatar && setSelectedImage(guard.avatar)
                        }
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-black text-slate-800">
                          {guard.name}
                        </p>
                        <p className="text-xs text-slate-500 font-bold">
                          {guard.phone}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm font-medium italic">
                    No personnel details found.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        {selectedImage && (
          <div
            className="fixed inset-0 z-100 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl w-full flex flex-col items-center">
              <button
                className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-full transition-all"
                onClick={() => setSelectedImage(null)}
              >
                <X size={32} />
              </button>
              <img
                src={selectedImage}
                className="max-h-[80vh] w-auto rounded-3xl shadow-2xl border-4 border-white/10 object-contain"
                alt="Guard"
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-3 flex flex-col  h-[calc(100vh-100px)]  overflow-hidden pb-20">
      {/* Filter Bar */}
      <div className="flex justify-between">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          {["ALL", "PERSONNEL", "GENERAL"].map((f) => (
            <button
              key={f}
              onClick={() => typeFilterSet(f as any)}
              className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${
                tabLabel === f
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
          {["ALL", "PENDING", "REVIEWED", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as any)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest ${statusFilter === s ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-10">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <button
              key={report.id}
              onClick={() => handleViewDetails(report)}
              className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-4xl hover:border-rose-200 hover:shadow-xl hover:shadow-rose-500/5 transition-all text-left"
            >
              <div className="flex items-center gap-6">
                <div
                  className={`p-4 rounded-2xl ${report.type === "SECURITY" ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-500"}`}
                >
                  {report.type === "SECURITY" ? (
                    <Shield size={24} />
                  ) : (
                    <Info size={24} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                      {report.subject}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                  <p className="text-xs font-black text-slate-900">
                    {report.reporter_name}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-rose-600 group-hover:text-white transition-all">
                  <ChevronRight size={20} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
            {loading ? "Loading..." : "No reports"}
          </p>
        )}
      </div>
    </div>
  );
}

{
  /* <div className="p-20 bg-white rounded-[3rem] border border-slate-100 border-dashed flex flex-col items-center">
  <AlertOctagon size={48} className="text-slate-200 mb-4" />
  <p className="text-slate-400 font-bold">No reports found in this category.</p>
</div>; */
}
