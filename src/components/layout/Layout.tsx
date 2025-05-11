
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { UserProfile } from "../UserProfile";
import { StoreInitializer } from "../StoreInitializer";

export function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 overflow-x-hidden">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6 mt-12 md:mt-0">
              <h1 className="text-2xl font-bold">ניהול תקציב משפחתי</h1>
              <div className="flex items-center gap-4">
                <UserProfile />
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
      {/* Add StoreInitializer here to initialize the store on mount */}
      <StoreInitializer />
    </SidebarProvider>
  );
}
