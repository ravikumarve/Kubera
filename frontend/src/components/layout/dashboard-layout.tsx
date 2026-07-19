"use client";

import { useUIStore } from "@/stores/ui-store";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform lg:relative lg:translate-x-0 hidden lg:block">
        <Sidebar />
      </aside>
      {sidebarOpen && (
        <>
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r bg-background lg:hidden">
            <Sidebar />
          </aside>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={toggleSidebar}
          />
        </>
      )}
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
