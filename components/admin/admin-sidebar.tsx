"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/dashboard/sidebar-provider";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Store,
  Wallet,
  ImageIcon,
  Settings,
  Headphones,
  Package,
  CreditCard,
  MessageSquare,
  ChevronDown,
  Bike,
  User,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  MapPin,
  Gift,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: any;
  subItems?: NavItem[];
}

const mainItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Growth & Content Manager",
    href: "/app",
    icon: ImageIcon,
  },
  {
    title: "Service Catalog Manager",
    href: "/master/items",
    icon: Package,
  },
];

const managementItems: NavItem[] = [
  {
    title: "Users",
    href: "/users",
    icon: Users,
    subItems: [
      {
        title: "All",
        href: "/users",
        icon: Users,
      },
      {
        title: "Customer",
        href: "/users?role=customer",
        icon: Users,
      },
      {
        title: "Vendor",
        href: "/vendors",
        icon: Store,
      },
      {
        title: "Rider",
        href: "/riders",
        icon: Bike,
      },
    ],
  },
  {
    title: "Customer",
    href: "/customer",
    icon: User,
  },
  {
    title: "Vendor",
    href: "/vendor",
    icon: Store,
    subItems: [
      {
        title: "All",
        href: "/vendor",
        icon: LayoutDashboard,
      },
      {
        title: "Vendors",
        href: "/vendor/all",
        icon: BarChart3,
      },
      {
        title: "New verification",
        href: "/vendor/verification",
        icon: ShieldCheck,
      },
      {
        title: "Outlets",
        href: "/vendor/outlets",
        icon: MapPin,
      },
      {
        title: "Vendor analytics",
        href: "/vendor/analytics",
        icon: BarChart3,
      },
      {
        title: "Payments",
        href: "/vendor/payments",
        icon: CreditCard,
      },
      {
        title: "Support",
        href: "/vendor/support",
        icon: Headphones,
      },
    ],
  },
  {
    title: "Rider",
    href: "/rider",
    icon: Bike,
    subItems: [
      {
        title: "All",
        href: "/rider",
        icon: LayoutDashboard,
      },
      {
        title: "Riders",
        href: "/riders",
        icon: Users,
      },
      {
        title: "New verification",
        href: "/rider/verification",
        icon: ShieldCheck,
      },
      {
        title: "Rider analytics",
        href: "/rider/analytics",
        icon: BarChart3,
      },
      {
        title: "Payments",
        href: "/rider/payments",
        icon: CreditCard,
      },
      {
        title: "Support",
        href: "/rider/support",
        icon: Headphones,
      },
    ],
  },
  {
    title: "Location Settings",
    href: "/master/locations",
    icon: MapPin,
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ClipboardList,
  },
];

const financeItems: NavItem[] = [
  {
    title: "Settlements",
    href: "/finance/settlements",
    icon: CreditCard,
  },
  {
    title: "Rewards & Cashback",
    href: "/finance/rewards",
    icon: Gift,
  },
];

