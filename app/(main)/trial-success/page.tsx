"use client";

import React from "react";
import { useRouter } from "next/navigation";

const TrialSuccess = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50 p-4 font-sans">
      <div className="bg-white shadow-xl rounded-4xl sm:rounded-lg p-6 sm:p-8 max-w-md w-full text-center border border-white">
        <h1 className="text-2xl sm:text-3xl font-montserrat font-black text-indigo-600 mb-4 tracking-tight">
          Welcome to GateMan!
        </h1>
        <p className="text-gray-700 font-sans font-medium text-sm sm:text-base mb-6">
          Your 30-day free trial plan has officially begun. You now have access
          to manage your estate platform.
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 text-white font-oswald font-bold uppercase tracking-wider rounded-xl sm:rounded-lg hover:bg-indigo-700 transition-colors active:scale-95"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default TrialSuccess;
