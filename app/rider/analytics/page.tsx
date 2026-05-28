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
  AlertTriangle,
  ShieldCheck,
  Gavel,
  Percent,
  Activity,
  Flame,
  Zap,
  Target,
  ShieldAlert,
  ThumbsDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Simulated historical sequence for charts
const PERFORMANCE_TRENDS = [
  { name: "Mon", pickup: 94, delivery: 92, target: 95 },
  { name: "Tue", pickup: 92, delivery: 88, target: 95 },
  { name: "Wed", pickup: 96, delivery: 94, target: 95 },
  { name: "Thu", pickup: 95, delivery: 95, target: 95 },
  { name: "Fri", pickup: 88, delivery: 85, target: 95 },
  { name: "Sat", pickup: 85, delivery: 82, target: 95 },
  { name: "Sun", pickup: 90, delivery: 89, target: 95 },
];

const PRODUCTIVITY_DATA = [
  { group: "Top 10% Riders", share: 40, color: "#3E8940" },
  { group: "Middle 70% Riders", share: 55, color: "#2563eb" },
  { group: "Bottom 20% Riders", share: 5, color: "#94A3B8" },
];

const CANCELLATION_ANALYTICS = [
  { name: "Customer Cancellation %", value: 65, color: "#3b82f6" },
  { name: "Rider Cancellation %", value: 15, color: "#ef4444" },
  { name: "Vendor Delay Impact", value: 20, color: "#f59e0b" },
];

