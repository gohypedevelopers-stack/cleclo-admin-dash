"use client";

import { useState } from "react";
import {
  CreditCard,
  Check,
  Clock,
  DollarSign,
  Download,
  Filter,
  Search,
} from "lucide-react";
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

const settlements = [
  {
    id: "SET-001",
    vendor: "Clean Express",
    period: "Jan 1-15, 2026",
    orders: 45,
    grossAmount: "₹22,500",
    commission: "₹3,375",
    netPayout: "₹19,125",
    status: "Pending",
  },
  {
    id: "SET-002",
    vendor: "Sparkle Wash",
    period: "Jan 1-15, 2026",
    orders: 32,
    grossAmount: "₹16,000",
    commission: "₹2,400",
    netPayout: "₹13,600",
    status: "Pending",
  },
  {
    id: "SET-003",
    vendor: "Fresh Laundry",
    period: "Jan 1-15, 2026",
    orders: 58,
    grossAmount: "₹29,000",
    commission: "₹4,350",
    netPayout: "₹24,650",
    status: "Paid",
    paidDate: "Jan 16, 2026",
  },
  {
    id: "SET-004",
    vendor: "Clean Express",
    period: "Dec 16-31, 2025",
    orders: 52,
    grossAmount: "₹26,000",
    commission: "₹3,900",
    netPayout: "₹22,100",
    status: "Paid",
    paidDate: "Jan 5, 2026",
  },
  {
    id: "SET-005",
    vendor: "Sparkle Wash",
    period: "Dec 16-31, 2025",
    orders: 38,
    grossAmount: "₹19,000",
    commission: "₹2,850",
    netPayout: "₹16,150",
    status: "Paid",
    paidDate: "Jan 5, 2026",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Paid":
      return "bg-green-100 text-green-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function SettlementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSettlements = settlements.filter((s) => {
    const matchesSearch =
      s.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && s.status.toLowerCase() === statusFilter;
  });

  const totalPending = settlements
    .filter((s) => s.status === "Pending")
    .reduce((sum, s) => sum + parseInt(s.netPayout.replace(/[₹,]/g, "")), 0);

  const totalPaid = settlements
    .filter((s) => s.status === "Paid")
    .reduce((sum, s) => sum + parseInt(s.netPayout.replace(/[₹,]/g, "")), 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Financial Settlements
          </h1>
          <p className="text-slate-500 mt-1">
            Manage vendor payouts and commissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80">
            <CreditCard className="h-4 w-4" />
            Process Payouts
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-amber-50">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm text-slate-500">Pending Payouts</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">
            ₹{totalPending.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-slate-500">
              Total Paid (This Month)
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-50">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-sm text-slate-500">Commissions Earned</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            ₹
            {settlements
              .reduce(
                (sum, s) => sum + parseInt(s.commission.replace(/[₹,]/g, "")),
                0
              )
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-50">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-slate-500">Default Commission</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">15%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by vendor or settlement ID..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                ID
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Vendor
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Period
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Orders
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Gross
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Commission
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Net Payout
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSettlements.map((settlement) => (
              <TableRow key={settlement.id} className="hover:bg-slate-50">
                <TableCell className="font-medium text-black py-4 pl-6">
                  {settlement.id}
                </TableCell>
                <TableCell className="font-medium">
                  {settlement.vendor}
                </TableCell>
                <TableCell className="text-slate-600">
                  {settlement.period}
                </TableCell>
                <TableCell>{settlement.orders}</TableCell>
                <TableCell>{settlement.grossAmount}</TableCell>
                <TableCell className="text-red-600">
                  -{settlement.commission}
                </TableCell>
                <TableCell className="font-bold text-[#3E8940]">
                  {settlement.netPayout}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      settlement.status
                    )} border-none font-medium gap-1`}
                  >
                    {settlement.status === "Paid" && (
                      <Check className="h-3 w-3" />
                    )}
                    {settlement.status === "Pending" && (
                      <Clock className="h-3 w-3" />
                    )}
                    {settlement.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  {settlement.status === "Pending" ? (
                    <Button
                      size="sm"
                      className="bg-[#3E8940] hover:bg-[#3E8940]/90 h-8"
                    >
                      Mark Paid
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-500">
                      {settlement.paidDate}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

