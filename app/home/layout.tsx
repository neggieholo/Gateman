'use client';

import SideBar from '@/app/HomeComponents/SideBar';
import React from 'react'
import { X } from 'lucide-react';
import { useUser } from '../UserContext';


export default function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    
  const { isSidebarOpen, setIsSidebarOpen } = useUser();
  
  function closeAfterNavClick() {
    setIsSidebarOpen(false);
 }

    return (
        <>        
        <div 
            className={`fixed h-screen left-0 z-50 transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
            {isSidebarOpen && (
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className={`absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full md:hidden z-60 transition-opacity duration-300 delay-100 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <X size={24} />
                    </button>
                )}
            <SideBar isOpen={isSidebarOpen} afterNavClick={closeAfterNavClick}/>
        </div>
        {children}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" 
                onClick={() => setIsSidebarOpen(false)} 
            />
        )}
        </>
    );
}
