import DynamicDashboard from "@/app/HomeComponents/DynamicDashBoard";
import React from "react";
// import MobDashboard from "@/app/HomeComponents/Mobile/MobDashboard";
// import { headers } from "next/headers";
// import { isMobile } from "@/app/utils/ismobile";

const page = async () => {
  // const headersList = await headers();
  // const userAgent = headersList.get("user-agent") || "";
  // const mobileCheck = isMobile(userAgent);
  return <DynamicDashboard />;
};

export default page;
