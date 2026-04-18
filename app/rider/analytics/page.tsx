"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Package,
  Users,
  MapPin,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Simulated historical sequence for charts
const DELIVERY_DATA = [
  { name: "Mon", deliveries: 145, earnings: 4200 },
  { name: "Tue", deliveries: 132, earnings: 3800 },
  { name: "Wed", deliveries: 156, earnings: 4500 },
  { name: "Thu", deliveries: 165, earnings: 4800 },
  { name: "Fri", deliveries: 210, earnings: 6200 },
  { name: "Sat", deliveries: 250, earnings: 7500 },
  { name: "Sun", deliveries: 230, earnings: 6900 },
];

const HOURLY_ACTIVITY = [
  { time: "6am", active: 12 },
  { time: "9am", active: 45 },
  { time: "12pm", active: 85 },
  { time: "3pm", active: 60 },
  { time: "6pm", active: 95 },
  { time: "9pm", active: 75 },
  { time: "12am", active: 20 },
];

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";
const ORDER_API_URL = process.env.NEXT_PUBLIC_ORDER_API_URL || "http://localhost:3000/api/admin/orders";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

export default function RiderAnalyticsPage() {
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [usersRes, statsRes] = await Promise.all([
          fetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() }),
          fetch(`${ORDER_API_URL}/dashboard/stats`, { headers: getAuthHeaders() }).catch(() => null)
        ]);

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setRiders(usersData.filter((u: any) => u.role?.toLowerCase() === 'rider' || u.vendorProfile?.businessType === 'rider'));
        }
      } catch (err) {
        toast.error("Failed to load generic overview.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
     return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <h3 className="font-semibold text-slate-700">Crunching Rider Metrics...</h3>
      </div>
    );
  }

  const activeCount = riders.filter(r => r.status?.toLowerCase() === 'active').length;
  const offlineCount = riders.filter(r => r.status?.toLowerCase() !== 'active').length;
  
  const RIDER_STATUS_DATA = [
    { name: "Active", value: activeCount > 0 ? activeCount : 0.1, color: "#3E8940" },
    { name: "Offline", value: offlineCount, color: "#94A3B8" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rider Analytics</h1>
          <p className="text-slate-500 mt-1">
            Performance metrics and fleet insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700">
            <Calendar className="h-4 w-4" /> This Week
          </Button>
          <Button variant="outline" size="icon" className="bg-white border-slate-200">
            <Filter className="h-4 w-4 text-slate-700" />
          </Button>
          <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Delivery Volume
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  1,280
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+8.2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Registered Riders
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {riders.length}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              <span className="text-green-600 font-medium">{activeCount} Currently Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Avg. Delivery Time
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  24m 30s
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
              <TrendingDown className="h-3 w-3 mr-1" />
              <span>-1m 15s improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow bg-[#3E8940] text-white">
          <CardContent className="p-6 relative overflow-hidden">
             {/* Decorative Background Assets */}
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-100">
                  Fleet Utilization
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {Math.round((activeCount / Math.max(riders.length, 1)) * 100)}%
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-100 relative z-10">
              <span>Optimized Fleet Capacity</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart */}
        <Card className="md:col-span-5 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Delivery & Earnings Trends</CardTitle>
            <CardDescription>
              Daily performance breakdown for the current week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={DELIVERY_DATA}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorEarnings"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#3E8940"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEarnings)"
                  />
                  <Line
                    type="monotone"
                    dataKey="deliveries"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Fleet Status</CardTitle>
            <CardDescription>Real-time rider availability</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={RIDER_STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {RIDER_STATUS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <span className="text-2xl font-bold text-slate-900">{riders.length}</span>
                <span className="text-xs text-slate-500 block">Total</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-4">
              {RIDER_STATUS_DATA.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto">
                    {item.value >= 1 ? item.value : 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Hourly Activity */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Peak Hours Activity</CardTitle>
            <CardDescription>Active riders throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_ACTIVITY}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b" }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "#f1f5f9" }}
                    contentStyle={{ borderRadius: "8px" }}
                  />
                  <Bar
                    dataKey="active"
                    fill="#3E8940"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Top Performing Riders</CardTitle>
            <CardDescription>
              Based on active registry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {riders.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-6 text-slate-500">
                   <p>No riders available.</p>
                </div>
              )}
              {riders.map((rider, idx) => (
                <div key={idx} className="flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-amber-100 text-amber-700 uppercase">
                        {(rider.name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {rider.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{rider.phone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`text-[10px] mt-1 ${rider.status === "active" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-600"}`}
                    >
                      {rider.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
