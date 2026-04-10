/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityUser } from "../services/types";
import { Trash2, Mail, Phone, Search, Clock, Loader2 } from "lucide-react";
import { formatLastSeen } from "../services/apis";

export default function SecurityPersonnelsList() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const fetchGuards = async () => {
    setError(false);
    try {
      const data = await securityDb.getAllSecurity();
      setGuards(data);
    } catch (err) {
      setError(true);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const filteredGuards = guards.filter(
    (guard) =>
      guard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this personnel?")) return;
    setDeletingId(id);
    try {
      await securityDb.deleteSecurity(id);
      setGuards(guards.filter((g) => g.id !== id));
    } catch (err) {
      alert("Failed to delete personnel");
    } finally {
      setDeletingId(null); // Stop loading
    }
  };

  return (
    <div className="h-[calc(100vh-250px)] flex flex-col">
      {/* Search Toolbar - Simplified per your request */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 mx-4">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search personnel..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGuards.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 p-4">
            {filteredGuards.map((guard) => (
              <div
                key={guard.id}
                className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-72"
              >
                <div className="flex flex-row flex-1 p-3 gap-4">
                  <div className="w-32 h-full bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                    {guard.avatar ? (
                      <img
                        src={guard.avatar}
                        className="w-full h-full object-cover"
                        alt={guard.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300 font-bold text-2xl">
                        {guard.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-lg truncate">
                        {guard.name}
                      </h3>
                      {guard.is_on_duty && (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} className="shrink-0" />
                      <p className="text-xs truncate">{guard.email}</p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={14} className="shrink-0" />
                      <p className="text-xs truncate">
                        {guard.phone || "No phone"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Last Check-in
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {guard.last_checkin
                              ? formatLastSeen(guard.last_checkin)
                              : "No record"}
                          </span>
                        </div>
                      </div>

                      {/* Last Check-out Section */}
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Last Check-out
                        </p>
                        <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-2 py-1 rounded-md w-fit">
                          <Clock size={14} />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {guard.last_checkout
                              ? formatLastSeen(guard.last_checkout)
                              : "No record"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button at the base */}
                <button
                  onClick={() => handleDelete(guard.id)}
                  disabled={deletingId === guard.id}
                  className={`w-full py-3 border-t border-slate-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                    deletingId === guard.id
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-slate-50 text-red-600 hover:bg-red-50"
                  }`}
                >
                  {deletingId === guard.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Remove Personnel
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-10 bg-red-50 rounded-xl border border-red-100 border-dashed flex flex-col items-center">
            <p className="text-red-600 font-bold">Server Error</p>
            <button
              onClick={fetchGuards}
              className="mt-2 text-xs text-red-500 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
              {loading ? "Loading..." : "No security personnel found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
