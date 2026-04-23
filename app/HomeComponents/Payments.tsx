"use client";

import { useState } from "react";
import {
  Check,
  X,
  Copy,
  FileText,
  Calendar,
  Hash,
  Banknote,
} from "lucide-react";

import { PaymentType, Payment } from "../services/types";

export default function PaymentApprovals() {
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  // Initializing with the new type
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([
    {
      id: "pay_9921",
      resident: "Simon Dev",
      unit: "Block C4",
      amount: "₦25,000",
      type: "Security Levy",
      transId: "TRX-9988221100-ZNT",
      receiptUrl:
        "https://res.cloudinary.com/demo/image/upload/v123/receipt_sample.jpg",
      date: "2026-04-14",
    },
    {
      id: "pay_9922",
      resident: "Alice Ogar",
      unit: "Villa 2",
      amount: "₦10,000",
      type: "Power/Electricity",
      transId: "PAY-PLM-776655",
      receiptUrl:
        "https://res.cloudinary.com/demo/image/upload/v123/receipt_sample.jpg",
      date: "2026-04-15",
    },
  ]);

  // Helper to color-code payment types
  const getTypeStyles = (type: PaymentType) => {
    switch (type) {
      case "Security Levy":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Power/Electricity":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "Water Bill":
        return "bg-cyan-50 text-cyan-600 border-cyan-100";
      default:
        return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  const handleApprove = (id: string) => {
    // API Call would go here
    setPendingPayments((prev) => prev.filter((p) => p.id !== id));
    setSelectedReceipt(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could replace this alert with a toast later
    alert("Transaction ID copied to clipboard");
  };

  return (
    <div className="relative flex-1 overflow-y-auto p-6 space-y-8 h-[calc(100vh-120px)]">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Approvals
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Verify resident bank transfers
          </p>
        </div>
        <div className="bg-amber-500 text-white px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-200">
          {pendingPayments.length} Pending
        </div>
      </div>

      <div className="grid gap-4">
        {pendingPayments.map((payment) => (
          <div
            key={payment.id}
            className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div
                className={`p-4 rounded-2xl border ${getTypeStyles(payment.type)}`}
              >
                <FileText size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-lg leading-tight">
                  {payment.resident}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {payment.unit}
                  </span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getTypeStyles(payment.type)}`}
                  >
                    {payment.type}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
              <div className="text-left md:text-right">
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {payment.amount}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">
                  {payment.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(payment)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-black text-2xl text-slate-900">
                  Verify Payment
                </h3>
                <p className="text-slate-400 text-sm">
                  {selectedReceipt.resident} • {selectedReceipt.unit}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Receipt Preview */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Digital Receipt
                </span>
                <div className="aspect-[3/4] bg-slate-900 rounded-[32px] overflow-hidden ring-8 ring-slate-50">
                  <img
                    src={selectedReceipt.receiptUrl}
                    alt="Receipt"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Action Sidebar */}
              <div className="flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Reference ID
                    </span>
                    <div className="flex items-center justify-between">
                      <code className="text-sm font-black text-indigo-600">
                        {selectedReceipt.transId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedReceipt.transId)}
                        className="text-slate-400 hover:text-indigo-600"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-emerald-50 rounded-[32px] border border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                      Confirmed Amount
                    </span>
                    <p className="text-4xl font-black text-emerald-900 tracking-tighter">
                      {selectedReceipt.amount}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mt-8">
                  <button
                    onClick={() => handleApprove(selectedReceipt.id)}
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={20} /> Confirm Receipt
                  </button>
                  <button className="w-full py-5 bg-red-50 text-red-500 rounded-3xl font-bold hover:bg-red-100 transition-all">
                    Flag as Invalid
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
