"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { USERS } from "@/lib/usersData";
import {
  Users,
  Bike,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Calendar,
  Zap,
  Activity,
  AlertTriangle,
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

// Mock Data Generation
// Mock Data Generation
const recentRiders = USERS.slice(0, 4).map((user, index) => ({
  ...user,
  status: index % 2 === 0 ? "Active" : "Pending",
  rating: (4.2 + index * 0.1).toFixed(1),
  deliveries: 120 + index * 50,
  location: "Bangalore, India", // Mock location
}));

const pendingValidations = [
  {
    id: "pv1",
    name: "Rahul Kumar",
    location: "Indiranagar, Bangalore",
    applied: "2 hours ago",
    avatar: "RK",
    type: "Bike",
  },
  {
    id: "pv2",
    name: "Amit Singh",
    location: "Koramangala, Bangalore",
    applied: "5 hours ago",
    avatar: "AS",
    type: "Scooter",
  },
  {
    id: "pv3",
    name: "Priya Sharma",
    location: "HSR Layout, Bangalore",
    applied: "1 day ago",
    avatar: "PS",
    type: "Bike",
  },
];

const issueAlerts = [
  {
    id: "ia1",
    type: "Document Expired",
    rider: "Vikram Malhotra",
    time: "1 hour ago",
    severity: "High",
  },
  {
    id: "ia2",
    type: "Low Rating Warning",
    rider: "Suresh Reddy",
    time: "3 hours ago",
    severity: "Medium",
  },
  {
    id: "ia3",
    type: "High Cancellation",
    rider: "John Doe",
    time: "5 hours ago",
    severity: "Medium",
  },
];

const weeklyActivityData = [
  { name: "Mon", active: 120 },
  { name: "Tue", active: 132 },
  { name: "Wed", active: 101 },
  { name: "Thu", active: 134 },
  { name: "Fri", active: 190 },
  { name: "Sat", active: 230 },
  { name: "Sun", active: 210 },
];

const riderGrowthData = [
  { month: "Aug", riders: 15 },
  { month: "Sep", riders: 22 },
  { month: "Oct", riders: 28 },
  { month: "Nov", riders: 35 },
  { month: "Dec", riders: 42 },
  { month: "Jan", riders: 18 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700 border-green-200";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Blocked":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Stats Calculations
  const totalRiders = 284;
  const activeNow = 45;
  const pendingCount = pendingValidations.length + 15; // Mock total pending
  const avgRating = 4.6;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Rider Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of rider fleet performance and status
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-700">
              {activeNow} Active Now
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
                  Total Riders
                </p>
                <p className="text-3xl font-bold mt-1">{totalRiders}</p>
                <p className="text-blue-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +12 this month
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
                  Total Deliveries
                </p>
                <p className="text-3xl font-bold mt-1">12,543</p>
                <p className="text-green-100 text-xs mt-1 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> 142 today
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
                  Pending Verification
                </p>
                <p className="text-3xl font-bold mt-1">{pendingCount}</p>
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
                  Avg Rating
                </p>
                <p className="text-3xl font-bold mt-1">{avgRating}</p>
                <p className="text-purple-100 text-xs mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> +0.2 vs last month
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
        {/* Weekly Activity Chart */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Weekly Active Riders
              </CardTitle>
              <p className="text-xs text-slate-500">
                Riders active in the last 7 days
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">
              +15%
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyActivityData}>
                  <defs>
                    <linearGradient
                      id="colorActive"
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
                    dataKey="active"
                    stroke="#3E8940"
                    strokeWidth={2}
                    fill="url(#colorActive)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rider Growth Chart */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Rider Growth
              </CardTitle>
              <p className="text-xs text-slate-500">
                Monthly rider registrations
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">
              +18 new
            </Badge>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={riderGrowthData}>
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
                  <Bar dataKey="riders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Sections Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Joiners Preview */}
        <Card
          className={`shadow-sm transition-all duration-300 ${hoveredCard === "riders" ? "shadow-lg ring-2 ring-blue-200" : ""}`}
          onMouseEnter={() => setHoveredCard("riders")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bike className="h-4 w-4 text-blue-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Recent Joiners
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/rider/all")}
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {recentRiders.map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-linear-to-r hover:from-slate-50 hover:to-transparent cursor-pointer transition-all duration-200 group border border-transparent hover:border-slate-100"
                  onClick={() => router.push(`/rider/${rider.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                      <AvatarFallback className="text-xs bg-linear-to-br from-blue-100 to-blue-200 text-blue-700 font-bold">
                        {rider.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">
                        {rider.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {rider.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(rider.status)} text-xs`}
                    >
                      {rider.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> {rider.joinDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Verification Preview */}
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
                Pending Verification
              </CardTitle>
              {pendingValidations.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                  {pendingValidations.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
              onClick={() => router.push("/rider/verification")}
            >
              Review All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              {pendingValidations.map((rider) => (
                <div
                  key={rider.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-all duration-200 border border-amber-100 group"
                  onClick={() => router.push(`/rider/verification/${rider.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-amber-200">
                      <AvatarFallback className="text-xs bg-linear-to-br from-amber-100 to-amber-200 text-amber-700 font-bold">
                        {rider.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {rider.name}
                      </p>
                      <p className="text-xs text-slate-500">{rider.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-600 font-medium">
                      {rider.applied}
                    </span>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-amber-500 hover:bg-amber-600 border-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/rider/verification/${rider.id}`);
                      }}
                    >
                      Verify
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rider Alerts - Full Width */}
        <Card
          className={`lg:col-span-2 shadow-sm transition-all duration-300 ${hoveredCard === "alerts" ? "shadow-lg ring-2 ring-rose-200" : ""}`}
          onMouseEnter={() => setHoveredCard("alerts")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Rider Alerts
              </CardTitle>
              {issueAlerts.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-xs font-bold">
                  {issueAlerts.length}
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-[#3E8940] hover:bg-green-50"
            >
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="grid gap-4 md:grid-cols-3">
              {issueAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-rose-200 hover:shadow-md cursor-pointer transition-all duration-200 bg-linear-to-br from-white to-slate-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        alert.severity === "High"
                          ? "text-red-600 bg-red-50 border-red-200"
                          : "text-amber-600 bg-amber-50 border-amber-200"
                      }`}
                    >
                      {alert.severity} Priority
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">
                    {alert.type}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Bike className="h-3 w-3" /> {alert.rider}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
