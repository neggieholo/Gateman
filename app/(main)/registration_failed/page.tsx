"use client";

import { XCircle, AlertTriangle } from "lucide-react";

export default function PaymentFailure() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-4xl sm:rounded-[3rem] shadow-2xl p-6 sm:p-10 text-center border border-slate-100 my-auto">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8">
          <XCircle size={36} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-slate-900 mb-2 tracking-tight">
          Payment Failed
        </h1>
        <p className="text-slate-500 font-sans font-medium text-sm sm:text-base mb-6 sm:mb-8">
          We couldn&apos;t process your transaction. This could be due to
          insufficient funds or a temporary bank error.
        </p>

        <div className="bg-rose-50 rounded-2xl p-4 flex items-start gap-3 text-left mb-6 sm:mb-10 border border-rose-100">
          <AlertTriangle className="text-rose-600 shrink-0" size={20} />
          <p className="text-xs font-sans font-bold text-rose-800 leading-relaxed">
            No money was deducted from your account. If it was, Paystack will
            automatically trigger a refund within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
