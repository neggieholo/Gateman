// api/invoices.ts
import { InvoiceWithTenant, EstateInvoice, BillItem } from '../types';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export async function fetchTenantInvoices(): Promise<InvoiceWithTenant[]> {
  const res = await fetch(`${baseUrl}/invoices`, { credentials: 'include' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch invoices');
  console.log("tenant invoices:", data.invoices)
  return data.invoices;
}

export async function fetchEstateInvoices(): Promise<EstateInvoice[]> {
  const res = await fetch(`${baseUrl}/invoices/estate_invoices`, { credentials: 'include' });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Failed to fetch general invoices');
  console.log("estate invoices:", data.estateInvoices)
  return data.estateInvoices;
}

export async function fetchBills (): Promise<BillItem[]> {
  const res = await fetch(`${baseUrl}/bills`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error("Failed to fetch bills");
  }

  const data = await res.json();
  return data.bills;
};

export async function postEstateInvoice(data: {
  billId: string;
  calculationMethod: 'EQUAL' | 'BY_UNIT_TYPE' | 'BY_CONSUMPTION' | 'BY_SQUARE_METER' | 'CUSTOM_FORMULA';
  periodStart: string;
  periodEnd: string;
  supplier_name: string;
  notes?: string;
  invoice_type: 'general' | 'specific';
  tenantId?: string | null;
}) {
  const res = await fetch(`${baseUrl}/invoices/estate_invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create estate invoice");
  }

  return res.json();
}

