"use client";

import React, { useState } from "react";
import {
  Home,
  Zap,
  ShieldCheck,
  MessageSquare,
  Calendar,
  Users,
  ChevronDown,
  LogOut,
  Inbox,
  FileText,
  User2,
} from "lucide-react";
import { ViewState } from "@/app/services/types";
import { useUser } from "@/app/UserContext";
import { useRouter } from "next/navigation";

export default function MobBottomNav() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, setUser } = useUser();
  const [currentView, setCurrentView] = useState<string>("");
  const router = useRouter();

  const handleLogout = () => {
    setUser(null);
  };

  const navItems = [
    {
      id: ViewState.DASHBOARD,
      label: "Home",
      icon: Home,
      url: "/home/dashboard",
    },
    {
      id: ViewState.UTILITIES,
      label: "Bills",
      icon: Zap,
      url: "/home/utilities",
    },
    {
      id: ViewState.INVOICES,
      label: "Invoices",
      icon: FileText,
      url: "/home/invoices",
    },
    {
      id: ViewState.ACCESS,
      label: "Security",
      icon: ShieldCheck,
      url: "/home/accesscontrol",
    },
    {
      id: ViewState.FORUM,
      label: "Community",
      icon: MessageSquare,
      url: "/home/forum",
    },
    {
      id: ViewState.EVENTS,
      label: "Events",
      icon: Calendar,
      url: "/home/events",
    },
    {
      id: ViewState.USERS,
      label: "Residents",
      icon: Users,
      url: "/home/tenantmanagement",
    },
    {
      id: ViewState.REQUESTS,
      label: "Requests",
      icon: Inbox,
      url: "/home/joinrequestpage",
    },
  ];

  const getRoleBadgeColor = () => {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 md:hidden z-50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20 pb-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentView(item.id);
              router.push(item.url);
            }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
              currentView === item.id
                ? "text-indigo-600 scale-105"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-colors ${currentView === item.id ? "bg-indigo-50" : "bg-transparent"}`}
            >
              <item.icon
                size={22}
                strokeWidth={currentView === item.id ? 2.5 : 2}
              />
            </div>
            <span
              className={`text-[10px] font-bold ${currentView === item.id ? "opacity-100" : "opacity-70"}`}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
