import { headers } from "next/headers";
import { isMobile } from "@/app/utils/ismobile";
import HomeNavbar from "@/app/HomeComponents/HomeNavbar";
import MobHomeNavbar from "@/app/HomeComponents/Mobile/MobHomeNavBar";
import EstateSelector from "@/app/HomeComponents/EstateSelector";
import SideBar from "@/app/HomeComponents/SideBar";

export default async function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";
  const mobileCheck = isMobile(userAgent);

  return (
    <>
      {!mobileCheck ? (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
          <SideBar />
          <div className="flex-1 flex flex-col h-full">
            <div className="h-24">
              <HomeNavbar />
            </div>
            <EstateSelector />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex flex-col relative bg-white">
          <MobHomeNavbar />
          <EstateSelector />
          <main className="flex-1 overflow-y-auto space-y-5 pb-24 p-4">
            {children}
          </main>
          {/* <MobBottomNav /> */}
        </div>
      )}
    </>
  );
}
