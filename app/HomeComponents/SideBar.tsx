
import React, { useState } from 'react';
import { Home, Zap, ShieldCheck, MessageSquare, Calendar, Users, ChevronDown, LogOut, Inbox, FileText, User2} from 'lucide-react';
import { ViewState , User} from '../types';


export default function SideBar () {
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Define nav items based on roles
  const getNavItems = () => {
    const items = [
      { id: ViewState.DASHBOARD, label: 'Home', icon: Home },
      // { id: ViewState.UTILITIES, label: currentUser.role === 'resident' ? 'Bills' : 'Billing', icon: Zap },
      { id: ViewState.UTILITIES, label: 'Bills', icon: Zap },
      // { id: ViewState.ACCESS, label: currentUser.role === 'resident' ? 'Access' : 'Security', icon: ShieldCheck },
      { id: ViewState.INVOICES, label: 'Invoices', icon: FileText },
      { id: ViewState.ACCESS, label: 'Security', icon: ShieldCheck },
      { id: ViewState.FORUM, label: 'Community', icon: MessageSquare },
      { id: ViewState.EVENTS, label: 'Events', icon: Calendar },
      { id: ViewState.USERS, label: 'Residents', icon: Users },
      { id: ViewState.REQUESTS, label: 'Requests', icon: Inbox},
    ];

    return items;
  };

  const navItems = getNavItems();

  const getRoleBadgeColor = () => {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  return (
    <>
      {/* Mobile Bottom Navigation with Glassmorphism */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 md:hidden z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-20 pb-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                currentView === item.id ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-colors ${currentView === item.id ? 'bg-indigo-50' : 'bg-transparent'}`}>
                 <item.icon size={22} strokeWidth={currentView === item.id ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold ${currentView === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </div> */}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white h-screen border-r border-slate-100 z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        <div className="p-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-linear-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 ring-2 ring-indigo-50">
            <Home className="text-white" size={22} />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-800 to-slate-600 tracking-tight">EstateMate</span>
        </div>
        
        <div className="flex-1 px-6 py-6 space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-4">Menu</div>
          {navItems.map((item) => (
            <button
              key={item.id}
              // onClick={() => setView(item.id)}
              className={`flex items-center space-x-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                currentView === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm ring-1 ring-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon 
                size={22} 
                className={`transition-colors ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                strokeWidth={currentView === item.id ? 2.5 : 2} 
              />
              <span>{item.label}</span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* User Profile / Role Switcher */}
        <div className="p-6 border-t border-slate-50 relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-3 w-full rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="relative">
               <User2/>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-sm font-bold text-slate-800 truncate w-full text-left group-hover:text-indigo-700 transition-colors">{currentUser.name}</span>
              <div className="flex items-center mt-0.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${getRoleBadgeColor()}`}>
                  Admin
                </span>
              </div>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Role Switcher Menu */}
          {showUserMenu && (
            <div className="absolute bottom-full left-6 right-6 mb-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in z-50 ring-1 ring-black/5">
              {/* <div className="p-3 bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                Switch Role (Demo)
              </div> */}
              {/* <div className="p-1">
                {(['resident', 'admin', 'superadmin'] as Role[]).map((role) => (
                    <button 
                        key={role}
                        onClick={() => { onSwitchUser(role); setShowUserMenu(false); }} 
                        className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center justify-between transition-colors ${currentUser.role === role ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-600'}`}
                    >
                        <span className="capitalize">{role}</span>
                        {currentUser.role === role && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>}
                    </button>
                ))}
              </div> */}
              <div className="p-1 border-t border-slate-100 mt-1">
                  <button 
                      onClick={onLogout}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-2 text-rose-500 hover:bg-rose-50 transition-colors font-medium"
                  >
                      <LogOut size={16} />
                      Sign Out
                  </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
