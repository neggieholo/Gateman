/* eslint-disable @typescript-eslint/no-explicit-any */
// app/home/LayoutContent.tsx
"use client";

import React, { useEffect, useMemo } from "react";
import { useUser } from "@/app/UserContext";
import { checkSession } from "@/app/services/apis";
import SideBar from "./SideBar";
import HomeNavbar from "./HomeNavbar";
import MobHomeNavbar from "./Mobile/MobHomeNavBar";
import EstateSelector from "./EstateSelector";
import { Loader2, ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";

interface LayoutContentProps {
  children: React.ReactNode;
  mobileCheck: boolean;
}

export default function LayoutContent({
  children,
  mobileCheck,
}: LayoutContentProps) {
  const pathname = usePathname();
  const {
    user,
    contextEstateId,
    setUser,
    isLoading,
    setIsLoading,
    setContextEstateId,
  } = useUser();

  // 1. Initial Session Check on Refresh / Direct Navigation
  useEffect(() => {
    async function initSession() {
      try {
        // setIsLoading(true);
        const res = await checkSession();

        if (!res.success || res?.user?.role !== "ADMIN") {
          console.warn("Session invalid, redirecting...");
          window.location.replace("/");
        } else {
          setUser(res.user);
          if (res.user?.estate_ids && res.user.estate_ids.length > 0) {
            setContextEstateId(res.user.estate_ids[0]);
          }
        }
      } catch (err) {
        console.error("Session check failed:", err);
        window.location.replace("/");
      } finally {
        setIsLoading(false);
      }
    }

    initSession();
  }, [setUser, setIsLoading, setContextEstateId]);

  const activeEstate = useMemo(() => {
    const estates = user?.estates || [];
    return (
      estates.find((e: any) => e.id === contextEstateId) || estates[0] || null
    );
  }, [user?.estates, contextEstateId]);

  const isModuleEnabledForRoute = (route: string): boolean => {
    if (!activeEstate?.plan) return true;
    if (activeEstate.plan.is_trial) return true;

    const routeModuleMap: Record<string, string> = {
      "/home/payments": "payments",
      "/home/security": "security",
      "/home/community": "community",
      "/home/bookings": "facility_bookings",
      "/home/services": "services_dispatch",
    };

    const moduleKey = routeModuleMap[route];
    if (!moduleKey) return true;

    return activeEstate.plan.selected_add_ons?.includes(moduleKey) ?? false;
  };

  const moduleEnabled = isModuleEnabledForRoute(pathname);

  const DisabledModuleMessage = (
    <div className="flex h-full min-h-100 w-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-4 border border-amber-200">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">Module Not Included</h3>
      <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
        This feature is not included in your active subscription plan. Please
        contact your estate administrator or upgrade your subscription to gain
        access.
      </p>
    </div>
  );

  // 2. Global Loading View: Blocks children from evaluating permissions early
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">
            Authenticating session...
          </p>
        </div>
      </div>
    );
  }

  // 3. Render full UI once user & session state settle
  return (
    <>
      {!mobileCheck ? (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
          <SideBar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
            <div className="h-24">
              <HomeNavbar />
            </div>
            <EstateSelector />
            <main className="flex-1 overflow-y-auto overflow-x-auto">
              {moduleEnabled ? children : DisabledModuleMessage}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col relative bg-white">
          <MobHomeNavbar />
          <EstateSelector />
          <main className="flex-1 overflow-y-auto space-y-5 pb-24 p-4">
            {moduleEnabled ? children : DisabledModuleMessage}
          </main>
        </div>
      )}
    </>
  );
}
