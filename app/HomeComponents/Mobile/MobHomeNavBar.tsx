'use client';

import React, { useEffect, useState } from 'react';
import { useUser } from '@/app/UserContext';
import { useRouter } from 'next/navigation';
import { checkSession } from '@/app/services/apis';
// import Link from 'next/link';
import { Menu } from 'lucide-react';


export default function MobHomeNavbar() {
  const { user } = useUser();
  const router = useRouter();
  const { setIsSidebarOpen } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    function checkUserAndMount() {
      if (user) {
        setMounted(true);
      }
    }
    checkUserAndMount();
  }, [user]);

  
  // useEffect(() => {
  //   async function cSessionCheck() {
  //     try {
  //       const res = await checkSession();

  //       // Changed res.ok to res.success
  //       if (!res.success) {
  //         console.warn('Session invalid, redirecting...');
  //         window.location.replace('/');
  //       } else {
  //         // console.log('Session verified for:', res.user?.firstName);
  //       }
  //     } catch (err) {
  //       console.error('Session check failed:', err);
  //       window.location.replace('/');
  //     }
  //   }

  //   cSessionCheck();
  // }, []); 

  // 2. Prevent rendering dynamic user data until client-side hydration is complete
  // This avoids the "text content does not match" error
  const fullname = mounted ? (user?.name || 'Admin') : '';
  // const displayEmail = mounted ? (user?.email || '') : '';

  return (
    <header
      className="bg-white/80 backdrop-blur-md border-b border-slate-100 flex flex-col items-center justify-between px-2 sticky top-0 z-30 h-fit"
    >
        <div className="flex items-center w-full bg-primary/40 rounded-2xl px-2 text-secondary">
            <h1 className="font-(family-name:--font-inter) text-md text-start font-black text-slate-800 tracking-tight">
                Welcome, <span className="text-primary">{fullname}</span>
            </h1>
        </div>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center w-fit bg-white/40 rounded-2xl text-secondary">
            <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="p-1 text-primary m-2 hover:bg-white/20 rounded-lg transition-colors"
            >
            <Menu size={20} />
            </button>
        </div>
        <div className="flex items-center gap-3 p-2 w-full justify-end">
          <div className="indicator group">
            {/* {badgeCount > 0 && (
              <span className="indicator-item badge badge-primary badge-sm text-white font-bold border-white border-2 scale-110 group-hover:animate-bounce">
                {badgeCount}
              </span>
            )} */}
            <button
              className="btn btn-ghost btn-circle bg-slate-50 hover:bg-primary/10 hover:text-primary transition-all duration-300 shadow-sm border border-slate-100"
              onClick={() => router.push('/home/dashboard')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </div>

          <button
            className="btn btn-ghost btn-circle bg-slate-50 hover:bg-secondary/10 hover:text-secondary transition-all duration-300 shadow-sm border border-slate-100"
            onClick={() => router.push('/home/settings')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
