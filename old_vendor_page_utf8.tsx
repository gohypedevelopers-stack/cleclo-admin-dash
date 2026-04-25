"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VENDORS } from "@/lib/vendorsData";
import { OUTLETS } from "@/lib/outletsData";
import { SUPPORT_TICKETS } from "@/lib/supportData";
import {
  Users,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Ban,
  Activity,
  ArrowRight,
  Store,
  ShieldCheck,
  BarChart3,
  Headphones,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700 border-green-200";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Suspended":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

// Calculate days since joined
const getDaysActive = (joinedDate: string) => {
  const joined = new Date(joinedDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - joined.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Mock chart data
const weeklyOrdersData = [
  { name: "Mon", orders: 45 },
  { name: "Tue", orders: 52 },
  { name: "Wed", orders: 38 },
  { name: "Thu", orders: 65 },
  { name: "Fri", orders: 78 },
  { name: "Sat", orders: 92 },
  { name: "Sun", orders: 67 },
];

const vendorGrowthData = [
  { month: "Aug", vendors: 3 },
  { month: "Sep", vendors: 4 },
  { month: "Oct", vendors: 4 },
  { month: "Nov", vendors: 5 },
  { month: "Dec", vendors: 5 },
  { month: "Jan", vendors: 6 },
];

export default function VendorDashboardPage() {
  const router = useRouter();
  const [vendorList] = useState(VENDORS);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Calculate Summary Metrics
  const totalVendors = vendorList.length;
  const activeVendors = vendorList.filter((v) => v.status === "Active").length;
  const pendingVendors = vendorList.filter(
    (v) => v.status === "Pending",
  ).length;
  const avgCompletion =
    vendorList.length > 0
      ? Math.round(
          vendorList.reduce((acc, curr) => acc + curr.completionRate, 0) /
            vendorList.length,
        )
      : 0;
  const totalOrders = vendorList.reduce(
    (acc, curr) => acc + curr.totalOrders,
    0,
  );

  // Preview data
  const recentVendors = vendorList.slice(0, 4);
  const pendingForVerification = vendorList
    .filter((v) => v.status === "Pending")
    .slice(0, 3);
  const recentOutlets = OUTLETS.slice(0, 3);
  const topPerformers = [...vendorList]
    .sort((a, b) => b.completionRate - a.completionRate)
    .slice(0, 4);
  const openTickets = SUPPORT_TICKETS.filter(
    (t) => t.status === "Open" || t.status === "In Progress",
  ).slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Vendor Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of vendor performance and recent activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              {activeVendors} Active Now
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-linear-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">
                  Total Vendors
                </p>
                <p className="text-3xl font-bold mt-1">{totalVendors}</p>
                <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +2 this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-green-500 to-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs font-medium uppercase tracking-wider">
                  Total Orders
                </p>
                <p className="text-3xl font-bold mt-1">
                  {totalOrders.toLocaleString()}
                </p>
                <p className="text-green-100 text-xs mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> 67 today
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-amber-500 to-orange-500 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">
                  Pending Review
                </p>
                <p className="text-3xl font-bold mt-1">{pendingVendors}</p>
                <p className="text-amber-100 text-xs mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Needs attention
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-linear-to-br from-purple-500 to-purple-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">
                  Avg Performance
                </p>
                <p className="text-3xl font-bold mt-1">{avgCompletion}%</p>
                <p className="text-purple-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +3% vs last month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Orders Chart */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Weekly Orders
              </CardTitle>
              <p className="text-xs text-slate-500">
                Orders processed by vendors
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">
              +12%
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyOrdersData}>
                  <defs>
                    <linearGradient
                      id="colorOrders"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#3E8940"
                    strokeWidth={2}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Vendor Growth Chart */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Vendor Growth
              </CardTitle>
              <p className="text-xs text-slate-500">
                Monthly vendor registrations
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">
              +2 new
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendorGrowthData}>
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="vendors" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout for Preview Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vendors Preview */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "vendors" ? "shadow-lg ring-2 ring-blue-200" : ""}`}
          onMouseEnter={() => setHoveredCard("vendors")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Vendors
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/vendor/all")}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentVendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-linear-to-r hover:from-slate-50 hover:to-transparent cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-100"
                  onClick={() => router.push(`/vendors/${vendor.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="text-xs bg-linear-to-br from-green-100 to-green-200 text-green-700 font-bold">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">
                        {vendor.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {vendor.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(vendor.status)} text-xs`}
                    >
                      {vendor.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" />{" "}
                      {getDaysActive(vendor.joinedDate)}d active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* New Verification Preview */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "verification" ? "shadow-lg ring-2 ring-amber-200" : ""}`}
          onMouseEnter={() => setHoveredCard("verification")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                New Verification
              </CardTitle>
              {pendingForVerification.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                  {pendingForVerification.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/vendor/verification")}
            >
              Review All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            {pendingForVerification.length > 0 ? (
              <div className="space-y-3">
                {pendingForVerification.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all duration-200 border border-amber-100 group"
                    onClick={() => router.push(`/vendors/${vendor.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 ring-2 ring-amber-200">
                        <AvatarFallback className="text-xs bg-linear-to-br from-amber-100 to-amber-200 text-amber-700 font-bold">
                          {vendor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {vendor.name}
                        </p>
                        <p className="text-xs text-slate-500">{vendor.owner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-amber-600 font-medium">
                        Applied {getDaysActive(vendor.joinedDate)}d ago
                      </span>
                      <Badge className="bg-amber-500 text-white border-none text-xs animate-pulse">
                        NEW
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="h-10 w-10 mb-2 text-green-400" />
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No pending verifications</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outlets Preview */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "outlets" ? "shadow-lg ring-2 ring-indigo-200" : ""}`}
          onMouseEnter={() => setHoveredCard("outlets")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Store className="h-4 w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Outlets
              </CardTitle>
              <Badge className="bg-indigo-100 text-indigo-700 border-none text-xs">
                {OUTLETS.length} Total
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/vendor/outlets")}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentOutlets.map((outlet) => (
                <div
                  key={outlet.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-linear-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shadow-sm">
                      <Store className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {outlet.name}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {outlet.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-amber-700">
                      {outlet.rating}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Analytics Preview */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "analytics" ? "shadow-lg ring-2 ring-purple-200" : ""}`}
          onMouseEnter={() => setHoveredCard("analytics")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Top Performers
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/vendor/analytics")}
            >
              View Details <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {topPerformers.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        index === 0
                          ? "bg-linear-to-br from-amber-400 to-amber-500 text-white"
                          : index === 1
                            ? "bg-linear-to-br from-slate-300 to-slate-400 text-white"
                            : index === 2
                              ? "bg-linear-to-br from-orange-400 to-orange-500 text-white"
                              : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {vendor.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {vendor.totalOrders} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          vendor.completionRate >= 90
                            ? "bg-linear-to-r from-green-400 to-green-500"
                            : "bg-linear-to-r from-amber-400 to-amber-500"
                        }`}
                        style={{ width: `${vendor.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-green-600 w-10 text-right">
                      {vendor.completionRate}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support Preview - Full Width */}
        <Card
          className={`lg:col-span-2 shadow-sm transition-all duration-300 ${hoveredCard === "support" ? "shadow-lg ring-2 ring-rose-200" : ""}`}
          onMouseEnter={() => setHoveredCard("support")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <Headphones className="h-4 w-4 text-rose-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Support Tickets
              </CardTitle>
              {openTickets.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
                  {openTickets.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/vendor/support")}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            {openTickets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {openTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:shadow-md cursor-pointer transition-all duration-200 bg-linear-to-br from-white to-slate-50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          ticket.priority === "High"
                            ? "text-red-600 bg-red-50 border-red-200"
                            : ticket.priority === "Medium"
                              ? "text-amber-600 bg-amber-50 border-amber-200"
                              : "text-green-600 bg-green-50 border-green-200"
                        }`}
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge
                        className={`text-xs border-none ${
                          ticket.status === "Open"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1">
                      {ticket.subject}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      {ticket.vendorName}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{ticket.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <CheckCircle className="h-10 w-10 mb-2 text-green-400" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs">No open support tickets</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
