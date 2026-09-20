import { headers } from "next/headers";
import { isMobile } from "@/app/utils/ismobile";
import SideBarLayoutContent from "@/app/HomeComponents/SideBarLayoutContent";

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const mobileCheck = isMobile(userAgent);

  return (
    <SideBarLayoutContent mobileCheck={mobileCheck}>
      {children}
    </SideBarLayoutContent>
  );
}
