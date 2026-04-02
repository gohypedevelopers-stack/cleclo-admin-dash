"use client";

import {
  ImageIcon,
  LayoutGrid,
  Video,
  Gift,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const appSections = [
  {
    title: "Home Screen",
    description: "Control banners, services grid, and home content",
    icon: LayoutGrid,
    items: [
      {
        name: "Banners",
        href: "/home/banners",
        description: "Manage promotional banners",
      },

      {
        name: "Referral Banner",
        href: "/home/referral",
        description: "Edit rewards and design",
      },
      {
        name: "Videos",
        href: "/home/videos",
        description: "Explainer videos and thumbnails",
      },
      {
        name: "Campaign Manager",
        href: "/home/promotions",
        description: "Manage coupons, offers, and delivery campaigns",
      },
    ],
  },
  {
    title: "Services Screen",
    description: "Manage service hierarchy and items",
    icon: LayoutGrid,
    items: [
      {
        name: "Services",
        href: "/services/services",
        description: "Main service types (Laundry, Dry Clean, etc.)",
      },
      {
        name: "Categories",
        href: "/services/categories",
        description: "Categories within each service",
      },
      {
        name: "Sub Categories",
        href: "/services/subcategories",
        description: "Sub-categories for detailed classification",
      },
      {
        name: "Items",
        href: "/services/items",
        description: "Individual service items and pricing",
      },
    ],
  },
  {
    title: "Wallet Settings",
    description: "Configure wallet functionality",
    icon: Gift,
    items: [
      {
        name: "Add Money Settings",
        href: "/wallet/settings",
        description: "Min/max amounts, bonuses",
      },
    ],
  },
];

export default function AppContentPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-black font-bold tracking-tight">
          Growth & Content Manager
        </h1>
        <p className="text-slate-500 mt-1">
          Control what users see and how the platform grows
        </p>
      </div>

      {/* Sections */}
      <div className="grid gap-6">
        {appSections.map((section) => (
          <div
            key={section.title}
            className="bg-white rounded-xl shadow-sm border overflow-hidden"
          >
            <div className="p-6 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-black">
                    {section.title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {section.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="divide-y">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                >
                  <div>
                    <p className="font-medium text-black group-hover:text-primary transition-colors">
                      {item.name}
                    </p>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
