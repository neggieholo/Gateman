/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { BillItem, Tenant } from '../types';
import { fetchBills, postEstateInvoice } from '../utils/invoices';
import { db } from '../services/database';


type GenerateInvoiceProps = {
  setView: React.Dispatch<React.SetStateAction<string>>;
};

export const GenerateInvoicePage: React.FC<GenerateInvoiceProps> = ({setView}) => {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState('');


  const [billId, setBillId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'general' | 'specific'>('general');
  const [calculationMethod, setCalculationMethod] = useState<'EQUAL' | 'BY_UNIT_TYPE' | 'BY_CONSUMPTION' | 'BY_SQUARE_METER' | 'CUSTOM_FORMULA'>('EQUAL');
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [paymentStart, setPaymentStart] = useState('');
  const [paymentEnd, setPaymentEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [billData, tenantData] = await Promise.all([fetchBills(), db.getAllTenants()]);
      setBills(billData.filter(b => b.is_active));
      setTenants(tenantData);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Prefill amount when bill changes
    const selectedBill = bills.find(b => b.id === billId);
    if (selectedBill && calculationMethod !== 'CUSTOM_FORMULA') {
      setAmount(selectedBill.amount);
    }
  }, [billId, calculationMethod, bills]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!billId) return alert('Please select a bill');
  if (!paymentStart || !paymentEnd) return alert('Payment start and end dates required');
  if (invoiceType === 'specific' && !tenantId) return alert('Please select a tenant');

  setSubmitting(true);
  try {
    // Get selected bill to pass supplier name and amount
    const selectedBill = bills.find(b => b.id === billId);
    if (!selectedBill) return alert('Selected bill not found');

    await postEstateInvoice({
      billId,
      calculationMethod,
      periodStart: paymentStart,
      periodEnd: paymentEnd,
      supplier_name: supplierName, // or any supplier field you have
      notes,
      invoice_type: invoiceType,
      tenantId: invoiceType === 'specific' ? tenantId : undefined,
    });

    alert('Invoice generated successfully');
  } catch (err: any) {
    console.error(err);
    alert('Failed to generate invoice');
  } finally {
    setSubmitting(false);
  }
};


  if (loading) return <p>Loading...</p>;

  return (
    <>      
      <div className="flex justify-end">
        <button
            className="btn btn-ghost text-gray-600 hover:bg-gray-100"
            onClick={() => setView('dashboard')}
        >
            Back
        </button>
      </div>
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Generate Invoice</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Bill</label>
            <select value={billId} onChange={e => setBillId(e.target.value)} className="w-full border p-2 rounded-lg">
              <option value="">-- Select Bill --</option>
              {bills.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} | {b.billing_cycle} | {b.invoice_type} | ₦{b.amount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Invoice Type</label>
            <select value={invoiceType} onChange={e => setInvoiceType(e.target.value as any)} className="w-full border p-2 rounded-lg">
              <option value="general">General (All Units)</option>
              <option value="specific">Specific (Single Tenant)</option>
            </select>
          </div>

          {invoiceType === 'specific' && (
            <div>
              <label>Tenant</label>
              <select value={tenantId || ''} onChange={e => setTenantId(e.target.value)} className="w-full border p-2 rounded-lg">
                <option value="">-- Select Tenant --</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name} ({t.block}-{t.unit})</option>)}
              </select>
            </div>
          )}

          <div>
            <label>Calculation Method</label>
            <select value={calculationMethod} onChange={e => setCalculationMethod(e.target.value as any)} className="w-full border p-2 rounded-lg">
              <option value="EQUAL">Equal</option>
              <option value="BY_UNIT_TYPE">By Unit Type</option>
              <option value="BY_CONSUMPTION">By Consumption</option>
              <option value="BY_SQUARE_METER">By Square Meter</option>
              <option value="CUSTOM_FORMULA">Custom Formula</option>
            </select>
          </div>

          {calculationMethod === 'CUSTOM_FORMULA' && (
            <div>
              <label>Amount / Formula</label>
              <input type="number" value={amount ?? ''} onChange={e => setAmount(Number(e.target.value))} className="w-full border p-2 rounded-lg" />
            </div>
          )}

          <div>
              <label>Merchant Name</label>
              <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                  className="w-full border p-2 rounded-lg"
                  required
              />
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Payment Start</label>
              <input type="date" value={paymentStart} onChange={e => setPaymentStart(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
            <div>
              <label>Payment End</label>
              <input type="date" value={paymentEnd} onChange={e => setPaymentEnd(e.target.value)} className="w-full border p-2 rounded-lg" />
            </div>
          </div>

          <div>
            <label>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full border p-2 rounded-lg" />
          </div>

          <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700">
            {submitting ? 'Generating...' : 'Generate Invoice'}
          </button>
        </form>
      </div>
    </>
  );
};
