/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { InvoiceWithTenant, EstateInvoice } from '../types';
import { fetchTenantInvoices, fetchEstateInvoices } from '../utils/invoices';
import { GenerateInvoicePage } from './Generateinvoice';

import { FileText } from 'lucide-react';
import InvoiceTable from './InvoicesDashboardTable';


type View = string;


export default function InvoicesPage () {
  const [invoices, setInvoices] = useState<InvoiceWithTenant[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceWithTenant[]>([]);
  const [estateInvoices, setEstateInvoices] = useState<EstateInvoice[]>([]);
  const [recentEstateInvoices, setRecentEstateInvoices] = useState<EstateInvoice[]>([]);  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [tenantInvoices, estInvoices] = await Promise.all([
          fetchTenantInvoices(),
          fetchEstateInvoices()
        ]);

        setInvoices(tenantInvoices);
        setEstateInvoices(estInvoices);

        setRecentInvoices([...tenantInvoices].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,5));
        setRecentEstateInvoices([...estInvoices].sort((a,b)=> new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0,5));
      } catch (err: any) {
        console.error('Invoice fetch error:', err);
        setError(err.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // KPI
  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const paidPercentage = totalInvoices ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  if (loading) return <p className="text-center py-6">Loading invoices...</p>;
  if (error) return <p className="text-center text-red-500 py-6">{error}</p>;

  return (
    <>
      {currentView === 'dashboard' && (<div className="space-y-8 pb-24 md:pb-8 flex flex-col">
        {/* Header & KPI */}
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Estate invoices overview</p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider flex justify-between items-center">
              <span>Total Active Estate Invoices</span>
              <button className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-1">
                View All <FileText size={14} />
              </button>
            </div>
            <div className="text-4xl font-bold text-slate-900 mt-4">{totalInvoices}</div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border">
            <div className="text-slate-400 text-sm font-bold uppercase tracking-wider flex justify-between items-center">
              <span>% Paid Invoices</span>
              <button className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-1">
                View All <FileText size={14} />
              </button>
            </div>
            <div className="text-4xl font-bold text-emerald-500 mt-4">{paidPercentage}%</div>
          </div>
        </div>

        {/* Generate Buttons */}
        <div className="w-full flex justify-end gap-4 mt-6">
          <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:bg-emerald-700 flex items-center gap-2"
          onClick={()=>{setCurrentView('generateInvoice')}}>
            Generate Invoice <FileText size={16} />
          </button>
        </div>

        {/* Tables */}
        <InvoiceTable invoices={recentEstateInvoices} type="estate" />
        <InvoiceTable invoices={recentInvoices} type="tenant" />
      </div>)}
      {currentView === 'generateInvoice' && <GenerateInvoicePage setView={setCurrentView}/>}
    </>
  );
};
