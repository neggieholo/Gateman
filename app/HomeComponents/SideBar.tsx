/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useMemo, useState } from "react";
import {
  Home,
  ShieldCheck,
  MessageSquare,
  Calendar,
  Users,
  ChevronDown,
  LogOut,
  FileText,
  Briefcase,
  User,
  Lock,
} from "lucide-react";
import { ViewState } from "../services/types";
import { useUser } from "../UserContext";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { postLogout } from "../services/apis";
import toast from "react-hot-toast";

interface SideBarProps {
  isOpen?: boolean;
  afterNavClick?: () => void;
}

function defaultAfterNavClick() {
  console.log("");
}

export default function SideBar({
  isOpen = true,
  afterNavClick = defaultAfterNavClick,
}: SideBarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, setUser, socket, contextEstateId } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const estates = useMemo(() => user?.estates || [], [user?.estates]);

  // Derive active estate object based on contextEstateId
  const activeEstate = useMemo(() => {
    console.log("UserContext EstateId:", contextEstateId);
    return (
      estates.find((e: any) => e.id === contextEstateId) || estates[0] || null
    );
  }, [estates, contextEstateId]);

  const isModuleEnabled = (moduleKey: string): boolean => {
    if (!activeEstate?.plan) return false;
    if (activeEstate.plan.is_trial) return true;
    return activeEstate.plan.selected_add_ons?.includes(moduleKey) ?? false;
  };

  const handleLogout = async () => {
    if (socket) {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    }
    await postLogout();
    setUser(null);
    localStorage.removeItem("rememberMe");
    sessionStorage.setItem("loggedOut", "true");
    toast.dismiss();
    router.push("/");
  };

  const navItems = [
    {
      id: ViewState.DASHBOARD,
      label: "Home",
      icon: Home,
      url: "/home/dashboard",
    },
    {
      id: ViewState.PAYMENT_APPROVALS,
      label: "Payments",
      icon: FileText,
      url: "/home/payments",
      disabled: !isModuleEnabled("payments"),
    },
    {
      id: ViewState.ACCESS,
      label: "Security",
      icon: ShieldCheck,
      url: "/home/security",
      disabled: !isModuleEnabled("security"),
    },
    {
      id: ViewState.FORUM,
      label: "Community",
      icon: MessageSquare,
      url: "/home/community",
      disabled: !isModuleEnabled("community"),
    },
    {
      id: ViewState.EVENTS,
      label: "Bookings",
      icon: Calendar,
      url: "/home/bookings",
      disabled: !isModuleEnabled("facility_bookings"),
    },
    {
      id: ViewState.RESIDENTS,
      label: "Residents",
      icon: Users,
      url: "/home/tenantmanagement",
    },
    // {
    //   id: ViewState.REQUESTS,
    //   label: "Requests",
    //   icon: Inbox,
    //   url: "/home/joinrequestpage",
    // },
    {
      id: ViewState.SERVICES,
      label: "Services",
      icon: Briefcase,
      url: "/home/services",
      disabled: !isModuleEnabled("services_dispatch"),
    },
    {
      id: ViewState.USERS,
      label: "Users",
      icon: User,
      url: "/home/users",
    },
  ];

  const getRoleBadgeColor = () => {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  };

  return (
    <>
      <aside
        className={`${isOpen ? "" : "hidden"} flex flex-col w-60 p-4 bg-gm-navy h-screen border-r border-slate-100 overflow-y-auto z-50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]`}
      >
        <div className="p-8 flex items-center space-x-3">
          <div className="relative w-full h-14 backdrop-blur-md rounded-xl flex items-center justify-center overflow-hidden">
            <Image
              src="/gmlogo.jpg"
              alt="Gatenan Logo"
              fill
              className="object-contain p-1"
            />
          </div>
        </div>

        <div className="flex-1 px-6 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.url;
            const isDisabled = item.disabled;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isDisabled) {
                    toast.error(
                      "This module is not included in your current plan.",
                    );
                    return;
                  }
                  afterNavClick();
                  router.push(item.url);
                }}
                className={`flex items-center space-x-2 w-full px-3 py-3.5 rounded-2xl transition-all duration-200 group relative ${
                  isDisabled
                    ? "opacity-45 cursor-not-allowed text-white/40 hover:bg-transparent"
                    : isActive
                      ? "bg-white text-primary font-semibold shadow-sm"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon
                  size={22}
                  className={`transition-colors ${
                    isActive && !isDisabled ? "text-primary" : "text-white"
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={`${
                    isActive && !isDisabled ? "text-primary" : "text-white"
                  } font-oswald`}
                >
                  {item.label}
                </span>

                {/* Active Indicator */}
                {isActive && !isDisabled && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}

                {/* Disabled Indicator */}
                {isDisabled && (
                  <Lock size={14} className="ml-auto text-white/40 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* User Profile / Role Switcher */}
        <div className="p-6 border-t border-slate-50 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 px-3 py-3 w-full rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-slate-100 group"
          >
            <div className="relative text-white group-hover:text-indigo-700 transition-colors"></div>
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-xs font-bold text-white truncate w-full text-left">
                {user?.name || "Admin"}
              </span>
              <div className="flex items-center mt-0.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${getRoleBadgeColor()}`}
                >
                  Admin
                </span>
              </div>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
            />
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
}
