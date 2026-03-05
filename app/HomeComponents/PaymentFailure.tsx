'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const PaymentFailure = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 p-4">
      <div className="bg-white shadow-md rounded-lg p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Payment UnSuccessful!
        </h1>
        <p className="text-gray-700 mb-6">
          Soory, your transaction was not successfully completed.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default PaymentFailure;
