"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Download,
  TrendingUp,
  Users,
  ShoppingBag,
  IndianRupee,
  Activity,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// Mock Data
const revenueData = [
  { name: "Jan", revenue: 45000, orders: 320 },
  { name: "Feb", revenue: 52000, orders: 350 },
  { name: "Mar", revenue: 48000, orders: 330 },
  { name: "Apr", revenue: 61000, orders: 420 },
  { name: "May", revenue: 55000, orders: 380 },
  { name: "Jun", revenue: 67000, orders: 450 },
  { name: "Jul", revenue: 72000, orders: 480 },
  { name: "Aug", revenue: 65000, orders: 440 },
  { name: "Sep", revenue: 78000, orders: 520 },
  { name: "Oct", revenue: 85000, orders: 580 },
  { name: "Nov", revenue: 92000, orders: 630 },
  { name: "Dec", revenue: 88000, orders: 600 },
];

const categoryData = [
  { name: "Dry Clean", value: 45, color: "#3E8940" },
  { name: "Wash & Fold", value: 30, color: "#22c55e" },
  { name: "Ironing", value: 15, color: "#86efac" },
  { name: "Premium", value: 10, color: "#14532d" },
];

const customerGrowthData = [
  { name: "Week 1", new: 120, returning: 450 },
  { name: "Week 2", new: 132, returning: 480 },
  { name: "Week 3", new: 145, returning: 510 },
  { name: "Week 4", new: 160, returning: 550 },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Analytics & Reports
          </h1>
          <p className="text-[#3E8940] mt-1 font-medium">
            Detailed insights into your business performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="this_year">
            <SelectTrigger className="w-[140px] bg-white border-slate-200">
              <Calendar className="w-4 h-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Total Revenue
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-[#3E8940]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹8,45,230</div>
            <div className="flex items-center text-xs mt-1">
              <span className="text-green-600 font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                +20.1%
              </span>
              <span className="text-slate-400 ml-2">from last year</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Active Orders
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,234</div>
            <div className="flex items-center text-xs mt-1">
              <span className="text-green-600 font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                +15%
              </span>
              <span className="text-slate-400 ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              New Users
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">573</div>
            <div className="flex items-center text-xs mt-1">
              <span className="text-green-600 font-medium flex items-center bg-green-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2%
              </span>
              <span className="text-slate-400 ml-2">new signups</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
              Engagement Rate
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Activity className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">24.5%</div>
            <div className="flex items-center text-xs mt-1">
              <span className="text-red-500 font-medium flex items-center bg-red-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                -2%
              </span>
              <span className="text-slate-400 ml-2">bounce rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="lg:col-span-5 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">
              Revenue Overview
            </CardTitle>
            <CardDescription>
              Monthly revenue comparison with order volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3E8940" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3E8940" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ display: "none" }}
                    formatter={(value) => [`₹${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3E8940"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Service Category Pie Chart */}
        <Card className="lg:col-span-2 border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">
              Service Distribution
            </CardTitle>
            <CardDescription>Orders by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="text-3xl font-bold text-slate-900">
                    4.5k
                  </span>
                  <p className="text-xs text-slate-500 uppercase font-semibold">
                    Total
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {categoryData.map((category) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm text-slate-600 font-medium">
                    {category.name}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Bar Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">
              User Growth
            </CardTitle>
            <CardDescription>New vs Returning Customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerGrowthData} barGap={8}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    dy={10}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="new"
                    name="New Users"
                    fill="#3E8940"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="returning"
                    name="Returning"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                  />
                  <Legend iconType="circle" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#3E8940] text-white border-none shadow-md overflow-hidden relative">
          <div className="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>

          <CardHeader className="relative z-10">
            <CardTitle className="text-2xl font-bold">
              Premium Plan Insights
            </CardTitle>
            <CardDescription className="text-green-100">
              Upgrade to view predictive analytics and AI-driven
              recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span>Predicted 30-Day Revenue</span>
                <span className="font-bold text-xl">₹9.2L</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                <span>Customer Retention Score</span>
                <span className="font-bold text-xl">94/100</span>
              </div>
            </div>
            <Button className="w-full mt-8 bg-white text-[#3E8940] hover:bg-slate-100 font-bold shadow-lg">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
