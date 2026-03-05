import { headers } from "next/headers";
// import { isMobile } from "../utils/ismobile";
import SideBar from "../HomeComponents/SideBar";
import HomeNavbar from "../HomeComponents/HomeNavbar";
// import MobBottomNav from "../HomeComponents/MobBottomNav";

export default async function HomeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // const headersList = await headers();
    // const userAgent = headersList.get("user-agent") || "";
    // const mobileCheck = isMobile(userAgent);

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
            <SideBar />
            <div className="flex-1 flex flex-col h-full">
                <div className="h-24">
                    <HomeNavbar />
                </div>
                <main className="p-6 flex-1">{children}</main>
            </div>
        </div>
    );
}
