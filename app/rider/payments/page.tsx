"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Eye,
  Bike,
  ChevronDown,
  ChevronUp,
  Zap,
  AlertTriangle,
  TrendingUp,
  Wallet,
  History,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  FileText,
  LayoutGrid,
  Target,
  AlertCircle,
  TrendingDown,
  Briefcase,
  DollarSign,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data for Rider Payments
const PAYMENTS = [
  {
    id: "PAY-9021",
    rider: "Rahul Kumar",
    riderId: "RID-104",
    amount: 4250,
    date: "Oct 24, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "HDFC-11293",
    revenue: 18000,
    aging: 12, // hours
    compliance: { pan: true, tds: false, gst: false },
    flags: [],
    breakdown: {
      base: 3200,
      distance: 450,
      peak: 300,
      incentives: 500,
      penalty: 200,
    }
  },
  {
    id: "PAY-9020",
    rider: "Amit Singh",
    riderId: "RID-108",
    amount: 3100,
    date: "Oct 24, 2024",
    status: "Processing",
    method: "UPI",
    reference: "UPI-44920",
    revenue: 12500,
    aging: 36,
    compliance: { pan: true, tds: true, gst: false },
    flags: ["High Cancellation"],
    breakdown: {
      base: 2400,
      distance: 300,
      peak: 200,
      incentives: 400,
      penalty: 200,
    }
  },
  {
    id: "PAY-9019",
    rider: "Vikram Malhotra",
    riderId: "RID-102",
    amount: 5600,
    date: "Oct 23, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "ICICI-99201",
    revenue: 22400,
    aging: 48,
    compliance: { pan: true, tds: true, gst: true },
    flags: ["Unusual Spike"],
    breakdown: {
      base: 4200,
      distance: 800,
      peak: 400,
      incentives: 600,
      penalty: 400,
    }
  },
  {
    id: "PAY-9018",
    rider: "Suresh Patel",
    riderId: "RID-111",
    amount: 2890,
    date: "Oct 22, 2024",
    status: "Failed",
    method: "Bank Transfer",
    reference: "SBI-77281",
    revenue: 9800,
    aging: 72,
    compliance: { pan: false, tds: false, gst: false },
    flags: ["Duplicate Bank"],
    breakdown: {
      base: 2100,
      distance: 300,
      peak: 200,
      incentives: 300,
      penalty: 10,
    }
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-green-100 text-green-700 border-none font-medium gap-1.5 hover:bg-green-100">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "Processing":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-none font-medium gap-1.5 hover:bg-amber-100">
          <Clock className="h-3 w-3" />
          Processing
        </Badge>
      );
    case "Failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-none font-medium gap-1.5 hover:bg-red-100">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

import { useRouter, useSearchParams } from "next/navigation";

export default function RiderPaymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [payoutCycle, setPayoutCycle] = useState("Weekly");

  const [earningsStats] = useState({
    totalEarningsMonth: 145800,
    avgEarningsPerRider: 4860,
    incentivesPaid: 12400,
    pendingPayout: 32150,
  });

  const formatINR = (a: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(a);

  const filteredPayments = PAYMENTS.filter((payment) => {
    const matchesSearch =
      payment.rider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && payment.status === statusFilter;
  });

  const stats = {
    totalPayouts: PAYMENTS.reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: PAYMENTS.filter(p => p.status !== 'Completed').reduce((sum, p) => sum + p.amount, 0),
    pendingCount: PAYMENTS.filter(p => p.status !== 'Completed').length,
    aging24: PAYMENTS.filter(p => p.status !== 'Completed' && p.aging < 24).length,
    aging48: PAYMENTS.filter(p => p.status !== 'Completed' && p.aging >= 24 && p.aging < 48).length,
    agingOver48: PAYMENTS.filter(p => p.status !== 'Completed' && p.aging >= 48).length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl text-black font-bold tracking-tight">Rider Payments</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold py-1">
              Per Delivery + Incentive Model
            </Badge>
          </div>
          <p className="text-slate-500">Track, manage and audit payouts to delivery partners</p>
        </div>
        <div className="flex items-center gap-4">
           <Card className="flex items-center px-4 py-2 gap-3 border-slate-200 bg-white shadow-sm">
             <div className="p-2 rounded-lg bg-slate-100"><Settings className="h-4 w-4 text-slate-600" /></div>
             <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Payout Cycle</p>
                <div className="flex items-center gap-2">
                   <span className="text-sm font-bold text-slate-900">Weekly (Mon)</span>
                   <Button variant="link" className="h-auto p-0 text-[10px] text-emerald-600 font-bold underline decoration-emerald-200 underline-offset-4">Change</Button>
                </div>
             </div>
           </Card>
           <div className="flex gap-2">
            <Button variant="outline" className="gap-2 border-slate-200 h-11">
              <Download className="h-4 w-4" /> Export Report
            </Button>
            <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 h-11 px-6 shadow-lg shadow-emerald-900/10">
              <CreditCard className="h-4 w-4" /> Process Payout
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Total Payouts (Oct)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatINR(stats.totalPayouts)}</div>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tighter">
              Per Delivery + Incentive Model
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Pending Payout Aging
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{formatINR(stats.pendingAmount)}</div>
            <div className="flex items-center gap-3 mt-1.5">
               <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> <span className="text-[10px] font-bold text-slate-500">{stats.aging24}</span></div>
               <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500" /> <span className="text-[10px] font-bold text-slate-500">{stats.aging48}</span></div>
               <div className="flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-red-500" /> <span className="text-[10px] font-bold text-slate-500">{stats.agingOver48}</span></div>
               <span className="text-[10px] text-slate-400 italic">Aging Trend</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Avg Payout per Delivery
            </CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">₹62.4</div>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Total Payout / Deliveries</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 bg-slate-900 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Compliance & Fraud Flags
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 <span className="text-xs font-normal text-slate-400">Issues</span></div>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-900/50 text-[9px] px-1 py-0 font-bold">Duplicate Bank</Badge>
               <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-900/50 text-[9px] px-1 py-0 font-bold">Spike</Badge>
            </div>
           </CardContent>
        </Card>
      </div>

      {/* Earnings & Reconciliation Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {/* Rider Earnings Panel */}
          <Card className="shadow-sm border-slate-200 bg-white overflow-hidden h-full">
            <CardHeader className="border-b bg-slate-50/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#3E8940]" />
                  <CardTitle className="text-lg font-bold text-slate-800">Rider Earnings Panel</CardTitle>
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs gap-2">
                  <FileText className="h-3 w-3" /> Reconciliation Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 h-full">
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Earnings (Month)</p>
                  <p className="text-2xl font-black text-slate-900">₹{earningsStats.totalEarningsMonth.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-green-600 font-bold mt-2">↑ 12.5% vs last month</p>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Earnings / Rider</p>
                  <p className="text-2xl font-black text-slate-900">₹{earningsStats.avgEarningsPerRider.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-2">Target: ₹6,000</p>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Incentives Paid</p>
                  <p className="text-2xl font-black text-indigo-600">₹{earningsStats.incentivesPaid.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-indigo-500 font-bold mt-2">High performance bonuses</p>
                </div>
                <div className="p-6 bg-amber-50/30">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Pending Payout</p>
                  <p className="text-2xl font-black text-amber-700">₹{earningsStats.pendingPayout.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-amber-500 font-bold mt-2">Scheduled for next cycle</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          {/* Rider Payment Reconciliation */}
          <Card className="shadow-sm border-slate-200 bg-white overflow-hidden h-full flex flex-col justify-between">
            <CardHeader className="border-b bg-indigo-50/30 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-indigo-900">Rider Payment Reconciliation</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-slate-100">
                {[
                  { label: "Deliveries Done", value: `${filteredPayments.length * 12 + 4} orders`, icon: Truck, color: "text-blue-600" },
                  { label: "Incentives", value: formatINR(filteredPayments.reduce((sum, p) => sum + p.breakdown.incentives, 0)), icon: Zap, color: "text-amber-600" },
                  { label: "Penalties", value: `-${formatINR(filteredPayments.reduce((sum, p) => sum + p.breakdown.penalty, 0))}`, icon: AlertCircle, color: "text-rose-600" },
                  { label: "Net Payout", value: formatINR(filteredPayments.reduce((sum, p) => sum + p.amount, 0)), icon: Wallet, color: "text-emerald-600", bold: true },
                ].map((item, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                      <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                    </div>
                    <span className={cn("text-xs font-bold text-slate-900", item.bold && "text-emerald-700 font-black text-sm")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search transaction ID, rider, or reference..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Date Range
          </Button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#fbfbfb] hover:bg-[#fbfbfb]">
              <TableHead className="w-10"></TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Transaction Details</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Rider</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Net Payout</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Profitability (Net Margin)</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">Status & Compliance</TableHead>
              <TableHead className="font-semibold text-slate-600 py-4 text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <>
                <TableRow key={payment.id} className={cn("hover:bg-slate-50 cursor-pointer transition-colors", expandedRow === payment.id && "bg-slate-50/80")}>
                  <TableCell className="pl-6">
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpandedRow(expandedRow === payment.id ? null : payment.id)}>
                        {expandedRow === payment.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                     </Button>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">{payment.id}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{payment.date}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-black">{payment.rider}</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{payment.riderId}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                     <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-base">{formatINR(payment.amount)}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase leading-none">Net Payout</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-4">
                     <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                           <span className="font-bold text-emerald-600">{formatINR(payment.revenue - payment.amount)}</span>
                           <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] px-1 h-3 font-black">
                             {Math.round(((payment.revenue - payment.amount)/payment.revenue)*100)}% Margin
                           </Badge>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Revenue: {formatINR(payment.revenue)}</span>
                     </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                       {getStatusBadge(payment.status)}
                       <div className="flex items-center gap-1">
                          {payment.compliance.pan ? <Fingerprint className="h-3.5 w-3.5 text-emerald-500" /> : <ShieldAlert className="h-3.5 w-3.5 text-red-500" />}
                          {payment.compliance.tds && <span title="TDS Applicable"><FileText className="h-3.5 w-3.5 text-blue-500" /></span>}
                          {payment.flags.length > 0 && <span title={payment.flags[0]}><AlertTriangle className="h-3.5 w-3.5 text-amber-500 animate-pulse" /></span>}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2"><Eye className="h-4 w-4" /> View Details</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2"><Download className="h-4 w-4" /> Download Receipt</DropdownMenuItem>
                        {payment.status === 'Failed' && <DropdownMenuItem className="gap-2 text-emerald-600"><History className="h-4 w-4" /> Retry Payout</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                
                {/* Expandable Breakdown Row */}
                {expandedRow === payment.id && (
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-x border-slate-100">
                    <TableCell colSpan={7} className="p-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                          {/* Payment Breakdown */}
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><LayoutGrid className="h-3 w-3" /> Payout Components</h4>
                             <div className="space-y-2.5">
                                {[
                                  { label: "Base Delivery Pay", value: payment.breakdown.base },
                                  { label: "Distance Bonus", value: payment.breakdown.distance },
                                  { label: "Peak Hour Bonus", value: payment.breakdown.peak },
                                  { label: "Incentives", value: payment.breakdown.incentives },
                                ].map((item, i) => (
                                  <div key={i} className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-slate-900">{formatINR(item.value)}</span>
                                  </div>
                                ))}
                                <div className="pt-2 mt-2 border-t border-slate-200 border-dashed flex justify-between text-xs font-black">
                                  <span className="text-red-600 uppercase">Penalty Deduction</span>
                                  <span className="text-red-600">-{formatINR(payment.breakdown.penalty)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-black pt-1">
                                  <span className="text-slate-900">Net Payout</span>
                                  <span className="text-slate-900">{formatINR(payment.amount)}</span>
                                </div>
                             </div>
                          </div>

                          {/* Compliance & Fraud Analysis */}
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Target className="h-3 w-3" /> Audit & Fraud Logs</h4>
                             <div className="space-y-3">
                                <div className={cn("p-3 rounded-xl border flex items-center justify-between", payment.flags.length > 0 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100")}>
                                   <div className="flex items-center gap-2.5">
                                      {payment.flags.length > 0 ? <AlertTriangle className="h-4 w-4 text-amber-600" /> : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                                      <div>
                                         <p className="text-[10px] font-black text-slate-900 uppercase">Fraud Status</p>
                                         <p className="text-[9px] text-slate-500">{payment.flags.length > 0 ? payment.flags.join(", ") : "Clear / No Issues"}</p>
                                      </div>
                                   </div>
                                </div>
                                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                                   <p className="text-[10px] font-black text-slate-900 uppercase">Compliance Thresholds</p>
                                   <div className="flex flex-wrap gap-2">
                                      <Badge className={cn("text-[8px] font-black uppercase", payment.compliance.pan ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700")}>PAN {payment.compliance.pan ? 'Verified' : 'Missing'}</Badge>
                                      <Badge className={cn("text-[8px] font-black uppercase", payment.compliance.tds ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500")}>TDS {payment.compliance.tds ? 'Active' : 'N/A'}</Badge>
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Profitability Index */}
                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Performance Economics</h4>
                             <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4">
                                <div>
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Margin</p>
                                   <p className="text-2xl font-black text-emerald-400">{formatINR(payment.revenue - payment.amount)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase">Revenue Contrib.</p>
                                      <p className="text-xs font-bold">{formatINR(payment.revenue)}</p>
                                   </div>
                                   <div>
                                      <p className="text-[8px] font-bold text-slate-500 uppercase">Payout Ratio</p>
                                      <p className="text-xs font-bold">{Math.round((payment.amount/payment.revenue)*100)}%</p>
                                   </div>
                                </div>
                             </div>
                          </div>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-slate-500">
            Showing {filteredPayments.length} of {PAYMENTS.length} transactions
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
