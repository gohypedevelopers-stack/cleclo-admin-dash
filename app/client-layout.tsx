"use client";

import type React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "@/components/dashboard/sidebar-provider";
import { cn } from "@/lib/utils";

// Dynamic import to prevent hydration mismatch with Radix UI components
const AdminHeader = dynamic(
  () =>
    import("@/components/admin/admin-header").then((mod) => mod.AdminHeader),
  { ssr: false },
);

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        <div className="w-64 h-screen bg-white border-r" />
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b bg-white" />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen z-40 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <AdminSidebar />
      </div>

      {/* Main Content with margin for sidebar */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          isCollapsed ? "ml-16" : "ml-64",
        )}
      >
        <AdminHeader />
        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
