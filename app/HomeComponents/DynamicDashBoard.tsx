'use client'

import React from "react";
import { useUser } from "../UserContext";
import EstateDashboard from "./EstateDashboard";
import SecurityDashboard from "./SecurityDashboard";

const DynamicDashboard = () => {
  const { user } = useUser();
  const plan = user?.plan;

  return plan === "security_only" ? <SecurityDashboard />: <EstateDashboard />;
};

export default DynamicDashboard;
