import { useState, useEffect } from "react";
import { BillItem } from "../types";
import { fetchBills } from "../utils/invoices";



const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

// Delete a bill
const deleteBill = async (id: string) => {
  const res = await fetch(`${baseUrl}/bills/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error("Failed to delete bill");
  }

  const data = await res.json();
  return data;
};

// Update a bill
const updateBill = async (id: string, body: Partial<BillItem>) => {
  const res = await fetch(`${baseUrl}/bills/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: 'include'
  });

  if (!res.ok) {
    throw new Error("Failed to update bill");
  }

  const data = await res.json();
  return data;
};

type BillRegistrationFormProps = {
  setView: React.Dispatch<React.SetStateAction<boolean>>;
};

// Component
export default function BillsList({ setView}: BillRegistrationFormProps) {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await fetchBills();
      setBills(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch bills.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleToggleActive = async (bill: BillItem) => {
  try {
    const res = await fetch(`${baseUrl}/bills/${bill.id}/toggle`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: 'include'
    });

    if (!res.ok) throw new Error("Failed to toggle bill status");

    const data = await res.json();
    setBills(bills.map((b) => (b.id === bill.id ? data.bill : b)));
  } catch (err) {
    console.error(err);
    alert("Failed to update bill status.");
  }
};


  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      await deleteBill(id);
      setBills(bills.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete bill.");
    }
  };

  if (loading) return <p className="text-center py-6">Loading bills...</p>;
  if (error) return <p className="text-center text-red-500 py-6">{error}</p>;
  if (!bills.length) return <p className="text-center py-6">No bills found.</p>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
        <div className="flex justify-end">
            <button
                className="btn btn-ghost text-gray-600 hover:bg-gray-100"
                onClick={() => setView(false)}
            >
                Back
            </button>
        </div>
      {bills.map((bill) => (
        <div
          key={bill.id}
          className="border rounded-lg p-4 shadow hover:shadow-lg transition flex justify-between items-start bg-white dark:bg-gray-800"
        >
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              {bill.name} {bill.is_active ? "" : "(Inactive)"}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {bill.description || "No description"}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              Amount: ₦{bill.amount.toLocaleString()}
            </p>
            <p className="text-gray-700 dark:text-gray-200">
              Billing: {bill.billing_cycle}
            </p>
            {bill.billing_cycle === "monthly" && (
              <p className="text-gray-700 dark:text-gray-200">
                Due Day: {bill.due_day}
              </p>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            <button
              className="btn btn-sm btn-warning"
              onClick={() => handleToggleActive(bill)}
            >
              {bill.is_active ? "Deactivate" : "Activate"}
            </button>
            <button
              className="btn btn-sm btn-info"
              onClick={() => alert("Edit bill functionality coming soon")}
            >
              Edit
            </button>
            <button
              className="btn btn-sm btn-error"
              onClick={() => handleDelete(bill.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
