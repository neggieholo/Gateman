'use client';

import React, { useState } from 'react';
import { Home, Zap, ShieldCheck, MessageSquare, Calendar, Users, ChevronDown, LogOut, Inbox, FileText, User2} from 'lucide-react';
import { ViewState } from '../types';
import { useUser } from '../UserContext';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';


interface SideBarProps {
    isOpen?: boolean;
    afterNavClick?: () => void;
}

function defaultAfterNavClick() {
  console.log("");
}

export default function SideBar ({isOpen = true, afterNavClick = defaultAfterNavClick }: SideBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const {user, setUser} = useUser();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleLogout = () => {
      setUser(null);
      router.push('/');
  }

   const navItems = [
  { id: ViewState.DASHBOARD, label: 'Home', icon: Home, url: '/home/dashboard' },
  { id: ViewState.UTILITIES, label: 'Bills', icon: Zap, url: '/home/utilities' },
  { id: ViewState.INVOICES, label: 'Invoices', icon: FileText, url: '/home/invoices' },
  { id: ViewState.ACCESS, label: 'Security', icon: ShieldCheck, url: '/home/accesscontrol' },
  { id: ViewState.FORUM, label: 'Community', icon: MessageSquare, url: '/home/forum' },
  { id: ViewState.EVENTS, label: 'Events', icon: Calendar, url: '/home/events' },
  { id: ViewState.USERS, label: 'Residents', icon: Users, url: '/home/tenantmanagement' },
  { id: ViewState.REQUESTS, label: 'Requests', icon: Inbox, url: '/home/joinrequestpage' },
];

  const getRoleBadgeColor = () => {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  };

  return (
    <>
      <aside className={`${isOpen ? '' : 'hidden'} flex flex-col w-fit p-4 bg-primary h-screen border-r border-slate-100 z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]`}>
        <div className="p-8 flex items-center space-x-3">
          <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 overflow-hidden">
            <Image
              src="/gateman_bg.png" // Added leading slash for public folder
              alt="GateMan Logo"
              fill
              className="object-cover p-1 bg-white" // Ensures logo doesn't touch the borders
            />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-white">Gateman</span>
        </div>
        
        <div className="flex-1 px-6 py-6 space-y-2">
          {navItems.map((item) => {
            // Check if the current URL matches the item's URL
            const isActive = pathname === item.url;

            return (
              <button
                key={item.id}
                onClick={() => { afterNavClick(); router.push(item.url) }}
                className={`flex items-center space-x-3 w-full px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-white text-primary font-semibold shadow-sm' // White bg, Primary text
                    : 'text-white/70 hover:bg-white/10 hover:text-white' // Ghost white on primary bg
                }`}
              >
                <item.icon 
                  size={22} 
                  className={`transition-colors ${isActive ? 'text-primary' : 'text-white'}`}
                  strokeWidth={isActive ? 2.5 : 2} 
                />
                <span className={isActive ? 'text-primary' : 'text-white'}>{item.label}</span>
                
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
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
              <span className="text-sm font-bold text-slate-800 truncate w-full text-left group-hover:text-indigo-700 transition-colors">{user?.name}</span>
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
              <div className="p-1 border-t border-slate-100 mt-1">
                  <button 
                      onClick={handleLogout}
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
