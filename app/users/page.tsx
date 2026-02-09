"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Ban,
  Eye,
  Store,
  Bike,
  User,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { USERS } from "@/lib/usersData";
import { VENDORS } from "@/lib/vendorsData";
import { RIDERS } from "@/lib/ridersData";

// Define a unified User type
type UnifiedUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  walletBalance: string;
  status: string;
  role: "Customer" | "Vendor" | "Rider";
  joinDate: string;
  orders: number | string; // Normalized field: totalOrders for vendors/riders, mocked for users
  rating?: number; // Optional, mainly for vendors/riders
  type?: string; // Optional, e.g. VIP, Top Spender, etc.
};

// Data Normalization Helpers
const normalizeUsers = (): UnifiedUser[] =>
  USERS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    walletBalance: u.walletBalance,
    status: u.status,
    role: "Customer",
    joinDate: u.joinDate,
    orders: 24, // Mocked as in original file
    type: u.type,
  }));

const normalizeVendors = (): UnifiedUser[] =>
  VENDORS.map((v) => ({
    id: v.id,
    name: v.name, // Business name as main name
    email: null, // Vendors data doesn't have email in the mock
    phone: v.phone,
    walletBalance: v.pendingPayout, // Mapping pending payout to wallet
    status: v.status,
    role: "Vendor",
    joinDate: v.joinedDate,
    orders: v.totalOrders,
    rating: v.rating,
  }));

const normalizeRiders = (): UnifiedUser[] =>
  RIDERS.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    walletBalance: r.walletBalance,
    status: r.status,
    role: "Rider",
    joinDate: r.joinDate,
    orders: r.totalDeliveries,
    rating: r.rating,
    type: r.type,
  }));

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "Blocked":
    case "Suspended":
      return "bg-red-100 text-red-700 border-red-200";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "Customer":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 gap-1 pr-3"
        >
          <User className="w-3 h-3" /> Customer
        </Badge>
      );
    case "Vendor":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200 gap-1 pr-3"
        >
          <Store className="w-3 h-3" /> Vendor
        </Badge>
      );
    case "Rider":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200 gap-1 pr-3"
        >
          <Bike className="w-3 h-3" /> Rider
        </Badge>
      );
    default:
      return null;
  }
};

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");

  // Merge all data
  const allData = useMemo(() => {
    return [...normalizeUsers(), ...normalizeVendors(), ...normalizeRiders()];
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredData = useMemo(() => {
    return allData.filter((item) => {
      // 1. Filter by Search
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.email &&
          item.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.phone.includes(searchQuery);

      if (!matchesSearch) return false;

      // 2. Filter by Role (from URL param)
      if (roleParam && item.role.toLowerCase() !== roleParam.toLowerCase()) {
        return false;
      }

      // 3. Filter by Status (local state)
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [allData, searchQuery, roleParam, statusFilter]);

  const handleViewDetails = (item: UnifiedUser) => {
    const route =
      item.role === "Vendor"
        ? `/vendors/${item.id}` // Assuming this route/ID pattern exists or will exist
        : `/users/${item.id}`; // Default for Users and Riders (Riders reuse user details for now)
    router.push(route);
  };

  const pageTitle = roleParam
    ? `${roleParam.charAt(0).toUpperCase() + roleParam.slice(1)}s`
    : "All Users";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl text-gray-900 font-bold tracking-tight">
          {pageTitle}
        </h1>
        <p className="text-slate-500">
          Manage {roleParam ? roleParam : "all"} accounts and profiles across
          the platform.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Blocked">Blocked</SelectItem>
              <SelectItem value="Suspended">Suspended</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unified Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="py-4 pl-6 font-semibold text-slate-600">
                User / Entity
              </TableHead>
              <TableHead className="py-4 font-semibold text-slate-600">
                Role
              </TableHead>
              <TableHead className="py-4 font-semibold text-slate-600">
                Contact
              </TableHead>
              <TableHead className="py-4 font-semibold text-slate-600">
                Wallet / Payout
              </TableHead>
              <TableHead className="py-4 font-semibold text-slate-600">
                Activity
              </TableHead>
              <TableHead className="py-4 font-semibold text-slate-600">
                Status
              </TableHead>
              <TableHead className="py-4 pr-6 text-right font-semibold text-slate-600">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow
                  key={`${item.role}-${item.id}`}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarFallback
                          className={`font-bold ${
                            item.role === "Vendor"
                              ? "bg-orange-50 text-orange-600"
                              : item.role === "Rider"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {item.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Joined {item.joinDate}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(item.role)}</TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      {item.email && (
                        <p className="text-sm flex items-center gap-1.5 text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {item.email}
                        </p>
                      )}
                      <p className="text-sm flex items-center gap-1.5 text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        {item.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-700">
                      {item.walletBalance}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium text-slate-900">
                        {item.orders}
                      </span>
                      <span className="text-slate-500 ml-1">
                        {item.role === "Rider" ? "deliveries" : "orders"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`${getStatusColor(item.status)} border font-medium shadow-none`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDetails(item)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                          <Ban className="h-4 w-4" /> Block Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-slate-500"
                >
                  No results found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50">
          <p className="text-sm text-slate-500">
            Showing {filteredData.length} records
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

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
