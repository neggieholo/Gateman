'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Bill, User } from '../types';
import BillRegistrationForm from './BillFormPage';
import BillsList from './AllBillsPage';
import { AlertCircle, Zap, Flame, Shield } from 'lucide-react';


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default function Utilities () {
  const [bills, setBills] = useState<Bill[]>([]);
  const [viewBillsForm, setViewBillsForm] = useState<boolean>(false);
  const [viewAllBills, setViewAllBills] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch bills from API
  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/bills`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch bills');
      const data = await res.json();
      setBills(data.bills || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Totals
  const totalCollected = 0; // no invoices yet
  const totalOutstanding = bills.reduce((sum, b) => sum + Number(b.amount), 0);

  // Hardcoded placeholders for KPI cards
  const completedBills = 8; // example
  const completionPercentage = 45; // example %

  const handlePay = (bill: Bill) => {
    if (bill.status === 'Paid') return;
    if (window.confirm(`Pay ₦${bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} for ${bill.type}?`)) {
      try {
        setBills(bills.map(b => (b.id === bill.id ? { ...b, status: 'Paid' } : b)));
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'Electricity': return <Zap className="text-amber-500" />;
      case 'Gas': return <Flame className="text-orange-500" />;
      case 'Estate Dues': return <Shield className="text-teal-500" />;
      default: return <AlertCircle className="text-slate-500" />;
    }
  };

  if (loading) return <p className="text-center py-6">Loading bills...</p>;
  if (error) return <p className="text-center text-red-500 py-6">{error}</p>;

  return (
    <>
      {(!viewBillsForm && !viewAllBills) && (
        <div className="space-y-8 pb-24 md:pb-8 flex flex-col">
          {/* Header */}
          <header className="flex justify-start items-end">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Billing & Finance</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">Estate financial overview</p>
            </div>
          </header>

          {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-6">
    {/* Total Outstanding */}
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Outstanding</div>
        <div className="text-4xl font-bold text-rose-500">₦{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div className="text-sm text-slate-400 font-medium">{bills.length} total bills</div>
    </div>

    {/* Collected This Month */}
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
        <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Collected This Month</div>
        <div className="text-4xl font-bold text-emerald-500">₦{totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        <div className="text-sm text-slate-400 font-medium">+15% vs last month</div>
    </div>
            </div>

            {/* Bill Progress Cards */}
            <div className="grid grid-cols-2 gap-6 mt-6">
            {/* Completed Bills */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Completed Bills</span>
                <button className="text-indigo-600 text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="text-4xl font-bold text-indigo-500">{completedBills}</div>
                <div className="text-sm text-blue-300 font-medium">For This Month</div>
            </div>

            {/* Completion Percentage */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-40">
                <div className="text-slate-400 text-sm font-bold uppercase tracking-wider flex justify-between items-center">
                <span>Completion %</span>
                <button className="text-indigo-600 text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="text-4xl font-bold text-indigo-500">{completionPercentage}%</div>
                <div className="text-sm text-blue-300 font-medium">For This Month</div>
            </div>
            </div>


          {/* Action Buttons */}
          <div className="w-full flex justify-between gap-4 mt-12 pt-4">
            <button
              className="px-6 py-2 border border-indigo-500 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-sm"
              onClick={() => setViewAllBills(true)}
            >
              View All Bills
            </button>
            <button
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
              onClick={() => setViewBillsForm(true)}
            >
              Add New Bill
            </button>
          </div>
        </div>
      )}

      {viewBillsForm && <BillRegistrationForm setView={setViewBillsForm} />}
      {viewAllBills && <BillsList setView={setViewAllBills} />}
    </>
  );
};
