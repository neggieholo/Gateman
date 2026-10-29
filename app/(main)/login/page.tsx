import React from 'react'
import { headers } from "next/headers";
import MobileAuth from '@/app/LandingPageComponents/MobileAuth';
import Auth from '@/app/LandingPageComponents/Auth';
import { isMobile } from '@/app/utils/ismobile';

const page = async () => {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const mobileCheck = isMobile(userAgent);

  return (
    mobileCheck ? <MobileAuth /> : <Auth />
  )
}

export default page