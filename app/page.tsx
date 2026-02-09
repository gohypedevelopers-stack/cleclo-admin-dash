"use client";

import {
  Users,
  ClipboardList,
  Store,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

// Mock data
const stats = [
  {
    title: "Total Orders",
    value: "1,284",
    change: "+12%",
    trend: "up",
    icon: ClipboardList,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Active Users",
    value: "8,942",
    change: "+5.2%",
    trend: "up",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Active Vendors",
    value: "124",
    change: "+3",
    trend: "up",
    icon: Store,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Revenue",
    value: "₹4,82,500",
    change: "+18%",
    trend: "up",
    icon: Wallet,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

const recentOrders = [
  {
    id: "ORD-8291",
    customer: "Alice Freeman",
    vendor: "Clean Express",
    status: "Processing",
    amount: "₹450",
    time: "5 min ago",
  },
  {
    id: "ORD-8292",
    customer: "Mark Wilson",
    vendor: "Sparkle Wash",
    status: "Pending",
    amount: "₹280",
    time: "12 min ago",
  },
  {
    id: "ORD-8293",
    customer: "Sarah Jenkins",
    vendor: "Fresh Laundry",
    status: "Delivered",
    amount: "₹620",
    time: "1 hour ago",
  },
  {
    id: "ORD-8294",
    customer: "James Doe",
    vendor: "Quick Clean",
    status: "Issue Reported",
    amount: "₹380",
    time: "2 hours ago",
  },
];

const pendingVendors = [
  { name: "Fresh Fold Services", location: "Mumbai", applied: "2 days ago" },
  { name: "Urban Laundry Co", location: "Delhi", applied: "3 days ago" },
];

const issueAlerts = [
  {
    orderId: "ORD-8294",
    type: "Customer No-Show",
    vendor: "Quick Clean",
    time: "2 hours ago",
  },
  {
    orderId: "ORD-8287",
    type: "Item Damaged",
    vendor: "Clean Express",
    time: "5 hours ago",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-yellow-100 text-yellow-700";
    case "Pending":
      return "bg-blue-100 text-blue-700";
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Issue Reported":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleGenerateReport = () => {
    toast.success("Report generation started", {
      description: "You will receive an email once the report is ready.",
    });
  };

  const handleViewAnalytics = () => {
    router.push("/analytics");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-[#3E8940] mt-1 font-medium">
            Overview of your platform&apos;s performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 text-slate-700 border-slate-200 hover:bg-slate-50"
            onClick={handleGenerateReport}
          >
            Generate Report
          </Button>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 text-white shadow-sm"
            onClick={handleViewAnalytics}
          >
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <Badge
                variant="secondary"
                className={`${
                  stat.trend === "up"
                    ? "text-green-700 bg-green-50"
                    : "text-red-700 bg-red-50"
                } font-medium border-none`}
              >
                {stat.trend === "up" ? "+" : ""}
                {stat.change}
              </Badge>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {stat.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Button
              variant="ghost"
              className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50"
              onClick={() => router.push("/orders")}
            >
              View All
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-100">
                <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-3">
                  Order ID
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-3">
                  Customer
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-3">
                  Vendor
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-3">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#3E8940] py-3 text-right">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 cursor-pointer transition-colors"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="font-bold text-slate-900">
                    #{order.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {order.customer}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {order.vendor}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(
                        order.status,
                      )} border-none font-semibold px-2.5 py-0.5 rounded-full`}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {order.amount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Vendor Approvals */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Pending Approvals
              </h3>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold px-2 rounded-full">
                {pendingVendors.length}
              </Badge>
            </div>
            <div className="space-y-4">
              {pendingVendors.map((vendor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:shadow-sm"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      {vendor.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {vendor.location} • {vendor.applied}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#3E8940] hover:bg-[#3E8940]/90 h-8 text-xs font-semibold shadow-sm px-4"
                    onClick={() => router.push(`/vendors/review/${idx}`)}
                  >
                    Review
                  </Button>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full mt-4 text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/90 hover:bg-green-50"
              onClick={() => router.push("/vendors")}
            >
              View All Vendors
            </Button>
          </div>

          {/* Issue Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Issue Alerts
              </h3>
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-2 rounded-full">
                {issueAlerts.length}
              </Badge>
            </div>
            <div className="space-y-3">
              {issueAlerts.map((issue, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-red-50/50 rounded-xl border border-red-100/50 hover:bg-red-50 transition-colors cursor-pointer group"
                  onClick={() => router.push(`/support/${issue.orderId}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-md group-hover:bg-red-200 transition-colors">
                      #{issue.orderId}
                    </span>
                    <span className="text-[10px] font-medium text-red-500">
                      {issue.time}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-red-700 mb-0.5">
                    {issue.type}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    Vendor: {issue.vendor}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
