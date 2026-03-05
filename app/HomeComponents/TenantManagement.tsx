import React, { useEffect, useState } from "react";
import { db } from "../services/database";
import { Tenant } from "../types";


const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) return;

    try {
      await db.deleteTenant(id);
      setTenants((prev) => prev.filter((t) => t.id !== id));
      setSelectedTenant(null); // go back to list after delete
    } catch (err) {
      console.error("Failed to delete tenant:", err);
    }
  };

  useEffect(() => {
    
    const fetchTenants = async () => {
        try {
        const data = await db.getAllTenants();
        setTenants(data);
        } catch (err) {
        console.error("Failed to fetch tenants:", err);
        }
    };

    fetchTenants();
  }, []);

  if (selectedTenant) {
    // ---------------- Tenant Details View ----------------
    return (
  <div className="p-6 max-w-xl mx-auto rounded-2xl shadow-lg bg-white">
    {/* Avatar */}
    <div className="flex flex-col items-center mb-6">
      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-4xl">
        <span>👤</span>
      </div>
      <h2 className="mt-4 text-2xl font-bold">{selectedTenant.name}</h2>
      <p className="text-gray-500">{selectedTenant.email}</p>
    </div>

    {/* Details */}
    <div className="space-y-3 text-gray-700">
      <p><span className="font-semibold">Block:</span> {selectedTenant.block}</p>
      <p><span className="font-semibold">Unit:</span> {selectedTenant.unit}</p>
      <p><span className="font-semibold">Wallet Balance:</span> ${selectedTenant.wallet_balance}</p>
    </div>

    {/* Buttons */}
    <div className="mt-6 flex justify-between gap-4">
      <button
        className="flex-1 px-4 py-2 bg-gray-300 rounded-xl hover:bg-gray-400 transition"
        onClick={() => setSelectedTenant(null)}
      >
        Back to List
      </button>
      <button
        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
        onClick={() => handleDelete(selectedTenant.id)}
      >
        Delete Tenant
      </button>
    </div>
  </div>
    );

  }

  // ---------------- Tenant List View ----------------
  return (
    <div className="p-4 w-full mx-auto">
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">All Tenants</h2>
      {tenants.length === 0 && <p className="mt-10">No tenants found.</p>}
      <ul className="space-y-2">
        {tenants.map((t) => (
          <li
            key={t.id}
            className="border rounded-md p-3 bg-white text-blue-600 px-5 py-2.5 text-sm font-bold shadow-lg shadow-slate-200 m-5 flex justify-between"
            onClick={() => setSelectedTenant(t)}
          >
            <span>{t.name} ({t.unit})</span>
            <span className="text-gray-500">&rarr;</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TenantManagement;
