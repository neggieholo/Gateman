
import React from 'react';
import { Bell, QrCode, Users, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';


export default function Dashboard () {
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });


    return (
      <div className="space-y-8 pb-24 md:pb-8">
         <div className="flex justify-between items-end">
          <div>
             <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{currentDate}</div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
          </div>
          <button className="relative p-3 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:shadow-md transition-all">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
              <div>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Occupancy</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">94%</div>
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">+2%</div>
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">142 / 150 Units Occupied</div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><QrCode size={24} /></div>
              <div>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Passes</span>
              </div>
            </div>
             <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">28</div>
                <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">Valid</div>
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">Currently active visitor codes</div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><AlertTriangle size={24} /></div>
              <div>
                 <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Alerts</span>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
                <div className="text-4xl font-bold text-slate-900 tracking-tight">3</div>
                <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">New</div>
            </div>
            <div className="mt-2 text-sm text-slate-500 font-medium">Open maintenance requests</div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-6">
           <button 
            //  onClick={() => setView(ViewState.ACCESS)}
             className="group relative overflow-hidden bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-start justify-between min-h-[160px] hover:scale-[1.02] transition-transform duration-300"
           >
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-32 blur-3xl group-hover:bg-white/10 transition-colors"></div>
             
             <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-4 border border-white/10">
               <ShieldCheck size={28} />
             </div>
             <div className="text-left relative z-10">
               <span className="block font-bold text-xl mb-1">Security Log</span>
               <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Monitor all gate activity</span>
             </div>
           </button>

           <button 
            //  onClick={() => setView(ViewState.UTILITIES)}
             className="group bg-white text-slate-900 border border-slate-200 p-8 rounded-3xl shadow-sm flex flex-col items-start justify-between min-h-40 hover:shadow-xl hover:border-slate-300 transition-all duration-300"
           >
             <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
               <TrendingUp size={28} />
             </div>
             <div className="text-left">
               <span className="block font-bold text-xl mb-1">Billing Reports</span>
               <span className="text-sm text-slate-500">Manage unit utilities</span>
             </div>
           </button>
        </div>
      </div>
    );
  
  };