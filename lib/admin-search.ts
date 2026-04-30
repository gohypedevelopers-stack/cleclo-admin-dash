export type AdminSearchEntry = {
  title: string;
  href: string;
  section: string;
  description: string;
  keywords: string[];
  searchParam?: string;
  restrictedFor?: string[];
};

export type AdminSearchResult = AdminSearchEntry & {
  score: number;
  matchedKeyword?: string;
  hrefWithQuery: string;
};

const DASHBOARD_ROUTES: AdminSearchEntry[] = [
  {
    title: "Admin Dashboard",
    href: "/",
    section: "Dashboard",
    description: "Revenue, orders, operational risk, finance snapshot",
    keywords: ["dashboard", "home", "overview", "metrics", "kpi", "revenue", "today", "analytics"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    section: "Dashboard",
    description: "Platform charts and reporting analytics",
    keywords: ["analytics", "chart", "report", "growth", "trend", "performance"],
  },
  {
    title: "Growth & Content Manager",
    href: "/app",
    section: "Growth",
    description: "App content, home modules, promotions, banners, videos",
    keywords: ["growth", "content", "app", "cms", "home", "banner", "promotion", "promo", "referral", "video"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Home Content",
    href: "/home",
    section: "Growth",
    description: "Manage home screen content",
    keywords: ["home", "content", "app home", "homepage"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Banners",
    href: "/home/banners",
    section: "Growth",
    description: "Create and update app banners",
    keywords: ["banner", "banners", "carousel", "hero", "home banner"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Promotions",
    href: "/home/promotions",
    section: "Growth",
    description: "Offers, campaign articles and promo codes",
    keywords: ["promotion", "promotions", "promo", "coupon", "offer", "discount", "campaign"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Referral",
    href: "/home/referral",
    section: "Growth",
    description: "Referral program settings",
    keywords: ["referral", "refer", "invite", "reward"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Videos",
    href: "/home/videos",
    section: "Growth",
    description: "Home videos and app education content",
    keywords: ["video", "videos", "tutorial", "education"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Services",
    href: "/services/services",
    section: "Catalog",
    description: "Service list and service setup",
    keywords: ["service", "services", "laundry", "dry clean", "catalog"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Service Categories",
    href: "/services/categories",
    section: "Catalog",
    description: "Service categories",
    keywords: ["category", "categories", "catalog", "service category"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Service Subcategories",
    href: "/services/subcategories",
    section: "Catalog",
    description: "Service subcategories",
    keywords: ["subcategory", "subcategories", "catalog"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Catalog Items",
    href: "/master/items",
    section: "Catalog",
    description: "Items, SKU, pricing and catalog management",
    keywords: ["item", "items", "sku", "price", "pricing", "catalog", "garment", "service catalog"],
    searchParam: "search",
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Locations",
    href: "/master/locations",
    section: "Catalog",
    description: "Cities, areas and service slots",
    keywords: ["location", "locations", "city", "cities", "area", "areas", "slot", "pincode"],
    searchParam: "search",
    restrictedFor: ["finance_admin", "operations_admin"],
  },
  {
    title: "Users",
    href: "/users",
    section: "Management",
    description: "All customers, vendors, riders and admins",
    keywords: ["user", "users", "customer", "vendor", "rider", "admin", "phone", "email", "profile"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Customers",
    href: "/users?role=customer",
    section: "Management",
    description: "Customer accounts and wallet data",
    keywords: ["customer", "customers", "client", "user customer", "phone", "wallet"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendors",
    href: "/vendors",
    section: "Management",
    description: "Vendor accounts, city, phone and approval status",
    keywords: ["vendor", "vendors", "store", "outlet", "business", "partner", "seller", "phone", "city"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Overview",
    href: "/vendor",
    section: "Vendor",
    description: "Vendor operations dashboard",
    keywords: ["vendor overview", "vendor dashboard", "vendor operations"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Performance",
    href: "/vendor/all",
    section: "Vendor",
    description: "Vendor ranking and performance intelligence",
    keywords: ["vendor performance", "performance", "rating", "sla", "vendor score"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Verification",
    href: "/vendor/verification",
    section: "Vendor",
    description: "New vendor verification and approvals",
    keywords: ["vendor verification", "verification", "approve vendor", "approval", "kyc", "documents", "new vendor"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Outlets",
    href: "/vendor/outlets",
    section: "Vendor",
    description: "Vendor outlet locations",
    keywords: ["outlet", "outlets", "vendor outlet", "location", "city"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Analytics",
    href: "/vendor/analytics",
    section: "Vendor",
    description: "Vendor analytics and trends",
    keywords: ["vendor analytics", "vendor chart", "vendor trend"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Payments",
    href: "/vendor/payments",
    section: "Vendor",
    description: "Vendor payment records",
    keywords: ["vendor payment", "payments", "payout", "vendor payout", "transaction"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Vendor Support",
    href: "/vendor/support",
    section: "Vendor",
    description: "Vendor support tickets",
    keywords: ["vendor support", "ticket", "tickets", "support"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Riders",
    href: "/riders",
    section: "Management",
    description: "Fleet intelligence and rider records",
    keywords: ["rider", "riders", "fleet", "delivery", "pickup", "agent", "phone"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Rider Overview",
    href: "/rider",
    section: "Rider",
    description: "Rider operations dashboard",
    keywords: ["rider overview", "rider dashboard", "rider operations"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Rider Verification",
    href: "/rider/verification",
    section: "Rider",
    description: "New rider verification and onboarding",
    keywords: ["rider verification", "verify rider", "approval", "kyc", "documents", "new rider"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Rider Analytics",
    href: "/rider/analytics",
    section: "Rider",
    description: "Rider analytics and trends",
    keywords: ["rider analytics", "rider chart", "fleet analytics"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Rider Payments",
    href: "/rider/payments",
    section: "Rider",
    description: "Rider payment transactions",
    keywords: ["rider payment", "rider payout", "payments", "transaction", "reference"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Rider Support",
    href: "/rider/support",
    section: "Rider",
    description: "Rider support tickets",
    keywords: ["rider support", "ticket", "tickets", "support"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Orders",
    href: "/orders",
    section: "Operations",
    description: "Order ID, customer, vendor, city, phone and status",
    keywords: ["order", "orders", "order id", "booking", "pickup", "delivery", "pending", "processing", "delivered", "cancelled", "phone"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Order Settings",
    href: "/orders/settings",
    section: "Operations",
    description: "Order allocation settings",
    keywords: ["order settings", "allocation", "assignment", "routing"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Issue Alerts",
    href: "/issues",
    section: "Support",
    description: "Issue alerts by order, vendor, customer, city or severity",
    keywords: ["issue", "issues", "alert", "alerts", "complaint", "refund", "damage", "delay", "escalation"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Settlements",
    href: "/finance/settlements",
    section: "Finance",
    description: "Vendor payouts, commissions, settlement status",
    keywords: ["settlement", "settlements", "finance", "payout", "vendor payout", "commission", "payment", "transaction", "reconciliation"],
    searchParam: "search",
    restrictedFor: ["operations_admin"],
  },
  {
    title: "Support Chat",
    href: "/support",
    section: "Support",
    description: "Support conversations",
    keywords: ["support", "chat", "conversation", "helpdesk"],
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Feedback",
    href: "/support/feedback",
    section: "Support",
    description: "Customer feedback and review messages",
    keywords: ["feedback", "review", "rating", "message"],
    searchParam: "search",
    restrictedFor: ["finance_admin"],
  },
  {
    title: "Settings",
    href: "/settings",
    section: "Admin",
    description: "Profile, permissions and platform configuration",
    keywords: ["settings", "profile", "admin", "configuration", "permissions", "account"],
  },
  {
    title: "Wallet Settings",
    href: "/wallet/settings",
    section: "Admin",
    description: "Wallet configuration",
    keywords: ["wallet", "wallet settings", "credit", "balance"],
    restrictedFor: ["finance_admin", "operations_admin"],
  },
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const isRouteAllowed = (entry: AdminSearchEntry, adminRole: string) =>
  !entry.restrictedFor?.includes(adminRole);

const addQueryToHref = (href: string, searchParam: string | undefined, query: string) => {
  const cleaned = query.trim();
  if (!searchParam || !cleaned) return href;

  const [path, existingQuery = ""] = href.split("?");
  const params = new URLSearchParams(existingQuery);
  params.set(searchParam, cleaned);
  return `${path}?${params.toString()}`;
};

export function getAdminSearchResults(query: string, adminRole = "super_admin", limit = 7): AdminSearchResult[] {
  const normalizedQuery = normalize(query);

  const results = DASHBOARD_ROUTES
    .filter((entry) => isRouteAllowed(entry, adminRole))
    .map((entry) => {
      const haystack = normalize([
        entry.title,
        entry.section,
        entry.description,
        ...entry.keywords,
      ].join(" "));
      const normalizedTitle = normalize(entry.title);
      const matchedKeyword = entry.keywords.find((keyword) =>
        normalize(keyword).includes(normalizedQuery) || normalizedQuery.includes(normalize(keyword)),
      );

      let score = 0;
      if (!normalizedQuery) {
        score = entry.href === "/" ? 8 : 1;
      } else if (normalizedTitle === normalizedQuery) {
        score = 100;
      } else if (normalizedTitle.startsWith(normalizedQuery)) {
        score = 80;
      } else if (matchedKeyword && normalize(matchedKeyword) === normalizedQuery) {
        score = 75;
      } else if (matchedKeyword) {
        score = 55;
      } else if (haystack.includes(normalizedQuery)) {
        score = 35;
      }

      return {
        ...entry,
        score,
        matchedKeyword,
        hrefWithQuery: addQueryToHref(entry.href, entry.searchParam, query),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);

  if (results.length > 0 || !normalizedQuery) return results;

  return DASHBOARD_ROUTES
    .filter((entry) => isRouteAllowed(entry, adminRole) && entry.searchParam)
    .filter((entry) =>
      ["Orders", "Users", "Vendors", "Riders", "Issue Alerts", "Settlements"].includes(entry.title),
    )
    .map((entry, index) => ({
      ...entry,
      score: 10 - index,
      matchedKeyword: "search",
      hrefWithQuery: addQueryToHref(entry.href, entry.searchParam, query),
    }))
    .slice(0, limit);
}

export function getAdminSearchTarget(query: string, adminRole = "super_admin") {
  const results = getAdminSearchResults(query, adminRole, 1);
  return results[0]?.hrefWithQuery || null;
}
