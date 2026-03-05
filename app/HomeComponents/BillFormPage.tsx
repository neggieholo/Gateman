import { useState } from "react";

const predefinedBills = [
  "Service Charge",
  "Water Bill",
  "Electricity",
  "Waste Management",
  "Security Levy",
  "Sewage",
  "Parking Fee",
  "Facility Maintenance",
  "Generator Fuel",
  "Cleaning",
  "Late Payment Penalty",
];

type BillRegistrationFormProps = {
  setView: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function BillRegistrationForm({ setView }: BillRegistrationFormProps) {
  const [selectedPredefined, setSelectedPredefined] = useState("");
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [dueDay, setDueDay] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const billName = selectedPredefined !== "" ? selectedPredefined : customName.trim();

    if (!billName) {
      setError("Please select or enter a bill name.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    if (billingCycle === "monthly" && (dueDay < 1 || dueDay > 28)) {
      setError("Enter a valid due day (1–28).");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${baseUrl}/bills/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: billName,
          description: "", // optional
          amount: Number(amount),
          billing_cycle: billingCycle,
          due_day: billingCycle === "monthly" ? Number(dueDay) : undefined,
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to register bill");
      } else {
        setSelectedPredefined("");
        setCustomName("");
        setAmount("");
        setBillingCycle("monthly");
        setDueDay(1);
        setView(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error, try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl max-h-screen overflow-y-auto mx-auto p-8 bg-white dark:bg-gray-800 shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700">
      <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-6 border-b pb-2">
        💸 Register a New Bill
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div role="alert" className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Predefined Bills */}
        <div>
          <label className="label">
            <span className="label-text font-semibold text-gray-700 dark:text-gray-300">Select a Predefined Bill</span>
          </label>
          <select
            className="select select-bordered w-full focus:ring-2 focus:ring-indigo-500 transition duration-150"
            value={selectedPredefined}
            onChange={(e) => {
              setSelectedPredefined(e.target.value);
              setCustomName("");
            }}
          >
            <option value="">--- Choose an option ---</option>
            {predefinedBills.map((bill) => (
              <option key={bill} value={bill}>{bill}</option>
            ))}
          </select>
        </div>

        {/* Custom Bill */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <label className="label">
            <span className="label-text font-semibold text-gray-700 dark:text-gray-300">
              Or Enter a Custom Bill Name
            </span>
          </label>
          <input
            type="text"
            placeholder="e.g. Plumbing Repair Fee"
            className="input input-bordered w-full focus:ring-2 focus:ring-indigo-500 transition duration-150"
            value={customName}
            onChange={(e) => {
              setCustomName(e.target.value);
              setSelectedPredefined("");
            }}
          />
        </div>

        {/* Amount */}
        <div>
          <label className="label">
            <span className="label-text font-semibold text-gray-700 dark:text-gray-300">Amount (₦)</span>
          </label>
          <input
            type="number"
            className="input input-bordered w-full focus:ring-2 focus:ring-indigo-500 transition duration-150"
            placeholder="e.g. 15000"
            min="0.01"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Billing Cycle */}
        <div>
          <label className="label">
            <span className="label-text font-semibold text-gray-700 dark:text-gray-300">Billing Cycle</span>
          </label>
          <select
            className="select select-bordered w-full focus:ring-2 focus:ring-indigo-500 transition duration-150"
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
          >
            <option value="monthly">Monthly</option>
            <option value="one_time">One-time</option>
          </select>
        </div>

        {/* Due Day */}
        {billingCycle === "monthly" && (
          <div>
            <label className="label">
              <span className="label-text font-semibold text-gray-700 dark:text-gray-300">
                Due Day of Month (1–28)
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={28}
              className="input input-bordered w-full focus:ring-2 focus:ring-indigo-500 transition duration-150"
              value={dueDay}
              onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
            />
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            className="btn btn-ghost w-1/2 text-gray-600 hover:bg-gray-100"
            onClick={() => {
              setView(false);
              setError(null);
              setSelectedPredefined("");
              setCustomName("");
              setAmount("");
              setBillingCycle("monthly");
              setDueDay(1);
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={'btn btn-primary w-1/2 bg-indigo-600 hover:bg-indigo-700 border-indigo-600 hover:border-indigo-700 text-white shadow-lg shadow-indigo-500/50'}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register Bill"}
          </button>
        </div>
      </form>
    </div>
  );
}
