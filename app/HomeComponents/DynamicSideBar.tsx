"use client";

import React, { useEffect } from "react";
import SideBar from "@/app/HomeComponents/SideBar";
import SecuritySideBar from "@/app/HomeComponents/SecuritySideBar";
import { useUser } from "@/app/UserContext";

export default function DynamicSideBar() {
  const { plan } = useUser();

  useEffect(() => {
    console.log("Plan:", plan);
  }, [plan]);
  
  if (!plan) {
    return <div className="w-64 bg-slate-900 animate-pulse h-screen" />;
  }

  // Render the correct sidebar conditionally
  return plan === "security_only" ? <SecuritySideBar /> : <SideBar />;
}
