/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useUser } from "../UserContext";

export default function EstateSelector() {
  const { user, contextEstateId, setContextEstateId } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize estates to fix the React Hook useEffect dependency warning
  const estates = useMemo(() => user?.estates || [], [user?.estates]);

  const activeEstate = useMemo(() => {
    return (
      estates.find((e: any) => e.id === contextEstateId) || estates[0] || null
    );
  }, [estates, contextEstateId]);

  // Auto-set contextEstateId on initial load
  useEffect(() => {
    if (!contextEstateId && estates.length > 0) {
      setContextEstateId(estates[0].id);
    }
  }, [contextEstateId, estates, setContextEstateId]);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!user || estates.length === 1) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 text-xs flex items-center justify-between border-b border-slate-800 relative z-50 select-none">
        {/* Active Estate Title & Indicator */}
        <div className="flex items-center space-x-2 min-w-0 pr-2">
          <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-400 font-medium uppercase tracking-wider text-[10px] shrink-0">
            Estate:
          </span>
          <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm">
            {activeEstate?.estate_name || "No Estate Selected"}
          </span>
        </div>

        {/* Switch Button & Dropdown Container */}
        {estates.length > 1 && (
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              type="button"
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-md transition-colors font-medium text-xs sm:text-[11px] touch-manipulation cursor-pointer border border-slate-700/60"
            >
              <span>Switch</span>
              <svg
                className={`w-3.5 h-3.5 sm:w-3 sm:h-3 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Responsive Scrollable Menu */}
            {isOpen && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 max-h-64 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Your Estates</span>
                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[9px] font-mono">
                    {estates.length}
                  </span>
                </div>

                <div className="py-1">
                  {estates.map((estate: any) => {
                    const isSelected = estate.id === activeEstate?.id;
                    return (
                      <button
                        key={estate.id}
                        type="button"
                        onClick={() => {
                          setContextEstateId(estate.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2.5 sm:py-2 text-xs flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors ${
                          isSelected
                            ? "bg-blue-50/70 font-semibold text-blue-600"
                            : "text-slate-700"
                        }`}
                      >
                        <span className="truncate pr-2">{estate.estate_name}</span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
