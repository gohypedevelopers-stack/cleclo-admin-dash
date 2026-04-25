"use client";

import Link from "next/link";
import { ArrowRight, Gift, Images, Layers3, Megaphone, Sparkles, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const hubCards = [
  {
    title: "Services Grid",
    description: "Control which services appear on the home screen and how they are grouped.",
    href: "/home/services",
    icon: Layers3,
    tone: "bg-blue-50 text-blue-600",
  },
  {
    title: "Banners",
    description: "Schedule hero banners with targeting, priority, and expiry windows.",
    href: "/home/banners",
    icon: Images,
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    title: "Promotions",
    description: "Manage coupon campaigns, vendor offers, and article-style promo copy.",
    href: "/home/promotions",
    icon: Megaphone,
    tone: "bg-amber-50 text-amber-600",
  },
  {
    title: "Referral Program",
    description: "Version rewards, active IDs, and city targeting for referral campaigns.",
    href: "/home/referral",
    icon: Gift,
    tone: "bg-violet-50 text-violet-600",
  },
  {
    title: "Videos",
    description: "Publish explainers, set visibility windows, and manage playback assets.",
    href: "/home/videos",
    icon: Video,
    tone: "bg-orange-50 text-orange-600",
  },
];

export default function HomeContentHubPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-10 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-4">
            <Badge className="gap-1.5 border-white/15 bg-white/10 text-white">
              <Sparkles className="h-3 w-3" />
              Growth & Content Manager
            </Badge>
            <div>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                Home experience, content, and campaign controls in one place.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                Update banners, service tiles, referral rewards, promotions, and explainer videos using the data already stored in the catalog service.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link href="/app">Back to Dashboard</Link>
            </Button>
            <Button asChild className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90">
              <Link href="/home/banners">
                Open Banners
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Content focus</p>
          <p className="mt-2 text-2xl font-bold text-black">Scheduled, targeted, versioned</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Supported modules</p>
          <p className="mt-2 text-2xl font-bold text-black">5 live sections</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Publishing model</p>
          <p className="mt-2 text-2xl font-bold text-black">Preview before launch</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {hubCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-black">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}