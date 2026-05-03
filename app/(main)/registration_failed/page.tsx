"use client";

import { XCircle, AlertTriangle } from "lucide-react";

export default function PaymentFailure() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 text-center border border-slate-100">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-8">
          <XCircle size={40} />
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2">Payment Failed</h1>
        <p className="text-slate-500 font-bold mb-8">
          We couldn&apos;t process your transaction. This could be due to insufficient funds or a temporary bank error.
        </p>

        <div className="bg-rose-50 rounded-2xl p-4 flex items-start gap-3 text-left mb-10 border border-rose-100">
          <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          <p className="text-xs font-bold text-rose-800">
            No money was deducted from your account. If it was, Paystack will automatically trigger a refund within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}