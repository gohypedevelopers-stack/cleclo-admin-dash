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
  Calendar,
  Filter,
  IndianRupee,
  HandCoins,
  Activity,
  User,
  Phone,
  MapPin,
  MessageSquare,
  ShieldAlert,
  X,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import React from "react";

// Mock data
const stats = [
  {
    title: "Orders Today",
    value: "42",
    change: "+8%",
    trend: "up",
    icon: ClipboardList,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    category: "Today",
  },
  {
    title: "Revenue Today",
    value: "₹18,450",
    change: "+15%",
    trend: "up",
    icon: IndianRupee,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    category: "Today",
  },
  {
    title: "Avg Order Value (AOV)",
    value: "₹439",
    change: "+2%",
    trend: "up",
    icon: TrendingUp,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    category: "Today",
  },
  {
    title: "Pending Orders",
    value: "18",
    change: "-4",
    trend: "down",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    category: "Operations",
  },
  {
    title: "Issue Reported Count",
    value: "3",
    change: "+1",
    trend: "up",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    category: "Operations",
  },
  {
    title: "Gross Platform Revenue (This Month)",
    value: "₹4,82,500",
    change: "+18%",
    trend: "up",
    icon: Wallet,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    category: "Finance",
  },
  {
    title: "Net Commission Earned",
    value: "₹72,375",
    change: "+12%",
    trend: "up",
    icon: TrendingUp,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    category: "Finance",
  },
  {
    title: "Vendor Payout Due",
    value: "₹1,24,000",
    change: "Next: Mar 28",
    trend: "neutral",
    icon: HandCoins,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    category: "Finance",
  },
  {
    title: "Settlement Pending Amount",
    value: "₹48,200",
    change: "8 Orders",
    trend: "neutral",
    icon: Activity,
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    category: "Finance",
  },
];

