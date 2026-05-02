/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronRight,
  Wallet,
  Receipt,
  Search,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Hash,
  ExternalLink,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { ResidentPayment } from "../services/types";
import PaymentDisputesPage from "./PaymentsDisputesPage";

export default function PaymentReviewPage() {
  const [activeMainTab, setActiveMainTab] = useState<"PAYMENTS" | "DISPUTES">(
    "PAYMENTS",
  );
  const [allPayments, setAllPayments] = useState<ResidentPayment[]>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<ResidentPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/payment/all-payments");
      const res = await response.json();
      if (res.success) setAllPayments(res.payments);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return allPayments.filter((p) => {
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchesSearch =
        p.resident_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.transaction_reference
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [allPayments, statusFilter, searchQuery]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: "verified" | "rejected",
  ) => {
    setLoadingAction(newStatus);
    setErrorPrompt(null);

    try {
      const res = await fetch(`/api/payment/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (data.success) {
        setAllPayments((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
        );
        setSelectedPayment(null);
      } else {
        alert(data.error || "Update failed");
        setErrorPrompt(data.error || "Update failed");
      }
    } catch (error) {
      alert("Connection error.");
    } finally {
      setLoadingAction(null);
    }
  };

  // --- SUB-COMPONENT: LIST VIEW ---
  const PaymentList = () => (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 p-2">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-white p-3 rounded-[2.5rem] border border-slate-50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white">
            <Receipt size={24} />
          </div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
            Incoming Approvals
          </h1>
        </div>

        <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl">
          {["ALL", "pending", "verified", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all ${
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              {s === 'verified' ? 'approved' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <button
              key={payment.id}
              onClick={() => setSelectedPayment(payment)}
              className="w-full flex items-center gap-10 justify-between p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:border-indigo-200 hover:shadow-xl transition-all"
            >
              <div className="flex items-center gap-6 flex-1">
                <div
                  className={`p-4 rounded-2xl ${
                    payment.status === "pending"
                      ? "bg-amber-50 text-amber-600"
                      : payment.status === "verified"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  <Wallet size={24} />
                </div>
                <div className="flex justify-between flex-1">
                  <div className="flex flex-col items-start justify-center">
                    <h3 className="font-black text-slate-900 text-lg">
                      {payment.category.toUpperCase()} - ₦
                      {Number(payment.amount).toLocaleString()}
                    </h3>
                    <p className="text-md font-black text-slate-400 uppercase tracking-widest">
                      {payment.resident_name || "Simon Neggie"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">
                      {new Date(payment.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 text-slate-400">
                <ChevronRight size={20} />
              </div>
            </button>
          ))
        ) : (
          <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
            {loading ? "Loading..." : "No Payment Records Found"}
          </p>
        )}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: DETAIL VIEW ---
  const DetailView = ({ payment }: { payment: ResidentPayment }) => (
    <div className="bg-white rounded-[3rem] border border-slate-100 p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden">
      <button
        onClick={() => setSelectedPayment(null)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-8 font-black text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={18} /> Back to List
      </button>
      <div className="flex flex-col lg:flex-row gap-12 flex-1 overflow-y-auto pr-2 pb-10">
        <div className="w-full lg:w-1/2">
          <h4 className="text-slate-400 text-[12px] uppercase tracking-[0.2em] font-black mb-4">
            Proof of Payment
          </h4>
          <div className="relative group rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-2xl">
            <img
              src={payment.receipt_url}
              className="w-full object-contain bg-slate-100 max-h-[60vh]"
              alt="Receipt"
            />
            <a
              href={payment.receipt_url}
              target="_blank"
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl text-indigo-600 hover:scale-110 transition-all"
            >
              <ExternalLink size={20} />
            </a>
          </div>
        </div>
        <div className="flex-1 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-md font-black uppercase tracking-widest border border-indigo-100">
                {payment.category}
              </span>
              <h2 className="text-4xl font-black text-slate-900 mt-4">
                ₦{Number(payment.amount).toLocaleString()}
              </h2>
            </div>
            {payment.status === "pending" ? (
              <div className="flex gap-3">
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(payment.id, "rejected")}
                  className={`flex items-center gap-2 px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${loadingAction === "rejected" ? "opacity-50" : "hover:shadow-lg hover:shadow-red-200"}`}
                >
                  {loadingAction === "rejected" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <XCircle size={24} />
                  )}
                  Reject
                </button>

                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(payment.id, "verified")}
                  className={`flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${loadingAction === "verified" ? "opacity-50" : "hover:shadow-lg hover:shadow-emerald-200"}`}
                >
                  {loadingAction === "verified" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                  Approve
                </button>
              </div>
            ) : (
              <div className="text-right">
                <h2
                  className={`font-black text-xs uppercase tracking-[0.2em] ${payment.status === "verified" ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {payment.status === "verified" ? "Verified" : "Rejected"}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  {payment.verified_at
                    ? new Date(payment.verified_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Date not recorded"}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DetailBox
              icon={<User size={18} />}
              label="Resident"
              value={payment.resident_name || "Resident's Name"}
            />
            <DetailBox
              icon={<Calendar size={18} />}
              label="Date"
              value={new Date(payment.payment_date).toLocaleDateString()}
            />
            <DetailBox
              icon={<Hash size={18} />}
              label="Reference"
              value={payment.transaction_reference}
            />
            <DetailBox
              icon={<Wallet size={18} />}
              label="Payment Type"
              value={payment.payment_type}
            />
          </div>
          <div className="p-8 bg-slate-50 rounded-4xl border border-slate-100">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black mb-3">
              Resident Note
            </h4>
            <p className="text-slate-700 font-bold">
              {payment.notes || "None"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col overflow-hidden p-4">
      {/* Top Header Tabs */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-4xl shadow-inner">
          <button
            onClick={() => setActiveMainTab("PAYMENTS")}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-black transition-all ${
              activeMainTab === "PAYMENTS"
                ? "bg-white text-indigo-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Wallet size={18} />
            PAYMENT RECORDS
          </button>
          <button
            onClick={() => setActiveMainTab("DISPUTES")}
            className={`flex items-center gap-3 px-8 py-3 rounded-3xl text-sm font-black transition-all ${
              activeMainTab === "DISPUTES"
                ? "bg-white text-rose-600 shadow-md"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldAlert size={18} />
            DISPUTES & QUERIES
          </button>
        </div>

        {/* Global Search (Only shown for Payment Tab) */}
        {activeMainTab === "PAYMENTS" && !selectedPayment && (
          <div className="relative group w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search ref or resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeMainTab === "PAYMENTS" ? (
          selectedPayment ? (
            <DetailView payment={selectedPayment} />
          ) : (
            <PaymentList />
          )
        ) : (
          <PaymentDisputesPage />
        )}
      </div>
    </div>
  );
}

const DetailBox = ({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) => (
  <div className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-xl text-indigo-600">{icon}</div>
    <div>
      <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className="text-sm font-black text-slate-800">{value}</p>
    </div>
  </div>
);
