/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Trash2,
  X,
  ListPlus,
} from "lucide-react";
import { ResidentPayment } from "../services/types";
import PaymentDisputesPage from "./PaymentsDisputesPage";
import { useUser } from "../UserContext";
import { showAccessDeniedToast } from "./Users";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import { updatePaymentItems } from "../services/apis";

type StatusFilter = "ALL" | "pending" | "verified" | "rejected";

const STATUS_FILTERS: StatusFilter[] = [
  "ALL",
  "pending",
  "verified",
  "rejected",
];

export default function PaymentReviewPage() {
  const { user, contextEstateId } = useUser();
  const [activeMainTab, setActiveMainTab] = useState<"PAYMENTS" | "DISPUTES">(
    "PAYMENTS",
  );
  const [allPayments, setAllPayments] = useState<ResidentPayment[]>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<ResidentPayment | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "pending" | "verified" | "rejected"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorPrompt, setErrorPrompt] = useState<string | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const searchParams = useSearchParams();
  const residentName = searchParams.get("resident_name");
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [paymentItems, setPaymentItems] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const canView =
    user?.permissions?.includes("estate_administration") ||
    user?.permissions?.includes("view_estate_records") ||
    user?.permissions?.includes("all-access");

  const canEditStatus =
    user?.permissions?.includes("estate_administration") ||
    user?.permissions?.includes("modify_records_status") ||
    user?.permissions?.includes("all-access");

  const fetchPayments = useCallback(async () => {
    if (!contextEstateId) return;
    const id = contextEstateId;

    setLoading(true);
    try {
      const response = await fetch(
        `${baseUrl}/api/payment/all-payments/${id}`,
        {
          method: "GET",
          credentials: "include",
        },
      );
      const res = await response.json();
      if (res.success) setAllPayments(res.payments);

      if (residentName) {
        setSearchQuery(residentName);

        const newUrl = window.location.pathname;
        window.history.replaceState({ ...window.history.state }, "", newUrl);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  }, [contextEstateId, baseUrl, residentName]);

  useEffect(() => {
    if (!canView) {
      showAccessDeniedToast();
      return;
    }
    fetchPayments();

    const currentEstate = user?.estates?.find((e) => e.id === contextEstateId);
    setPaymentItems(currentEstate?.payment_items || []);
  }, [canView, contextEstateId, fetchPayments, user]);

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
    if (!canEditStatus) {
      showAccessDeniedToast();
      return;
    }
    setLoadingAction(newStatus);
    setErrorPrompt(null);

    try {
      const res = await fetch(`${baseUrl}/api/payment/verify/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, estate_id: contextEstateId }),
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        setAllPayments((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p)),
        );
        setSelectedPayment(null);
      } else {
        toast.error(data.error || "Update failed");
        setErrorPrompt(data.error || "Update failed");
      }
    } catch (error) {
      toast.error("Connection error.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleAddItem = () => {
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    if (
      paymentItems.some((item) => item.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error("Item already exists in the list.");
      return;
    }
    setPaymentItems((prev) => [...prev, trimmed]);
    setNewItemName("");
  };

  const handleDeleteItem = (itemToDelete: string) => {
    setPaymentItems((prev) => prev.filter((item) => item !== itemToDelete));
  };

  const handleSavePaymentItems = async () => {
    if (!contextEstateId) return;

    setIsSaving(true);
    const response = await updatePaymentItems(contextEstateId, paymentItems);
    setIsSaving(false);

    if (response.success) {
      if (response.payment_items) {
        setPaymentItems(response.payment_items); 
      }
      setIsItemModalOpen(false);
    } else {
      toast.error(response.error || "Failed to update payment options.");
    }
  };

  // --- SUB-COMPONENT: LIST VIEW ---
  const PaymentList = () => (
    <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500 p-1 font-sans">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-2xs">
        <div className="flex items-center gap-3 self-start lg:self-auto">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shrink-0">
            <Receipt size={22} />
          </div>
          <h1 className="text-lg sm:text-xl font-montserrat font-black text-slate-900 tracking-tight">
            Incoming Approvals
          </h1>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl w-full lg:w-auto justify-start sm:justify-center">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-oswald font-bold tracking-wider uppercase transition-all flex-1 sm:flex-initial ${
                statusFilter === s
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {s === "verified" ? "approved" : s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsItemModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-montserrat font-bold text-xs hover:bg-indigo-100 transition-all"
        >
          <ListPlus size={16} />
          Manage Dropdown Options
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
        {filteredPayments.length > 0 ? (
          filteredPayments.map((payment) => (
            <button
              key={payment.id}
              onClick={() => setSelectedPayment(payment)}
              className="w-full flex items-center gap-4 sm:gap-10 justify-between p-4 sm:p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-4 sm:gap-6 flex-1 min-w-0">
                <div
                  className={`p-3 sm:p-4 rounded-2xl shrink-0 ${
                    payment.status === "pending"
                      ? "bg-amber-50 text-amber-600"
                      : payment.status === "verified"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-100 text-red-600"
                  }`}
                >
                  <Wallet size={22} />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between flex-1 gap-2 min-w-0">
                  <div className="flex flex-col items-start justify-center min-w-0">
                    <h3 className="font-montserrat font-black text-slate-900 text-base sm:text-lg truncate w-full">
                      {payment.category.toUpperCase()} - ₦
                      {Number(payment.amount).toLocaleString()}
                    </h3>
                    <p className="text-xs font-oswald font-bold text-slate-400 uppercase tracking-widest truncate w-full mt-0.5">
                      {payment.resident_name || "Simon Neggie"}
                    </p>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-wide">
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
              <div className="p-2 rounded-xl bg-slate-50 text-slate-400 shrink-0">
                <ChevronRight size={18} />
              </div>
            </button>
          ))
        ) : (
          <div className="text-slate-500 p-8 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <p className="font-medium text-sm">
              {loading ? "Loading..." : "No Payment Records Found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // --- SUB-COMPONENT: DETAIL VIEW ---
  const DetailView = ({ payment }: { payment: ResidentPayment }) => (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-8 animate-in slide-in-from-right duration-300 flex flex-col h-full overflow-hidden font-sans">
      <button
        onClick={() => setSelectedPayment(null)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors mb-6 font-oswald font-bold text-xs uppercase tracking-wider"
      >
        <ArrowLeft size={16} /> Back to List
      </button>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1 overflow-y-auto pr-1 pb-6">
        {/* Left Side: Proof Receipt */}
        <div className="w-full lg:w-1/2">
          <h4 className="text-slate-400 text-xs uppercase tracking-wider font-oswald font-bold mb-3">
            Proof of Payment
          </h4>
          <div className="relative group rounded-3xl overflow-hidden border-4 border-slate-50 shadow-lg bg-slate-50">
            <img
              src={payment.receipt_url}
              className="w-full h-auto object-contain bg-slate-100 max-h-[45vh] sm:max-h-[60vh]"
              alt="Receipt"
            />
            <a
              href={payment.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur rounded-2xl text-indigo-600 hover:scale-105 transition-all shadow-xs"
            >
              <ExternalLink size={18} />
            </a>
          </div>
        </div>

        {/* Right Side: Process Info Block */}
        <div className="flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-50 pb-5">
            <div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-montserrat font-black uppercase tracking-wider border border-indigo-100">
                {payment.category}
              </span>
              <h2 className="text-3xl sm:text-4xl font-montserrat font-black text-slate-900 mt-3">
                ₦{Number(payment.amount).toLocaleString()}
              </h2>
            </div>

            {payment.status === "pending" ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(payment.id, "rejected")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-50 text-rose-600 rounded-2xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${loadingAction === "rejected" ? "opacity-50" : "hover:shadow-md"}`}
                >
                  {loadingAction === "rejected" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={18} />
                  )}
                  Reject
                </button>

                <button
                  disabled={!!loadingAction}
                  onClick={() => handleUpdateStatus(payment.id, "verified")}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 text-white rounded-2xl font-montserrat font-bold text-xs uppercase tracking-wider transition-all ${loadingAction === "verified" ? "opacity-50" : "hover:shadow-md"}`}
                >
                  {loadingAction === "verified" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve
                </button>
              </div>
            ) : (
              <div className="sm:text-right">
                <h2
                  className={`font-montserrat font-black text-xs uppercase tracking-wider ${payment.status === "verified" ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {payment.status === "verified" ? "Verified" : "Rejected"}
                </h2>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailBox
              icon={<User size={16} />}
              label="Resident"
              value={payment.resident_name || "Resident's Name"}
            />
            <DetailBox
              icon={<Calendar size={16} />}
              label="Date"
              value={new Date(payment.payment_date).toLocaleDateString()}
            />
            <DetailBox
              icon={<Hash size={16} />}
              label="Reference"
              value={payment.transaction_reference}
            />
            <DetailBox
              icon={<Wallet size={16} />}
              label="Payment Type"
              value={payment.payment_type}
            />
          </div>

          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-slate-400 text-[10px] uppercase tracking-wider font-oswald font-bold mb-2">
              Resident Note
            </h4>
            <p className="text-slate-700 text-sm font-medium">
              {payment.notes || "None"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- MAIN RENDER ---
  return (
    <div className="h-[calc(100vh-100px)] w-full flex flex-col overflow-hidden p-4 pb-safe font-sans bg-slate-50/30">
      {/* Top Header Tabs Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl shadow-inner w-full sm:w-auto overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveMainTab("PAYMENTS")}
            className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-montserrat font-bold whitespace-nowrap transition-all flex-1 sm:flex-none ${
              activeMainTab === "PAYMENTS"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Wallet size={16} />
            PAYMENT RECORDS
          </button>
          <button
            onClick={() => setActiveMainTab("DISPUTES")}
            className={`flex items-center justify-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-montserrat font-bold whitespace-nowrap transition-all flex-1 sm:flex-none ${
              activeMainTab === "DISPUTES"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <ShieldAlert size={16} />
            DISPUTES & QUERIES
          </button>
        </div>

        {/* Global Search (Hidden when a payment details item is viewed) */}
        {activeMainTab === "PAYMENTS" && !selectedPayment && (
          <div className="relative group w-full sm:w-72 shrink-0">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search ref or resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-xs"
            />
          </div>
        )}
      </div>

      {/* Dynamic Main App Workspace */}
      {canView ? (
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
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200/80 max-w-xl mx-auto my-8">
          <div className="p-3 bg-red-50 text-red-600 rounded-full mb-4">
            <ShieldAlert size={28} />
          </div>
          <h3 className="text-sm font-montserrat font-black text-slate-800 uppercase tracking-wide mb-1">
            Workspace Access Restricted
          </h3>
          <p className="text-xs text-slate-400 max-w-xs leading-relaxed font-medium">
            You do not currently hold the authorized digital credentials or
            clear operational rights needed to view this interface panel.
          </p>
        </div>
      )}
      {/* Modal Overlay */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-lg font-montserrat font-black text-slate-900">
                  Payment Options
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Configure items residents select when uploading proof.
                </p>
              </div>
              <button
                disabled={isSaving}
                onClick={() => setIsItemModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-all disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Input Form */}
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="e.g. Electricity"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddItem())
                }
                disabled={isSaving}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                onClick={handleAddItem}
                disabled={isSaving || !newItemName.trim()}
                className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shrink-0 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {paymentItems.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                  No payment items added yet.
                </div>
              ) : (
                paymentItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-slate-200 transition-all"
                  >
                    <span className="text-sm font-montserrat font-bold text-slate-800">
                      {item.toUpperCase()}
                    </span>
                    <button
                      disabled={isSaving}
                      onClick={() => handleDeleteItem(item)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                disabled={isSaving}
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSavePaymentItems}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-montserrat font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 shadow-2xs">
    <div className="p-2.5 bg-slate-50 rounded-xl text-indigo-600 shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-oswald font-bold text-slate-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-montserrat font-bold text-slate-800 truncate">
        {value}
      </p>
    </div>
  </div>
);