const supportItems: NavItem[] = [
  {
    title: "Issue Alerts",
    href: "/issues",
    icon: AlertTriangle,
  },
  {
    title: "Feedback",
    href: "/support/feedback",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isCollapsed } = useSidebar();
  const [openMenus, setOpenMenus] = useState<string[]>([]);
  const [adminRole, setAdminRole] = useState<string>("super_admin");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("admin_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.adminRole) {
          setAdminRole(user.adminRole);
        }
      }
    } catch (e) {
      console.error("Failed to parse admin role", e);
    }
  }, []);

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  const renderNavItems = (items: NavItem[], sectionTitle?: string) => (
    <div className="space-y-1">
      {sectionTitle && !isCollapsed && (
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {sectionTitle}
        </p>
      )}
      {items.map((item) => {
        // Logic for main parent items
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href + "/"));
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isOpen = openMenus.includes(item.title);

        return (
          <div key={item.title}>
            <div
              className={cn(
                "flex items-center rounded-lg transition-all hover:text-primary group relative cursor-pointer",
                isCollapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2",
                isActive && !hasSubItems
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() => {
                if (hasSubItems && !isCollapsed) {
                  toggleMenu(item.title);
                }
              }}
            >
              {!hasSubItems || isCollapsed ? (
                <Link href={item.href} className="contents">
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium whitespace-nowrap flex-1">
                        {item.title}
                      </span>
                      {hasSubItems && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      )}
                    </>
                  )}
                </Link>
              ) : (
                <Link
                  href={item.href}
                  className="contents group cursor-pointer"
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <>
                      <span className="text-sm font-medium whitespace-nowrap flex-1">
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-180",
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMenu(item.title);
                        }}
                      />
                    </>
                  )}
                </Link>
              )}

              {isCollapsed && (
                <div className="absolute left-full ml-4 rounded-md bg-primary px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}
            </div>

            {hasSubItems && isOpen && !isCollapsed && (
              <div className="ml-9 space-y-1 mt-1">
                {item.subItems!.map((subItem) => {
                  // Advanced logic for sub-items active state
                  let isSubActive = false;

                  // Parse the href to see if it has query params
                  const [itemPath, itemQuery] = subItem.href.split("?");

                  if (itemQuery) {
                    // It has query params (e.g., role=customer)
                    const params = new URLSearchParams(itemQuery);
                    const roleParam = params.get("role");

                    if (roleParam) {
                      // Check if current URL matches pathname AND has the same role param
                      isSubActive =
                        pathname === itemPath &&
                        searchParams.get("role") === roleParam;
                    } else {
                      // Generic matching if other params exist
                      isSubActive =
                        pathname === itemPath ||
                        pathname.startsWith(itemPath + "/");
                    }
                  } else {
                    // It has NO query params (e.g., /users - "All")
                    // It should match strictly if there is NO role param in current URL
                    if (subItem.href === "/users") {
                      isSubActive =
                        pathname === subItem.href && !searchParams.get("role");
                    } else if (
                      subItem.href === "/vendor" ||
                      subItem.href === "/rider"
                    ) {
                      // Fix: "All" should specifically match exact path
                      // to avoid highlighting when on sub-routes
                      isSubActive = pathname === subItem.href;
                    } else {
                      isSubActive =
                        pathname === subItem.href ||
                        pathname.startsWith(subItem.href + "/");
                    }
                  }

                  return (
                    <Link
                      key={subItem.title}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-primary",
                        isSubActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {subItem.title}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const getRolePanelLabel = () => {
    if (adminRole === "operations_admin") return "Operations Panel";
    if (adminRole === "finance_admin") return "Finance Panel";
    return "Admin Panel";
  };

  // Main navigation items depending on role
  const getMainItems = () => {
    if (adminRole === "finance_admin" || adminRole === "operations_admin") {
      return mainItems.filter((item) => item.href === "/");
    }
    return mainItems;
  };

  return (
    <div className="flex h-full w-full flex-col justify-between border-r bg-card py-4 overflow-y-auto hidden-scrollbar">
      <div className="space-y-6 px-3">
        <div className="py-2">
          <div
            className={cn(
              "flex items-center mb-8 h-12",
              isCollapsed ? "justify-center" : "gap-2",
            )}
          >
            {isCollapsed ? (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold">C</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1 items-center w-full">
                <div className="h-12 flex items-center justify-center w-full">
                  <Image
                    src="/logo.png"
                    alt="Cleclo Logo"
                    width={140}
                    height={50}
                    className="h-10 w-auto object-contain"
                    priority
                  />
                </div>
                <span className="text-xs text-[#3E8940] font-bold tracking-wider uppercase text-center">
                  {getRolePanelLabel()}
                </span>
              </div>
            )}
          </div>

          {renderNavItems(getMainItems())}
        </div>

        {adminRole !== "finance_admin" && (
          <div className="pt-2 border-t border-slate-100">
            {renderNavItems(managementItems, "Management")}
          </div>
        )}

        {adminRole !== "operations_admin" && (
          <div className="pt-2 border-t border-slate-100">
            {renderNavItems(financeItems, "Finance")}
          </div>
        )}
      </div>

      <div className="px-3 py-2 space-y-1 border-t border-slate-100 pt-4">
        {renderNavItems(
          adminRole === "finance_admin"
            ? supportItems.filter((i) => i.title === "Settings")
            : adminRole === "operations_admin"
              ? supportItems.filter((i) => i.title !== "Settings")
              : supportItems,
          "Support",
        )}
      </div>
    </div>
  );
}
