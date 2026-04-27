"use client";

import {
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/dashboard/sidebar-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

type AdminUser = {
  name: string;
  email: string;
  role: string;
  adminRole: string;
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function AdminHeader() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      if (raw) setAdminUser(JSON.parse(raw));
    } catch {
      // ignore parse errors
    }
  }, []);

  const displayName = adminUser?.name || "Admin";
  const displayRole = adminUser?.adminRole
    ? adminUser.adminRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Super Admin";
  const initials = getInitials(displayName);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 shadow-sm transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600 active:scale-95"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Left panel stripe */}
            <rect x="2" y="2" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.25" />
            {/* Right panel border outline */}
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
            {/* Chevron arrow — flips direction */}
            {isCollapsed ? (
              <path
                d="M7.5 5.5L10 8L7.5 10.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M9.5 5.5L7 8L9.5 10.5"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by ID, Phone, Vendor, City..."
            className="w-80 pl-10 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-500" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">New vendor application</span>
              <span className="text-xs text-slate-500">
                Clean Express wants to join
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Order issue reported</span>
              <span className="text-xs text-slate-500">
                ORD-8291: Customer No-Show
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Low vendor availability</span>
              <span className="text-xs text-slate-500">
                Downtown area has 2 active vendors
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-slate-500">{displayRole}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onClick={() => {
                localStorage.removeItem("admin_auth_token");
                toast.success("Logged out successfully");
                router.push("/login");
              }}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
