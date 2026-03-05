
import React, { useState } from 'react';
import { Visitor, User } from '../types';
import { Plus, X, Share2, Clock, User as UserIcon, Search } from 'lucide-react';

interface AccessControlProps {
  currentUser: User;
}

const MOCK_ADMIN_VISITORS: Visitor[] = [
  { id: '1', name: 'Uber Eats', type: 'Delivery', accessCode: '8842', date: '2023-11-02 19:00', status: 'Active', unit: '402' },
  { id: '2', name: 'Sarah Mom', type: 'Guest', accessCode: '9921', date: '2023-11-03 14:00', status: 'Active', unit: '402' },
  { id: '3', name: 'Technician', type: 'Service', accessCode: '3321', date: '2023-11-03 11:30', status: 'Active', unit: '105' },
  { id: '4', name: 'Furniture Delivery', type: 'Delivery', accessCode: '5566', date: '2023-11-03 12:00', status: 'Active', unit: '808' },
];

export const AccessControl: React.FC<AccessControlProps> = ({ }) => {
  const isAdmin = true;

  const [visitors, setVisitors] = useState<Visitor[]>(
    isAdmin 
    ? MOCK_ADMIN_VISITORS 
    : [
      { id: '1', name: 'Uber Eats', type: 'Delivery', accessCode: '8842', date: '2023-11-02 19:00', status: 'Active' },
      { id: '2', name: 'Sarah Mom', type: 'Guest', accessCode: '9921', date: '2023-11-03 14:00', status: 'Active' },
      { id: '3', name: 'Plumber', type: 'Service', accessCode: '1122', date: '2023-10-30 09:00', status: 'Used' },
    ]
  );

  const [showModal, setShowModal] = useState(false);
  const [newVisitorName, setNewVisitorName] = useState('');
  const [newVisitorType, setNewVisitorType] = useState<'Guest' | 'Delivery' | 'Service'>('Guest');

  const handleCreatePass = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newVisitor: Visitor = {
      id: Date.now().toString(),
      name: newVisitorName,
      type: newVisitorType,
      accessCode: code,
      date: new Date().toISOString(),
      status: 'Active'
    };
    setVisitors([newVisitor, ...visitors]);
    setShowModal(false);
    setNewVisitorName('');
  };

  const getQrUrl = (code: string) => `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${code}&bgcolor=ffffff`;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{isAdmin ? 'Security Log' : 'Access Control'}</h1>
          <p className="text-slate-500 font-medium mt-1">{isAdmin ? 'Monitor all estate entries' : 'Manage visitors and gate passes'}</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white p-3 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-105 transition-all"
          >
            <Plus size={24} />
          </button>
        )}
      </header>

      {isAdmin && (
        <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input type="text" placeholder="Search code, name, or unit..." className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm transition-all text-slate-700" />
            </div>
            <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm">Filter</button>
        </div>
      )}

      {/* Active Passes Grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
            Active Passes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visitors.filter(v => v.status === 'Active').map((visitor) => (
            <div key={visitor.id} className="relative group perspective-1000">
                {/* Ticket Style Card */}
                <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    {/* Top Section with Gradient */}
                    <div className="bg-linear-to-br from-violet-600 to-fuchsia-600 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <div className="relative z-10 flex justify-between items-start">
                             <div>
                                <span className="inline-block px-2 py-1 rounded-lg bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
                                    {visitor.type}
                                </span>
                                <h3 className="text-xl font-bold truncate pr-4">{visitor.name}</h3>
                                {isAdmin && <div className="text-xs font-medium text-purple-200 mt-1">UNIT {visitor.unit}</div>}
                             </div>
                             <div className="bg-white p-1.5 rounded-xl shadow-lg">
                                <img src={getQrUrl(visitor.accessCode)} alt="QR" className="w-14 h-14" />
                             </div>
                        </div>
                    </div>

                    {/* Cutout Effect */}
                    <div className="relative h-6 bg-white flex items-center justify-between">
                        <div className="w-4 h-8 bg-[#f8fafc] rounded-r-full -ml-2"></div>
                        <div className="border-t-2 border-dashed border-slate-100 w-full mx-4"></div>
                        <div className="w-4 h-8 bg-[#f8fafc] rounded-l-full -mr-2"></div>
                    </div>

                    {/* Bottom Section */}
                    <div className="px-6 pb-6 pt-2 bg-white">
                         <div className="flex flex-col items-center justify-center py-2">
                             <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">Entry Code</span>
                             <div className="text-4xl font-mono font-bold text-slate-800 tracking-[0.25em]">{visitor.accessCode}</div>
                         </div>
                         
                         <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-medium bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center">
                                <Clock size={14} className="mr-1.5 text-violet-500" />
                                Expires {new Date(new Date(visitor.date).getTime() + 24*60*60*1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            
                            <div className="flex gap-2">
                                {!isAdmin ? (
                                    <button className="text-indigo-600 hover:text-indigo-800 transition-colors">
                                        <Share2 size={16} />
                                    </button>
                                ) : (
                                    <button className="text-rose-500 hover:text-rose-700">REVOKE</button>
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
            ))}
        </div>
      </div>

      <div className="pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">History Log</h2>
        <div className="bg-white rounded-4xl shadow-sm border border-slate-100 overflow-hidden">
            {visitors.filter(v => v.status !== 'Active').map((visitor) => (
            <div key={visitor.id} className="p-5 border-b border-slate-50 last:border-0 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                    <UserIcon size={22} />
                </div>
                <div>
                    <div className="font-bold text-slate-900">{visitor.name} {isAdmin && <span className="text-slate-400 font-normal text-sm ml-1">(Unit {visitor.unit})</span>}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{visitor.type} • {new Date(visitor.date).toLocaleDateString()}</div>
                </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 uppercase tracking-wide">
                {visitor.status}
                </span>
            </div>
            ))}
            {visitors.filter(v => v.status !== 'Active').length === 0 && (
                <div className="p-10 text-center text-slate-400 text-sm font-medium">No history available</div>
            )}
        </div>
      </div>

      {/* New Visitor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all animate-scale-up">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">New Visitor Pass</h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Visitor Name</label>
                <input
                  type="text"
                  value={newVisitorName}
                  onChange={(e) => setNewVisitorName(e.target.value)}
                  className="w-full px-5 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800"
                  placeholder="e.g., John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Visitor Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Guest', 'Delivery', 'Service'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewVisitorType(type)}
                      className={`py-3 px-3 rounded-xl text-sm font-bold transition-all border ${
                        newVisitorType === type
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreatePass}
                disabled={!newVisitorName}
                className="w-full mt-2 bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95"
              >
                Generate Pass
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
