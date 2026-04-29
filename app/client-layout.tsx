"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
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

import { usePathname, useRouter } from "next/navigation";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/login";

  // Show loading skeleton during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex">
        {!isLoginPage && <div className="hidden md:block w-64 h-screen bg-white border-r shrink-0" />}
        <div className="flex-1 flex flex-col min-w-0">
          {!isLoginPage && <div className="h-16 border-b bg-white shrink-0" />}
          <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-white">
        <main className="min-h-screen flex items-center justify-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50 relative">
        {/* Fixed Sidebar */}
        <div
          className={cn(
            "fixed top-0 left-0 h-screen z-50 transition-all duration-300 shadow-xl md:shadow-none bg-white",
            isCollapsed 
              ? "-translate-x-full md:translate-x-0 md:w-16" 
              : "translate-x-0 w-64",
          )}
        >
          <AdminSidebar />
        </div>

        {/* Mobile Overlay */}
        {!isCollapsed && !isLoginPage && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={toggleSidebar}
          />
        )}

        {/* Main Content with margin for sidebar */}
        <div
          className={cn(
            "flex h-screen flex-col transition-all duration-300",
            isCollapsed ? "md:ml-16" : "md:ml-64",
            "ml-0"
          )}
        >
          <AdminHeader />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3 md:p-5">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_auth_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const userStr = localStorage.getItem("admin_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = user.adminRole;

        // Finance Admin Route Protection
        if (role === "finance_admin") {
          if (pathname.startsWith("/users") || pathname.startsWith("/customer") || pathname.startsWith("/vendor") || pathname.startsWith("/rider") || pathname.startsWith("/orders") || pathname.startsWith("/issues") || pathname.startsWith("/master") || pathname.startsWith("/app")) {
            router.push("/finance/settlements");
            return;
          }
        }

        // Operations Admin Route Protection
        if (role === "operations_admin") {
          if (pathname.startsWith("/finance") || pathname.startsWith("/master") || pathname.startsWith("/app")) {
            router.push("/");
            return;
          }
        }
      }
    } catch (e) {
      console.error(e);
    }

    setAuthorized(true);
  }, [router, pathname]);

  if (!authorized) return null;

  return <>{children}</>;
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Toaster richColors position="top-right" />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}
