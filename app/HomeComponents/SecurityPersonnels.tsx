/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityUser } from "../types";
import { Trash2, Shield, Mail, Phone, Search, MapPin } from "lucide-react";

export default function SecurityPersonnelsList() {
  const [guards, setGuards] = useState<SecurityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGuards = async () => {
    try {
      const data = await securityDb.getAllSecurity();
      setGuards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuards();
  }, []);

  const filteredGuards = guards.filter(guard => 
    guard.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    guard.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this personnel?")) return;
    try {
      await securityDb.deleteSecurity(id);
      setGuards(guards.filter(g => g.id !== id));
    } catch (err) {
      alert("Failed to delete personnel");
    }
  };

  const handleRequestLocation = (id: string) => {
    // Placeholder for your location request logic
    console.log(`Requesting location for guard: ${id}`);
  };

  return (
    <>
      {/* Search Toolbar - Simplified per your request */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100 mx-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search personnel..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredGuards.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 p-4">
          {filteredGuards.map((guard) => (
            <div key={guard.id} className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-72">
              
              <div className="flex flex-row flex-1 p-3 gap-4">
                <div className="w-32 h-full bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                  {guard.avatar ? (
                    <img src={guard.avatar} className="w-full h-full object-cover" alt={guard.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-300 font-bold text-2xl">
                      {guard.name[0]}
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-center space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-lg truncate">{guard.name}</h3>
                    {guard.is_on_duty && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-500">
                    <Mail size={14} className="shrink-0" />
                    <p className="text-xs truncate">{guard.email}</p>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500">
                    <Phone size={14} className="shrink-0" />
                    <p className="text-xs truncate">{guard.phone || "No phone"}</p>
                  </div>

                  <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-2 py-1 rounded-md w-fit">
                    <Shield size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Official Personnel</span>
                  </div>

                  {/* Request Location Button inside card info */}
                  <button 
                    onClick={() => handleRequestLocation(guard.id)}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors pt-1"
                  >
                    <MapPin size={14} />
                    Request Location
                  </button>
                </div>
              </div>

              {/* Action Button at the base */}
              <button 
                onClick={() => handleDelete(guard.id)}
                className="w-full py-3 bg-slate-50 border-t border-slate-100 text-red-600 font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 size={16} />
                Remove Personnel
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4">
          <p className="text-gray-500 p-5 bg-white rounded-lg border border-dashed text-center">
            {loading ? "Loading..." : "No security personnel found"}
          </p>
        </div>
      )}
    </>
  );
}