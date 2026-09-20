// app/home/LayoutContent.tsx
"use client";

import React, { useEffect } from "react";
import { useUser } from "@/app/UserContext";
import { checkSession } from "@/app/services/apis";
import SideBar from "./SideBar";
import HomeNavbar from "./HomeNavbar";
import MobHomeNavbar from "./Mobile/MobHomeNavBar";
import EstateSelector from "./EstateSelector";
import { Loader2 } from "lucide-react";

interface LayoutContentProps {
  children: React.ReactNode;
  mobileCheck: boolean;
}

export default function LayoutContent({
  children,
  mobileCheck,
}: LayoutContentProps) {
  const {
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
              {children}
            </main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col relative bg-white">
          <MobHomeNavbar />
          <EstateSelector />
          <main className="flex-1 overflow-y-auto space-y-5 pb-24 p-4">
            {children}
          </main>
        </div>
      )}
    </>
  );
}