const financeStats = [
  {
    title: "Total Vendor Payout Due",
    value: "₹1,24,000",
    description: "Scheduled for Mar 28",
    icon: HandCoins,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    title: "Settlements Pending",
    value: "₹48,200",
    description: "8 Orders awaiting sync",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    title: "Settlements Completed",
    value: "₹3,10,300",
    description: "Last 30 days",
    icon: CheckCircle,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Failed Transactions",
    value: "₹2,150",
    description: "3 Retries in progress",
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
];

const recentOrders = [
  {
    id: "ORD-8291",
    customer: "Alice Freeman",
    vendor: "Clean Express",
    status: "Processing",
    location: "Andheri, Mumbai",
    paymentStatus: "Paid",
    orderType: "Express",
    pickupSlot: "10:00 - 12:00",
    deliveryEta: "Today, 08:00 PM",
    amount: "₹450",
    phone: "+91 98765 43210",
    transactionId: "TXN-90210",
  },
  {
    id: "ORD-8292",
    customer: "Mark Wilson",
    vendor: "Sparkle Wash",
    status: "Pending",
    location: "Bandra, Mumbai",
    paymentStatus: "Paid",
    orderType: "Regular",
    pickupSlot: "14:00 - 16:00",
    deliveryEta: "Tomorrow, 10:00 AM",
    amount: "₹280",
    phone: "+91 87654 32109",
    transactionId: "TXN-90211",
  },
  {
    id: "ORD-8293",
    customer: "Sarah Jenkins",
    vendor: "Fresh Laundry",
    status: "Delivered",
    location: "Powai, Mumbai",
    paymentStatus: "Paid",
    orderType: "Regular",
    pickupSlot: "09:00 - 11:00",
    deliveryEta: "Delivered",
    amount: "₹620",
    phone: "+91 76543 21098",
    transactionId: "TXN-90212",
  },
  {
    id: "ORD-8294",
    customer: "James Doe",
    vendor: "Quick Clean",
    status: "Issue Reported",
    location: "Juhu, Mumbai",
    paymentStatus: "Refunded",
    orderType: "Express",
    pickupSlot: "11:00 - 13:00",
    deliveryEta: "Delayed",
    amount: "₹380",
    phone: "+91 65432 10987",
    transactionId: "TXN-90213",
  },
];

const pendingVendors = [
  { name: "Fresh Fold Services", location: "Mumbai", applied: "2 days ago" },
  { name: "Urban Laundry Co", location: "Delhi", applied: "3 days ago" },
];

const issueAlerts = [
  {
    orderId: "ORD-8287",
    time: "5 hours ago",
    type: "Item Damaged",
    vendor: "Clean Express",
    customer: "Robert Fox",
    contact: "+91 87654 32109",
    description: "Customer reported that a silk shirt was returned with a visible tear near the collar. Vendor claims it was received in this condition.",
    location: "Andheri, Mumbai",
    priority: "Critical",
  },
  {
    orderId: "ORD-8295",
    time: "1 hour ago",
    type: "Customer Complaint",
    vendor: "Sparkle Wash",
    customer: "Sarah Jenkins",
    contact: "+91 76543 21098",
    description: "Customer complained about a missing item (a pair of socks) from their laundry bag. Vendor is checking CCTV.",
    location: "Bandra, Mumbai",
    priority: "High",
  },
  {
    orderId: "ORD-8294",
    time: "2 hours ago",
    type: "Customer No-Show",
    vendor: "Quick Clean",
    customer: "James Doe",
    contact: "+91 98765 43210",
    description: "The rider reached the location but the customer was not available and didn't pick up the call after multiple attempts.",
    location: "Juhu, Mumbai",
    priority: "Low",
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

const getPaymentStatusColor = (status: string) => {
  return status === "Paid"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-red-50 text-red-700";
};

const getOrderTypeColor = (type: string) => {
  return type === "Express"
    ? "bg-purple-50 text-purple-700"
    : "bg-blue-50 text-blue-700";
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [timeRange, setTimeRange] = React.useState("today");
  const [selectedIssue, setSelectedIssue] = React.useState<any>(null);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleGenerateReport = () => {
    toast.success("Report generation started", {
      description: "You will receive an email once the report is ready.",
    });
  };

  const handleViewAnalytics = () => {
    router.push("/analytics");
  };

  // Update mock data with dates for filtering
  const updatedOrders = recentOrders.map((order, idx) => ({
    ...order,
    date: idx === 0 ? "2026-03-25" : idx === 1 ? "2026-03-24" : idx === 2 ? "2026-03-23" : "2026-03-22",
    city: order.location.split(", ")[1] || order.location,
  }));

  const filteredOrders = updatedOrders.filter((order) => {
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesVendor = vendorFilter === "all" || order.vendor === vendorFilter;
    const matchesCity = cityFilter === "all" || order.city === cityFilter;
    const matchesDate = !dateFilter || order.date === dateFilter;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchLower) ||
      order.customer.toLowerCase().includes(searchLower) ||
      order.vendor.toLowerCase().includes(searchLower) ||
      order.city.toLowerCase().includes(searchLower) ||
      (order.phone && order.phone.includes(searchQuery)) ||
      (order.transactionId && order.transactionId.toLowerCase().includes(searchLower));

    return matchesStatus && matchesVendor && matchesCity && matchesDate && matchesSearch;
  });

  const uniqueVendors = Array.from(new Set(updatedOrders.map((o) => o.vendor)));
  const uniqueCities = Array.from(new Set(updatedOrders.map((o) => o.city)));
  const uniqueStatuses = Array.from(new Set(updatedOrders.map((o) => o.status)));

  const handleClearFilters = () => {
    setStatusFilter("all");
    setVendorFilter("all");
    setCityFilter("all");
    setDateFilter("");
    setSearchQuery("");
  };
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-[#3E8940] mt-1 font-medium italic">
            Visualizing Platform Performance & Financial Metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px] h-10 bg-white border-slate-200 text-slate-700 font-medium rounded-xl">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#3E8940]" />
                <SelectValue placeholder="Select period" />
              </div>
            </SelectTrigger>
            <SelectContent position="popper" sideOffset={4} className="w-[180px] rounded-xl border-slate-200 shadow-xl">
              <SelectItem value="today" className="rounded-lg">Today</SelectItem>
              <SelectItem value="yesterday" className="rounded-lg">Yesterday</SelectItem>
              <SelectItem value="week" className="rounded-lg">This Week</SelectItem>
              <SelectItem value="month" className="rounded-lg">This Month</SelectItem>
              <SelectItem value="custom" className="rounded-lg">Custom Date Range</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="h-10 gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 rounded-xl"
            onClick={handleGenerateReport}
          >
            <Filter className="h-4 w-4" />
            Generate Report
          </Button>
          <Button
            className="h-10 gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 text-white shadow-sm rounded-xl"
            onClick={handleViewAnalytics}
          >
            <Activity className="h-4 w-4" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Stats Cards Sections */}
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.slice(0, 5).map((stat) => (
            <div
              key={stat.title}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <Badge
                  variant="secondary"
                  className={`${
                    stat.trend === "up"
                      ? "text-green-700 bg-green-50"
                      : stat.trend === "down"
                      ? "text-red-700 bg-red-50"
                      : "text-slate-600 bg-slate-50"
                  } font-bold text-[10px] border-none px-2`}
                >
                  {stat.trend === "up" ? "↑" : stat.trend === "down" ? "↓" : "•"}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {stat.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Finance Section Separator */}
        <div className="flex items-center gap-4 py-2">
          <div className="h-px bg-slate-100 flex-1" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Financial Insights</span>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.slice(5).map((stat) => (
            <div
              key={stat.title}
              className="bg-linear-to-br from-white to-slate-50/50 rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <Badge
                  variant="secondary"
                  className={`${
                    stat.trend === "up"
                      ? "text-green-700 bg-green-50"
                      : "text-slate-600 bg-slate-50"
                  } font-bold text-[10px] border-none px-2`}
                >
                  {stat.trend === "up" ? "↑" : ""}
                  {stat.change}
                </Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1 leading-tight">
                  {stat.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Snapshot Widget */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Wallet className="h-32 w-32 text-[#3E8940]" />
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Settlement & Finance Snapshot</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">Real-time overview of platform liquidity and vendor payouts</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
            <TrendingUp className="h-4 w-4 text-[#3E8940]" />
            Full Report
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {financeStats.map((stat: any, idx: number) => (
            <div key={idx} className="relative p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-transparent transition-all duration-300 group/card">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${stat.bgColor} group-hover/card:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <p className="text-[10px] font-medium text-slate-500 pt-1 flex items-center gap-1">
                  {stat.description}
                </p>
              </div>

              {/* Decorative progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden rounded-b-2xl">
                <div className={`h-full w-1/3 opacity-30 ${stat.bgColor.replace('bg-', 'bg-')}`} style={{backgroundColor: 'currentColor'}} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
                <div className="relative group w-64">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
                  <Input
                    placeholder="Search by ID, Phone, Transaction..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="h-8 pl-9 bg-slate-50 border-slate-100 text-xs rounded-lg focus-visible:ring-1 focus-visible:ring-[#3E8940] transition-all"
                  />
                </div>
              </div>
              <Button
                variant="ghost"
                className="text-sm font-semibold text-[#3E8940] hover:text-[#3E8940]/80 hover:bg-green-50"
                onClick={() => router.push("/orders")}
              >
                View All
              </Button>
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    {uniqueStatuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor:</span>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-[150px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Vendors" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Vendors</SelectItem>
                    {uniqueVendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City:</span>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[130px] h-9 bg-white border-slate-200 text-xs font-medium rounded-lg">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                    <SelectItem value="all">All Cities</SelectItem>
                    {uniqueCities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date:</span>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-[140px] h-9 px-3 bg-white border border-slate-200 text-xs font-medium rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E8940]/20 focus:border-[#3E8940] transition-all"
                />
              </div>

              {(statusFilter !== "all" || vendorFilter !== "all" || cityFilter !== "all" || dateFilter !== "" || searchQuery !== "") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-9 px-3 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-slate-100">
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Order ID
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Customer
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Vendor
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Location
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Type
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Payment
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    Pickup
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 whitespace-nowrap">
                    ETA
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-[#3E8940] py-4 text-right whitespace-nowrap">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-slate-50/80 border-b border-slate-50 last:border-0 cursor-pointer transition-colors"
                    onClick={() => router.push(`/orders/${order.id}`)}
                  >
                    <TableCell className="font-bold text-slate-900 whitespace-nowrap">
                      #{order.id}
                    </TableCell>
                    <TableCell className="font-medium text-slate-700 whitespace-nowrap">
                      {order.customer}
                    </TableCell>
                    <TableCell className="text-slate-600 whitespace-nowrap">
                      {order.vendor}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 whitespace-nowrap font-medium">
                      {order.location}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getOrderTypeColor(
                          order.orderType,
                        )} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}
                      >
                        {order.orderType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(
                          order.status,
                        )} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getPaymentStatusColor(
                          order.paymentStatus,
                        )} border-none text-[10px] font-bold px-2 py-0.5 rounded-md`}
                      >
                        {order.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[11px] font-medium text-slate-600 whitespace-nowrap">
                      {order.pickupSlot}
                    </TableCell>
                    <TableCell className="text-[11px] font-bold text-[#3E8940] whitespace-nowrap">
                      {order.deliveryEta}
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900 whitespace-nowrap">
                      {order.amount}
                    </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-slate-500 font-medium">
                      No orders found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none font-bold px-2 rounded-full">
                  {issueAlerts.length}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-bold text-[#3E8940] hover:bg-green-50 px-2"
                  onClick={() => router.push("/issues")}
                >
                  View Page
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {issueAlerts.map((issue, idx) => {
                const colors = {
                  Critical: "bg-red-50 border-red-100 text-red-700 badge:bg-red-100",
                  High: "bg-orange-50 border-orange-100 text-orange-700 badge:bg-orange-100",
                  Medium: "bg-yellow-50 border-yellow-100 text-yellow-700 badge:bg-yellow-100",
                  Low: "bg-green-50 border-green-100 text-green-700 badge:bg-green-100",
                }[issue.priority as 'Critical' | 'High' | 'Medium' | 'Low'] || "bg-slate-50 border-slate-100 text-slate-700 badge:bg-slate-100";

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-sm ${colors.split('badge:')[0]}`}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-bold text-[10px] px-2 py-0.5 rounded-md transition-colors ${colors.split('badge:')[1]}`}>
                        #{issue.orderId}
                      </span>
                      <span className="text-[10px] font-bold opacity-70">
                        {issue.time}
                      </span>
                    </div>
                    <p className="text-sm font-bold mb-0.5">
                      {issue.type}
                    </p>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-tight">
                      Vendor: {issue.vendor}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Issue Detail Dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedIssue && (
            <>
              <DialogHeader className="p-6 bg-red-50/50 border-b border-red-100 flex-row items-center gap-4 space-y-0">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-red-900 leading-tight">
                    {selectedIssue.type}
                  </DialogTitle>
                  <DialogDescription className="text-red-700/70 font-medium">
                    Order #{selectedIssue.orderId} • {selectedIssue.time}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6">
                {/* Priority Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">Urgency Level</span>
                  <Badge className={`
                    ${selectedIssue.priority === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : 
                      selectedIssue.priority === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      selectedIssue.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                      'bg-green-100 text-green-700 border-green-200'} 
                    font-bold px-3 py-1 rounded-full text-xs shadow-none border
                  `}>
                    {selectedIssue.priority}
                  </Badge>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Issue Description
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedIssue.description}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <User className="h-4 w-4 text-slate-400" />
                      {selectedIssue.customer}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {selectedIssue.contact}
                    </div>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor Involved</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Store className="h-4 w-4 text-slate-400" />
                      {selectedIssue.vendor}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-xl shadow-md border-b-2 border-red-800 active:border-b-0 active:translate-y-0.5 transition-all"
                    onClick={() => {
                      toast.success("Support Ticket Created", {
                        description: `Our team will investigate Order #${selectedIssue.orderId} immediately.`
                      });
                      setSelectedIssue(null);
                    }}
                  >
                    Investigate Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 font-bold h-11 rounded-xl text-slate-600 border-slate-200"
                    onClick={() => setSelectedIssue(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
