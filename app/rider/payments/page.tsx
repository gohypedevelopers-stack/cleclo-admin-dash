"use client";

import { useState } from "react";
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
    amount: "₹4,250.00",
    date: "Oct 24, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "HDFC-11293",
  },
  {
    id: "PAY-9020",
    rider: "Amit Singh",
    riderId: "RID-108",
    amount: "₹3,100.00",
    date: "Oct 24, 2024",
    status: "Processing",
    method: "UPI",
    reference: "UPI-44920",
  },
  {
    id: "PAY-9019",
    rider: "Vikram Malhotra",
    riderId: "RID-102",
    amount: "₹5,600.00",
    date: "Oct 23, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "ICICI-99201",
  },
  {
    id: "PAY-9018",
    rider: "Suresh Patel",
    riderId: "RID-111",
    amount: "₹2,890.00",
    date: "Oct 22, 2024",
    status: "Failed",
    method: "Bank Transfer",
    reference: "SBI-77281",
  },
  {
    id: "PAY-9017",
    rider: "Rahul Kumar",
    riderId: "RID-104",
    amount: "₹3,800.00",
    date: "Oct 20, 2024",
    status: "Completed",
    method: "Bank Transfer",
    reference: "HDFC-22910",
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

import { useRouter } from "next/navigation";

export default function RiderPaymentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleViewDetails = (payment: (typeof PAYMENTS)[0]) => {
    router.push(`/rider/payments/${payment.id}`);
  };

  const handleDownloadReceipt = (id: string) => {
    alert(`Downloading receipt for transaction ${id}...`);
  };

  const filteredPayments = PAYMENTS.filter((payment) => {
    const matchesSearch =
      payment.rider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && payment.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Rider Payments
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage payouts to delivery partners
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80">
            <CreditCard className="h-4 w-4" />
            Process Payout
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Payouts (Oct)
            </CardTitle>
            <CreditCard className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹28,450.00</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Pending Payouts
            </CardTitle>
            <Clock className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹3,100.00</div>
            <p className="text-xs text-slate-500 mt-1">1 rider pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Active Riders
            </CardTitle>
            <Bike className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2 new this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Failed/Returned
            </CardTitle>
            <XCircle className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">1</div>
            <p className="text-xs text-slate-500 mt-1">Requires attention</p>
          </CardContent>
        </Card>
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
              <TableHead className="font-semibold text-slate-600 pl-6 py-4">
                Transaction Details
              </TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">
                Rider
              </TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">
                Date
              </TableHead>
              <TableHead className="font-semibold text-slate-600 py-4">
                Status
              </TableHead>
              <TableHead className="font-semibold text-slate-600 py-4 text-right pr-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.map((payment) => (
              <TableRow key={payment.id} className="hover:bg-slate-50">
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900">
                      {payment.id}
                    </span>
                    <span className="text-xs text-slate-500">
                      Ref: {payment.reference}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-black">
                      {payment.rider}
                    </span>
                    <span className="text-xs text-slate-500">
                      {payment.riderId}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-slate-900 py-4">
                  {payment.amount}
                </TableCell>
                <TableCell className="text-slate-600 py-4">
                  {payment.date}
                </TableCell>
                <TableCell className="py-4">
                  {getStatusBadge(payment.status)}
                </TableCell>
                <TableCell className="text-right pr-6 py-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleViewDetails(payment)}
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-2"
                        onClick={() => handleDownloadReceipt(payment.id)}
                      >
                        <Download className="h-4 w-4" /> Download Receipt
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
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
