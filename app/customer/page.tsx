"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Users,
  ShoppingBag,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock Data
const CUSTOMERS = [
  {
    id: "CUST-001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 98765 43210",
    status: "Active",
    orders: 12,
    totalSpent: "₹12,450",
    joined: "12 Jan 2024",
    lastActive: "2 hours ago",
    avatar: "JD",
  },
  {
    id: "CUST-002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+91 98765 43211",
    status: "Active",
    orders: 8,
    totalSpent: "₹8,200",
    joined: "15 Jan 2024",
    lastActive: "1 day ago",
    avatar: "JS",
  },
  {
    id: "CUST-003",
    name: "Robert Johnson",
    email: "robert.j@example.com",
    phone: "+91 98765 43212",
    status: "Inactive",
    orders: 0,
    totalSpent: "₹0",
    joined: "20 Jan 2024",
    lastActive: "5 days ago",
    avatar: "RJ",
  },
  {
    id: "CUST-004",
    name: "Emily Davis",
    email: "emily.d@example.com",
    phone: "+91 98765 43213",
    status: "Active",
    orders: 24,
    totalSpent: "₹21,600",
    joined: "05 Dec 2023",
    lastActive: "3 hours ago",
    avatar: "ED",
  },
  {
    id: "CUST-005",
    name: "Michael Brown",
    email: "michael.b@example.com",
    phone: "+91 98765 43214",
    status: "Blocked",
    orders: 2,
    totalSpent: "₹1,200",
    joined: "10 Feb 2024",
    lastActive: "1 week ago",
    avatar: "MB",
  },
];

export default function CustomerPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = CUSTOMERS.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm),
  );

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-500 mt-1">Manage your customer base</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export
          </Button>
          <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 gap-2">
            <UserPlus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Customers
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  2,543
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+180 this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active Users
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  1,850
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              <span>72% of total base</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Orders
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  15.2K
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  New Signups
                </p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">84</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-500">
              <span>Past 7 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Customer List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search customers..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="h-9 gap-2">
                <Filter className="h-4 w-4" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[80px]">Customer</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="hover:bg-slate-50/50"
                    >
                      <TableCell>
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-slate-100 text-slate-600 font-medium text-xs">
                            {customer.avatar}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {customer.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {customer.email}
                          </span>
                          <span className="text-xs text-slate-400">
                            {customer.phone}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`
                            ${customer.status === "Active" ? "bg-green-50 text-green-700 border-green-200" : ""}
                            ${customer.status === "Inactive" ? "bg-slate-50 text-slate-600 border-slate-200" : ""}
                            ${customer.status === "Blocked" ? "bg-red-50 text-red-700 border-red-200" : ""}
                        `}
                        >
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{customer.orders}</TableCell>
                      <TableCell className="font-medium text-slate-900">
                        {customer.totalSpent}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {customer.joined}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Order History</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              Block Customer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
