"use client";

import {
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ArrowUpRight,
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
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { getAdminSearchResults, getAdminSearchTarget } from "@/lib/admin-search";

type AdminUser = {
  id?: string;
  name: string;
  email: string;
  role: string;
  adminRole: string;
};

type AdminNotification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  link: string;
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
  const [adminUser] = useState<AdminUser | null>(() => {
    try {
      const raw = localStorage.getItem("admin_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [sessionInfo] = useState<any>(() => {
    try {
      const raw = localStorage.getItem("admin_security");
      if (raw) {
        const security = JSON.parse(raw);
        return security.currentLogin;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLFormElement>(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("admin_auth_token");
      if (!token) return;

      const res = await fetch("/api/admin/auth/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    const initialFetch = window.setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 120000); // Poll every 2 min
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const displayName = adminUser?.name || "Admin";
  const displayRole = adminUser?.adminRole
    ? adminUser.adminRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Super Admin";
  const initials = getInitials(displayName);
  const adminRole = adminUser?.adminRole || "super_admin";
  const searchResults = useMemo(
    () => getAdminSearchResults(searchQuery, adminRole),
    [adminRole, searchQuery],
  );

  const navigateToSearchTarget = (href: string) => {
    setSearchQuery("");
    setIsSearchOpen(false);
    router.push(href);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = getAdminSearchTarget(searchQuery, adminRole);

    if (!target) {
      toast.error("No matching dashboard page found");
      return;
    }

    navigateToSearchTarget(target);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
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
            <rect x="2" y="2" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.25" />
            <rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
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

        <form
          ref={searchRef}
          onSubmit={handleSearchSubmit}
          className="group relative hidden w-full max-w-md md:block"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          {!searchQuery && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-10 right-4 top-1/2 z-10 -translate-y-1/2 overflow-hidden text-sm font-medium text-slate-400"
            >
              <span className="admin-search-marquee inline-block whitespace-nowrap">
                Search orders by ID or phone, vendors by city, users, riders, issues, settlements, reports...
              </span>
            </div>
          )}
          <Input
            value={searchQuery}
            placeholder=""
            onFocus={() => setIsSearchOpen(true)}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setIsSearchOpen(true);
            }}
            className="h-11 w-full bg-slate-50 pl-10 pr-4 font-medium text-slate-800 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#3E8940]"
          />
          {isSearchOpen && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
              <div className="border-b bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Dashboard Search
              </div>
              <div className="max-h-80 overflow-y-auto p-1.5">
                {searchResults.length > 0 ? (
                  searchResults.map((result) => (
                    <button
                      type="button"
                      key={`${result.href}-${result.title}`}
                      onClick={() => navigateToSearchTarget(result.hrefWithQuery)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-primary/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-800">
                          {result.title}
                        </span>
                        <span className="block truncate text-xs font-medium text-slate-500">
                          {result.section} · {result.matchedKeyword || result.description}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm font-medium text-slate-400">
                    No dashboard page matches this search.
                  </div>
                )}
              </div>
              <div className="border-t bg-white px-4 py-2 text-[11px] font-semibold text-slate-400">
                Press Enter to open the best match.
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative group transition-all duration-200">
              <Bell className={cn("h-5 w-5 text-slate-500 group-hover:text-primary transition-colors", unreadCount > 0 && "animate-pulse")} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px] border-2 border-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden shadow-2xl border-slate-200">
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
              <DropdownMenuLabel className="p-0 font-bold text-slate-700">Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {unreadCount} New
                </span>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <Bell className="h-8 w-8 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-medium">No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem 
                    key={n.id} 
                    className="flex flex-col items-start gap-1 py-4 px-4 border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50/80 transition-colors"
                    onClick={() => router.push(n.link)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-slate-800 text-sm">{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 leading-relaxed">
                      {n.description}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            
            <div className="p-3 bg-white border-t text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs text-primary font-bold hover:bg-primary/5">
                View All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-2 py-6 rounded-xl hover:bg-slate-50 transition-all duration-200">
              <Avatar className="h-9 w-9 border-2 border-slate-100 shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-bold text-slate-800">{displayName}</span>
                <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-md mt-0.5">
                  {displayRole}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-1 shadow-2xl border-slate-200">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">My Account</DropdownMenuLabel>
            {sessionInfo && (
              <div className="px-3 pb-3 pt-1">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase">
                    <span>Current Session</span>
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  </div>
                  <div className="text-xs text-slate-700 font-medium break-all">
                    <span className="text-slate-400 mr-1">IP:</span> {sessionInfo.ipAddress || 'Unknown IP'}
                  </div>
                  <div className="text-xs text-slate-700 font-medium">
                    <span className="text-slate-400 mr-1">Loc:</span> {sessionInfo.locationLabel || 'Unknown Location'}
                  </div>
                </div>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => adminUser?.id && router.push(`/users/${adminUser.id}`)} className="cursor-pointer py-2.5 rounded-lg flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <User className="w-4 h-4 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="font-semibold text-slate-700">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/settings")} className="cursor-pointer py-2.5 rounded-lg flex items-center gap-2 group">
               <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Settings className="w-4 h-4 text-slate-400 group-hover:text-primary" />
              </div>
              <span className="font-semibold text-slate-700">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 cursor-pointer py-2.5 rounded-lg flex items-center gap-2 group hover:bg-red-50"
              onClick={() => {
                localStorage.removeItem("admin_auth_token");
                localStorage.removeItem("admin_user");
                localStorage.removeItem("admin_permissions");
                localStorage.removeItem("admin_security");
                toast.success("Logged out successfully");
                router.push("/login");
              }}
            >
               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <LogOut className="w-4 h-4 text-red-400" />
              </div>
              <span className="font-bold">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
