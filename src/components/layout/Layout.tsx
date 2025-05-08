
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";
import { UserProfile } from "../UserProfile";

export function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-4 overflow-x-hidden">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">ניהול תקציב משפחתי</h1>
              <div className="flex items-center gap-4">
                <UserProfile />
              </div>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
