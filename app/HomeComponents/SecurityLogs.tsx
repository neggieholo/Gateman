import React, { useEffect, useState } from "react";
import { securityDb } from "../services/database";
import { SecurityLog } from "../types";
import { Search, Calendar, MapPin, Clock, Loader2, FileText } from "lucide-react";

export default function SecurityLogsPage() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    try {
      const data = await securityDb.getSecurityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const filteredLogs = logs.filter(log => 
    log.guard_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.checkin_location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> Duty Logs
          </h1>
          <p className="text-slate-500 text-sm">Historical record of all security check-ins and check-outs.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Filter by guard or location..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Security Personnel</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-In</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Check-Out</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-blue-600 font-bold">
                      <Loader2 className="animate-spin" size={32} />
                      <span>Loading logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Guard Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                          {log.guard_name[0]}
                        </div>
                        <span className="font-bold text-slate-700">{log.guard_name}</span>
                      </div>
                    </td>

                    {/* Check In */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                          <Calendar size={13} className="text-slate-400" />
                          {formatDate(log.checkin_time)}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                          <MapPin size={12} />
                          {log.checkin_location}
                        </div>
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="p-4">
                      {log.checkout_time ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium text-sm">
                            <Calendar size={13} className="text-slate-400" />
                            {formatDate(log.checkout_time)}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                            <MapPin size={12} />
                            {log.checkout_location}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          Still On Duty
                        </span>
                      )}
                    </td>

                    {/* Duration Helper */}
                    <td className="p-4 text-slate-500 font-mono text-xs">
                      {log.checkout_time ? (
                        <div className="flex items-center gap-2">
                           <Clock size={14} />
                           {/* Simple duration logic could go here */}
                           Shift Completed
                        </div>
                      ) : (
                        <span className="text-blue-500 italic">Active Session</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 italic bg-white">
                    No logs found for this estate.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}