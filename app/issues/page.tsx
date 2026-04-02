"use client";

import React from "react";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreVertical,
  ShieldAlert,
  MessageSquare,
  User,
  Phone,
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  UserPlus,
  ArrowUpCircle,
  MessageSquareShare,
  PhoneCall,
  IndianRupee,
  TrendingDown,
  MapPin,
  Calendar,
  Layers,
  Activity
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const allIssues = [
  {
    id: "ISS-101",
    orderId: "ORD-8287",
    time: "5 hours ago",
    type: "Item Damaged",
    severity: "Critical",
    vendor: "Clean Express",
    customer: "Robert Fox",
    contact: "+91 87654 32109",
    description: "Customer reported that a silk shirt was returned with a visible tear near the collar. Vendor claims it was received in this condition.",
    status: "Open",
    city: "Mumbai",
    date: "2026-03-25",
    financialRisk: {
      label: "Estimated Refund Risk",
      amount: "₹620",
      type: "Refund"
    },
    vendorRisk: {
      level: "High",
      reason: "5+ damage complaints this week"
    }
  },
  {
    id: "ISS-102",
    orderId: "ORD-8295",
    time: "1 hour ago",
    type: "Customer Complaint",
    severity: "High",
    vendor: "Sparkle Wash",
    customer: "Sarah Jenkins",
    contact: "+91 76543 21098",
    description: "Customer complained about a missing item (a pair of socks) from their laundry bag. Vendor is checking CCTV.",
    status: "Investigating",
    city: "Delhi",
    date: "2026-03-24",
    financialRisk: {
      label: "Estimated Refund Risk",
      amount: "₹250",
      type: "Refund"
    },
    vendorRisk: {
      level: "Medium",
      reason: "High refund rate (12%)"
    }
  },
  {
    id: "ISS-103",
    orderId: "ORD-8299",
    time: "30 mins ago",
    type: "Pickup Delay",
    severity: "Medium",
    vendor: "Fresh Laundry",
    customer: "Mark Wilson",
    contact: "+91 98765 43210",
    description: "Pickup was scheduled for 10 AM but the rider hasn't reached yet. Vendor is non-responsive to the rider's calls.",
    status: "Open",
    city: "Mumbai",
    date: "2026-03-25",
    financialRisk: {
      label: "Service Recovery Cost",
      amount: "₹150",
      type: "Credit"
    },
    vendorRisk: null
  },
  {
    id: "ISS-104",
    orderId: "ORD-8294",
    time: "2 hours ago",
    type: "Customer No-Show",
    severity: "Low",
    vendor: "Quick Clean",
    customer: "James Doe",
    contact: "+91 98765 43210",
    description: "The rider reached the location but the customer was not available and didn't pick up the call after multiple attempts.",
    status: "Resolved",
    city: "Bangalore",
    date: "2026-03-24",
    financialRisk: {
      label: "Potential Penalty",
      amount: "₹100",
      type: "Penalty"
    },
    vendorRisk: {
      level: "High",
      reason: "Frequent no-shows reported"
    }
  },
];

const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "Critical":
      return "bg-red-50 text-red-700 border-red-100 ring-red-500";
    case "High":
      return "bg-orange-50 text-orange-700 border-orange-100 ring-orange-500";
    case "Medium":
      return "bg-yellow-50 text-yellow-700 border-yellow-100 ring-yellow-500";
    case "Low":
      return "bg-green-50 text-green-700 border-green-100 ring-green-500";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100 ring-slate-500";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "Critical":
      return <AlertCircle className="h-3 w-3 fill-red-500" />;
    case "High":
      return <AlertTriangle className="h-3 w-3 fill-orange-500" />;
    case "Medium":
      return <Clock className="h-3 w-3 fill-yellow-500" />;
    case "Low":
      return <CheckCircle className="h-3 w-3 fill-green-500" />;
    default:
      return null;
  }
};

