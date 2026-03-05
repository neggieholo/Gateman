import React from 'react'
import { InvoiceWithTenant, EstateInvoice } from '../types';
import { FileText } from 'lucide-react';


interface InvoiceTableProps<T> {
  invoices: T[];
  type: 'tenant' | 'estate';

}

function InvoiceTable<T extends InvoiceWithTenant | EstateInvoice>({ invoices, type }: InvoiceTableProps<T>) {
  return (
    <div className="bg-white rounded-4xl p-6 shadow-sm border overflow-hidden">
      <div className="p-6 border-b flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-900">
          {type === 'tenant' ? 'Recent Residents Invoices' : 'Recent Estate Invoices'}
        </h2>
        <button className="text-indigo-600 text-xs font-semibold hover:underline flex items-center gap-1">
          View All <FileText size={14} />
        </button>
      </div>
      <div className="overflow-x-auto">
        {invoices.length === 0 ? (
          <p className="text-center py-6 text-slate-500">
            No {type === 'tenant' ? 'invoices' : 'estate invoices'} yet.
          </p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-xs tracking-wider">
              <tr>
                {type === 'tenant' ? (
                  <>
                    <th>Resident</th>
                    <th>Unit</th>
                    <th>Amount</th>
                    <th>Issued Date</th>
                    <th>Status</th>
                  </>
                ) : (
                  <>
                    <th>Supplier</th>
                    <th>Bill</th>
                    <th>Amount</th>
                    <th>Calculation Method</th>
                    <th>Created By</th>
                    <th>Period</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {invoices.map(inv => {
                if (type === 'tenant') {
                  const tenantInv = inv as InvoiceWithTenant;
                  return (
                    <tr key={tenantInv.id}>
                      <td>{tenantInv.tenant.name}</td>
                      <td>{tenantInv.tenant.block}-{tenantInv.tenant.unit}</td>
                      <td>₦{tenantInv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>{new Date(tenantInv.created_at).toLocaleDateString()}</td>
                      <td>{tenantInv.status}</td>
                    </tr>
                  );
                } else {
                  const estateInv = inv as EstateInvoice;
                  return (
                    <tr key={estateInv.id}>
                      <td>{estateInv.supplier_name}</td>
                      <td>{estateInv.bill_name || 'N/A'}</td>
                      <td>₦{estateInv.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td>{estateInv.calculation_method}</td>
                      <td>{estateInv.created_by_name || 'Admin'}</td>
                      <td>{estateInv.period_start ? new Date(estateInv.period_start).toLocaleDateString() : '-'} - {estateInv.period_end ? new Date(estateInv.period_end).toLocaleDateString() : '-'}</td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default InvoiceTable