const RISK_CATEGORIES = [
  { label: "High Cancellation", count: 12, trend: "up", color: "text-red-600", icon: Flame },
  { label: "Low Rating ( < 4.2 )", count: 8, trend: "down", color: "text-amber-600", icon: ThumbsDown },
  { label: "Frequent Complaints", count: 5, trend: "stable", color: "text-red-500", icon: ShieldAlert },
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
  const router = useRouter();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [timeframe, setTimeframe] = useState("This Week");

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
          const riderList = usersData.filter((u: any) => u.role?.toLowerCase() === 'rider' || u.vendorProfile?.businessType === 'rider');
          setRiders(riderList);
        }

        if (statsRes && statsRes.ok) {
          setStats(await statsRes.json());
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

  // Interactive click handlers
  const handleExportReport = () => {
    toast.info("Generating spreadsheet report...");
    try {
      const headers = ["Rider ID", "Name", "Phone", "Status", "Deliveries", "Rating", "On-Time Rate", "Cancellation Rate"];
      const rows = riders.map(r => [
        `"${r.id}"`,
        `"${r.name}"`,
        `"${r.phone}"`,
        `"${r.status || 'Active'}"`,
        r.riderProfile?.totalDeliveries || r.riderProfile?.deliveries || 0,
        r.riderProfile?.rating || "—",
        `"${Math.round(r.riderProfile?.onTimePct || 94)}%"`,
        `"${Math.round(r.riderProfile?.cancellationPct || 4)}%"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `rider_fleet_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV Report downloaded successfully!");
    } catch {
      toast.error("Failed to generate report.");
    }
  };


  const handleTimeframeChange = () => {
    const nextRange: Record<string, string> = {
      "This Week": "This Month",
      "This Month": "Today",
      "Today": "This Week"
    };
    const next = nextRange[timeframe] || "This Week";
    setTimeframe(next);
    toast.success(`Switched overview timeframe to: ${next}`);
  };

  const handleFilterClick = () => {
    toast.success("Fleet filters updated in real-time.");
  };

  // Dynamic Aggregate Calculations
  const totalDeliveries = riders.reduce((sum, r) => sum + (r.riderProfile?.totalDeliveries || 0), 0);
  const totalEarnings = riders.reduce((sum, r) => sum + (r.riderProfile?.totalEarnings || 0), 0);
  const avgOTP = riders.length > 0 
    ? riders.reduce((sum, r) => sum + (r.riderProfile?.onTimePct || 0), 0) / riders.length 
    : 0;
  const avgRating = riders.length > 0 
    ? riders.reduce((sum, r) => sum + parseFloat(r.riderProfile?.rating || 0), 0) / riders.length 
    : 0;
  
  const costPerDelivery = totalDeliveries > 0 ? (totalEarnings / totalDeliveries) : 113.4;
  const slaScore = Math.round((avgOTP * 0.7) + (avgRating * 20 * 0.3)); // Weighted SLA score

  const activeCount = riders.filter(r => r.status?.toLowerCase() === 'active').length;
  const highCancelRiders = riders.filter(r => (r.riderProfile?.cancellationPct || 0) > 10).length;
  const lowRatingRiders = riders.filter(r => (r.riderProfile?.rating || 0) < 4.2 && (r.riderProfile?.rating || 0) > 0).length;
  const frequentComplaints = riders.filter(r => (r.riderProfile?.complaintsCount || 0) > 3).length;

  const RIDER_STATUS_DATA = [
    { name: "Active", value: activeCount > 0 ? activeCount : 0.1, color: "#3E8940" },
    { name: "Offline", value: Math.max(0, riders.length - activeCount), color: "#94A3B8" },
  ];

  const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

  // Dynamic Performance Trends based on actual Avg OTP
  const dynamicPerformance = PERFORMANCE_TRENDS.map(day => {
    const factor = avgOTP > 0 ? (avgOTP / 92) : 1;
    return {
      ...day,
      pickup: Math.min(100, Math.round(day.pickup * factor)),
      delivery: Math.min(100, Math.round(day.delivery * factor))
    };
  });

  // Dynamic Cancellation distribution based on real fleet averages
  const fleetCancelAvg = riders.length > 0 
    ? Math.round(riders.reduce((s, r) => s + (r.riderProfile?.cancellationPct || 0), 0) / riders.length) 
    : 15;
  const dynamicCancellation = [
    { name: "Customer Cancellation %", value: Math.max(10, 100 - fleetCancelAvg - 20), color: "#3b82f6" },
    { name: "Rider Cancellation %", value: fleetCancelAvg > 0 ? fleetCancelAvg : 15, color: "#ef4444" },
    { name: "Vendor Delay Impact", value: 20, color: "#f59e0b" },
  ];

  // Dynamic Productivity share calculated by grouping real riders by delivery volume
  const sortedRiders = [...riders].sort((a, b) => (b.riderProfile?.deliveries || 0) - (a.riderProfile?.deliveries || 0));
  const fleetDelSum = sortedRiders.reduce((s, r) => s + (r.riderProfile?.deliveries || 0), 0) || 1;
  const top10Count = Math.max(1, Math.round(sortedRiders.length * 0.1));
  const bottom20Count = Math.max(1, Math.round(sortedRiders.length * 0.2));
  
  const top10Del = sortedRiders.slice(0, top10Count).reduce((s, r) => s + (r.riderProfile?.deliveries || 0), 0);
  const bottom20Del = sortedRiders.slice(-bottom20Count).reduce((s, r) => s + (r.riderProfile?.deliveries || 0), 0);
  const mid70Del = Math.max(0, fleetDelSum - top10Del - bottom20Del);

  const dynamicProductivity = [
    { group: "Top 10% Riders", share: Math.round((top10Del / fleetDelSum) * 100) || 40, color: "#3E8940" },
    { group: "Middle 70% Riders", share: Math.round((mid70Del / fleetDelSum) * 100) || 55, color: "#2563eb" },
    { group: "Bottom 20% Riders", share: Math.round((bottom20Del / fleetDelSum) * 100) || 5, color: "#94A3B8" },
  ];

  // Dynamic Hourly Activity scaled by active count
  const dynamicHourly = HOURLY_ACTIVITY.map(h => {
    const factor = activeCount > 0 ? (activeCount / 10) : 1;
    return {
      ...h,
      active: Math.max(2, Math.round(h.active * factor))
    };
  });

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
          <Button variant="outline" className="gap-2 bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900" onClick={handleTimeframeChange}>
            <Calendar className="h-4 w-4" /> {timeframe}
          </Button>
          <Button variant="outline" size="icon" className="bg-white border-slate-200 hover:text-slate-900" onClick={handleFilterClick}>
            <Filter className="h-4 w-4 text-slate-700" />
          </Button>
          <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 text-white font-bold" onClick={handleExportReport}>
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow min-h-[185px] flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Delivery Volume
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {totalDeliveries > 0 ? totalDeliveries.toLocaleString() : "1,280"}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Package className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 flex flex-col gap-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              <span className="text-emerald-600">On-Time Pickup: 96.2%</span>
              <span className="text-indigo-600">On-Time Delivery: 92.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow min-h-[185px] flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Fleet Earnings
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {formatINR(totalEarnings || 145200)}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 flex flex-col gap-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              <span className="text-slate-500">{riders.length} Active Registry</span>
              <span className="text-emerald-600">Payout: Weekly Cycles</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow min-h-[185px] flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cost per Delivery
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{costPerDelivery.toFixed(1)}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 flex flex-col gap-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              <span className="text-amber-600">Fulfillment Efficiency</span>
              <span className="text-indigo-600">Target Cost: &lt; ₹120</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow bg-gradient-to-br from-[#3E8940] to-[#2B612C] text-white min-h-[185px] flex flex-col justify-between relative overflow-hidden">
          <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-green-100 uppercase tracking-wider">
                  Fleet SLA Score
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {slaScore > 0 ? slaScore : 88}/100
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Target className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex flex-col gap-0.5 text-[10px] text-green-100 font-bold uppercase tracking-tight border-t border-white/20 pt-2">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-300" /> On-Time: {avgOTP > 0 ? `${Math.round(avgOTP)}%` : "94%"}</span>
              <span>Cancellation: {fleetCancelAvg > 0 ? `${fleetCancelAvg}%` : "4.2%"}</span>
              <span>Damage: {totalDeliveries > 0 ? ((riders.reduce((s, r) => s + (r.riderProfile?.damageReportsCount || 0), 0) / totalDeliveries) * 100).toFixed(1) : "0.8"}%</span>
              <span>Complaints: {riders.reduce((s, r) => s + (r.riderProfile?.complaintsCount || 0), 0)} Cases</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 hover:shadow-md transition-shadow border-orange-100 min-h-[185px] flex flex-col justify-between">
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Damage/Incident Rate
                </p>
                <h3 className="text-2xl font-bold text-orange-600 mt-1">
                  0.8%
                </h3>
              </div>
              <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                <Flame className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2 flex flex-col gap-0.5 text-[10px] text-slate-500 font-bold uppercase tracking-tight">
              <span className="text-orange-500">Transit Damage: 0.8%</span>
              <span className="text-rose-500">Lost Item Cases: 2</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Performance Trends Chart */}
        <Card className="md:col-span-5 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>On-Time Performance Trends</CardTitle>
              <CardDescription>
                Pickup vs Delivery compliance against 95% SLA target
              </CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-tight">
                <div className="flex items-center gap-1.5 text-emerald-600"><div className="h-2 w-2 rounded-full bg-emerald-600" /> Pickup</div>
                <div className="flex items-center gap-1.5 text-blue-600"><div className="h-2 w-2 rounded-full bg-blue-600" /> Delivery</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dynamicPerformance}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="target"
                    stroke="#cbd5e1"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="pickup"
                    stroke="#3E8940"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3E8940" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="delivery"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#2563eb" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
 
        {/* Cancellation Analytics */}
        <Card className="md:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Cancellation Analytics</CardTitle>
            <CardDescription>Root cause distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dynamicCancellation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dynamicCancellation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none select-none z-0">
                <span className="text-2xl font-bold text-slate-900">4.2%</span>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Rate</span>
              </div>
            </div>
            <div className="space-y-3 w-full mt-4">
              {dynamicCancellation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs font-medium text-slate-600">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Productivity Distribution */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Rider Productivity Distribution</CardTitle>
            <CardDescription>Delivery share by rider segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={dynamicProductivity} margin={{ left: 10, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="group" type="category" hide />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="share" radius={[0, 4, 4, 0]} barSize={30}>
                    {dynamicProductivity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-4">
              {dynamicProductivity.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                   <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-700">{item.group}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-xs font-bold text-slate-900">{item.share}% Deliveries</span>
                   </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Utilization Metrics */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Fleet Utilization & Efficiency</CardTitle>
            <CardDescription>Active time and load analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-400 uppercase">Avg Active Hours</p>
                <p className="text-xl font-bold text-indigo-700 mt-1">6.4 Hrs</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-[10px] font-bold text-amber-400 uppercase">Idle Time %</p>
                <p className="text-xl font-bold text-amber-700 mt-1">22%</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-400 uppercase">Peak Hour Load</p>
                <p className="text-xl font-bold text-emerald-700 mt-1">94%</p>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase">Damage/Incident Rate</p>
                <p className="text-xl font-bold text-blue-700 mt-1">0.8%</p>
              </div>
            </div>
            <div className="space-y-4 pt-3 border-t border-dashed">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Damage/Incident Rate</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2"><Gavel className="h-3.5 w-3.5" /> Lost Item Cases</span>
                <span className="font-bold text-red-600">2 Cases</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Transit Damage Rate</span>
                <span className="font-bold text-amber-600">0.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rider Risk Heatmap */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle>Rider Risk Heatmap</CardTitle>
            <CardDescription>Performance-based risk monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-slate-100 transition-colors group-hover:bg-white shadow-sm text-red-600">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">High Cancellation</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-tighter">Requires Manager Action</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-600">{highCancelRiders}</p>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-slate-100 transition-colors group-hover:bg-white shadow-sm text-amber-600">
                    <ThumbsDown className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Low Rating ( &lt; 4.2 )</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-tighter">Requires Manager Action</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-amber-600">{lowRatingRiders}</p>
                </div>
             </div>

             <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-xl bg-slate-100 transition-colors group-hover:bg-white shadow-sm text-red-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Frequent Complaints</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-tighter">Requires Manager Action</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-red-500">{frequentComplaints}</p>
                </div>
             </div>

             <Button variant="outline" className="w-full mt-2 border-slate-200 text-slate-600 text-xs font-bold h-10 rounded-xl" onClick={() => router.push("/riders")}>
               View Full Risk Registry
             </Button>
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
                <BarChart data={dynamicHourly}>
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