export default function IssuesPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [severityFilter, setSeverityFilter] = React.useState("all");
  const [cityFilter, setCityFilter] = React.useState("all");
  const [vendorFilter, setVendorFilter] = React.useState("all");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [dateRangeFilter, setDateRangeFilter] = React.useState("all");
  const [selectedIssue, setSelectedIssue] = React.useState<any>(null);

  const filteredIssues = allIssues.filter((issue) => {
    const matchesSearch = 
      issue.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.customer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === "all" || issue.severity === severityFilter;
    const matchesCity = cityFilter === "all" || issue.city === cityFilter;
    const matchesVendor = vendorFilter === "all" || issue.vendor === vendorFilter;
    const matchesType = typeFilter === "all" || issue.type === typeFilter;
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    
    // Simple date range matching (mock)
    let matchesDate = true;
    if (dateRangeFilter === "today") matchesDate = issue.date === "2026-03-25";
    else if (dateRangeFilter === "yesterday") matchesDate = issue.date === "2026-03-24";
    
    return matchesSearch && matchesSeverity && matchesCity && matchesVendor && matchesType && matchesStatus && matchesDate;
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Issue Alerts</h1>
            <p className="text-sm font-medium text-slate-500">Manage and resolve platform-wide operational issues</p>
          </div>
        </div>
      </div>

      {/* Stats Summary Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Critical Issues", count: 1, color: "text-red-600", bg: "bg-red-50" },
          { label: "High Priority", count: 1, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Pending Investigation", count: 2, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Resolved Today", count: 12, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
            <div className="flex items-end justify-between">
              <span className={`text-3xl font-bold ${stat.color}`}>{stat.count}</span>
              <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity`}>
                <ChevronRight className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar (Enhanced) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[#3E8940] transition-colors" />
            <Input 
              placeholder="Search by Order ID, Vendor, or Customer..." 
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-[#3E8940]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-[#3E8940] font-bold gap-2 hover:bg-green-50 rounded-xl h-11" onClick={() => {
            setSearchQuery("");
            setSeverityFilter("all");
            setCityFilter("all");
            setVendorFilter("all");
            setTypeFilter("all");
            setStatusFilter("all");
            setDateRangeFilter("all");
          }}>
            Reset All
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Cities" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Mumbai">Mumbai</SelectItem>
              <SelectItem value="Delhi">Delhi</SelectItem>
              <SelectItem value="Bangalore">Bangalore</SelectItem>
            </SelectContent>
          </Select>

          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Store className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="All Vendors" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              <SelectItem value="Clean Express">Clean Express</SelectItem>
              <SelectItem value="Sparkle Wash">Sparkle Wash</SelectItem>
              <SelectItem value="Fresh Laundry">Fresh Laundry</SelectItem>
              <SelectItem value="Quick Clean">Quick Clean</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Layers className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Issue Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Item Damaged">Item Damaged</SelectItem>
              <SelectItem value="Customer Complaint">Customer Complaint</SelectItem>
              <SelectItem value="Pickup Delay">Pickup Delay</SelectItem>
              <SelectItem value="Customer No-Show">Customer No-Show</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Activity className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Escalated">Escalated</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
            <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-medium">
              <div className="flex items-center gap-2 truncate">
                <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Date Range" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-50">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px] h-8 bg-slate-50 border-none rounded-full text-[10px] font-bold uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-slate-400 shrink-0" />
                <SelectValue placeholder="Severity" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical" className="text-red-600 font-bold text-xs uppercase">Critical</SelectItem>
              <SelectItem value="High" className="text-orange-600 font-bold text-xs uppercase">High</SelectItem>
              <SelectItem value="Medium" className="text-yellow-600 font-bold text-xs uppercase">Medium</SelectItem>
              <SelectItem value="Low" className="text-emerald-600 font-bold text-xs uppercase">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-b border-slate-100 hover:bg-transparent">
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Issue ID</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Order Detail</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Issue Category</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Severity</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Financial Impact</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider">Vendor Involved</TableHead>
              <TableHead className="font-bold text-slate-400 uppercase text-[10px] py-4 px-6 tracking-wider text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIssues.map((issue) => (
              <TableRow 
                key={issue.id} 
                className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                onClick={() => setSelectedIssue(issue)}
              >
                <TableCell className="font-bold text-slate-900 py-5 px-6">
                  {issue.id}
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">#{issue.orderId}</span>
                    <span className="text-xs text-slate-400">{issue.time}</span>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <span className="font-semibold text-slate-600 text-sm whitespace-nowrap">{issue.type}</span>
                </TableCell>
                <TableCell className="py-5 px-6">
                  <Badge className={`
                    ${getSeverityStyles(issue.severity)}
                    border px-2 py-0.5 rounded-md font-bold text-[10px] gap-1.5 shadow-none
                  `}>
                    {getSeverityIcon(issue.severity)}
                    {issue.severity}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-6">
                  {issue.financialRisk && (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{issue.financialRisk.label}</span>
                      <span className={`text-sm font-bold flex items-center gap-0.5 ${
                        issue.financialRisk.type === 'Refund' || issue.financialRisk.type === 'Penalty' ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {issue.financialRisk.amount}
                      </span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="py-5 px-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-slate-300" />
                      <span className="font-medium text-slate-700">{issue.vendor}</span>
                    </div>
                    {issue.vendorRisk && (
                      <Badge variant="outline" className={`
                        text-[9px] font-bold border-none px-1.5 py-0 h-4 bg-transparent
                        ${issue.vendorRisk.level === 'High' ? 'text-red-500' : 'text-orange-500'}
                      `}>
                        ⚠️ Risk: {issue.vendorRisk.level}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-5 px-6 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 group-hover:bg-slate-100" onClick={(e) => e.stopPropagation()}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl border-slate-100 shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">Quick Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer group/item" onClick={(e) => {
                        e.stopPropagation();
                        toast.info("Navigating to Order details...");
                      }}>
                        <ExternalLink className="h-4 w-4 text-slate-400 group-hover/item:text-[#3E8940]" />
                        <span className="text-sm font-medium">View Order</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer group/item text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Issue marked as resolved");
                      }}>
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-bold">Mark Resolved</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem className="flex items-center gap-2 py-2.5 px-3 cursor-pointer group/item text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => {
                        e.stopPropagation();
                        toast.error("Issue escalated to senior management");
                      }}>
                        <ArrowUpCircle className="h-4 w-4" />
                        <span className="text-sm font-bold">Escalate Issue</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredIssues.length === 0 && (
          <div className="py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Search className="h-8 w-8 text-slate-200" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No issues found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* Issue Detail Dialog (Reused from dashboard) */}
      <Dialog open={!!selectedIssue} onOpenChange={() => setSelectedIssue(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedIssue && (
            <>
              <DialogHeader className={`p-6 border-b flex-row items-center gap-4 space-y-0 ${
                selectedIssue.severity === 'Critical' ? 'bg-red-50/50 border-red-100' : 
                selectedIssue.severity === 'High' ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50/50 border-slate-100'
              }`}>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  selectedIssue.severity === 'Critical' ? 'bg-red-100 text-red-600' : 
                  selectedIssue.severity === 'High' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'
                }`}>
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-bold text-slate-900 leading-tight">
                      {selectedIssue.type}
                    </DialogTitle>
                    {selectedIssue.vendorRisk && (
                      <Badge className="bg-red-600 border-none shadow-none text-white font-bold h-5 px-1.5 text-[10px]">
                        HIGH RISK VENDOR
                      </Badge>
                    )}
                  </div>
                  <DialogDescription className="text-slate-500 font-medium">
                    Order #{selectedIssue.orderId} • {selectedIssue.city} • {selectedIssue.time}
                  </DialogDescription>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">Urgency Level</span>
                  <Badge className={`
                    ${getSeverityStyles(selectedIssue.severity)} 
                    border font-bold px-3 py-1 rounded-full text-xs shadow-none
                  `}>
                    {selectedIssue.severity}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    Issue Description
                  </h4>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-medium">
                    {selectedIssue.description}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer</p>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <User className="h-4 w-4 text-slate-400" />
                      {selectedIssue.customer}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor</p>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <Store className="h-4 w-4 text-slate-400" />
                        {selectedIssue.vendor}
                      </div>
                      {selectedIssue.vendorRisk && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit border border-red-100 italic">
                          <AlertTriangle className="h-3 w-3" />
                          {selectedIssue.vendorRisk.reason}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedIssue.financialRisk && (
                  <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">{selectedIssue.financialRisk.label}</p>
                        <p className="text-xl font-bold text-red-700">{selectedIssue.financialRisk.amount}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-red-200 text-red-600 font-bold bg-white">
                      Risk Area
                    </Badge>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    Action Center
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs"
                      onClick={() => toast.info(`Viewing Order #${selectedIssue.orderId}`)}
                    >
                      <ExternalLink className="h-4 w-4 text-slate-400" />
                      View Order
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs"
                      onClick={() => toast.info(`Connecting to ${selectedIssue.vendor}...`)}
                    >
                      <MessageSquareShare className="h-4 w-4 text-slate-400" />
                      Contact Vendor
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs"
                      onClick={() => toast.info(`Calling ${selectedIssue.customer}...`)}
                    >
                      <PhoneCall className="h-4 w-4 text-slate-400" />
                      Call Customer
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-10 rounded-xl justify-start gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs"
                      onClick={() => toast.info("Select team member to assign...")}
                    >
                      <UserPlus className="h-4 w-4 text-slate-400" />
                      Assign Team
                    </Button>
                  </div>
                </div>

                <DialogFooter className="flex gap-3 pt-4 border-t border-slate-50 sm:justify-start">
                  <Button 
                    className="flex-1 font-bold h-11 rounded-xl shadow-lg bg-[#3E8940] hover:bg-[#3E8940]/90 border-b-4 border-[#2E6B2F] active:border-b-0 active:translate-y-1 transition-all text-white"
                    onClick={() => {
                      toast.success("Issue resolved successfully!");
                      setSelectedIssue(null);
                    }}
                  >
                    Mark as Resolved
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="flex-1 font-bold h-11 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                    onClick={() => {
                      toast.error("This issue has been escalated.");
                      setSelectedIssue(null);
                    }}
                  >
                    Escalate
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
