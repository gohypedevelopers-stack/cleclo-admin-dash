"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VENDORS } from "@/lib/vendorsData";
import {
  Search,
  Filter,
  Users,
  Star,
  MapPin,
  CheckCircle,
  Clock,
  Ban,
  Activity,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700 border-green-200";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "Suspended":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

export default function AllVendorsPage() {
  const router = useRouter();
  const [vendorList] = useState(VENDORS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleViewDetails = (vendor: (typeof VENDORS)[0]) => {
    router.push(`/vendors/${vendor.id}`);
  };

  const filteredVendors = vendorList.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && vendor.status.toLowerCase() === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-black font-bold tracking-tight">
          All Vendors
        </h1>
        <p className="text-slate-500 mt-1">
          Full list of all registered vendor accounts.
        </p>
      </div>

      {/* Filters and Controls - Kept for the Full List */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, owner, or location..."
            className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-offset-0 focus-visible:ring-[#3E8940]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-slate-50 border-slate-200">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 pl-6 tracking-wider">
                Vendor Profile
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 tracking-wider">
                Location
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 tracking-wider">
                Rating
              </TableHead>

              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 tracking-wider">
                Total Orders
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 tracking-wider">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 text-right pr-6 tracking-wider">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVendors.length > 0 ? (
              filteredVendors.map((vendor) => (
                <TableRow
                  key={vendor.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => handleViewDetails(vendor)}
                >
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-100 shadow-sm">
                        <AvatarFallback
                          className={`font-bold ${
                            vendor.status === "Pending"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-[#F0FDF4] text-[#15803d]"
                          }`}
                        >
                          {vendor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-[#3E8940] transition-colors">
                          {vendor.name}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          {vendor.owner}
                          {vendor.status === "Pending" && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[9px] bg-amber-100 text-amber-700 hover:bg-amber-100"
                            >
                              NEW
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span className="text-sm">{vendor.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.rating > 0 ? (
                      <div className="flex items-center gap-1">
                        <div className="bg-amber-50 p-1 rounded-md">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        </div>
                        <span className="font-semibold text-slate-700">
                          {vendor.rating}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm italic">New</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-slate-700">
                      {vendor.totalOrders.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(
                        vendor.status,
                      )} font-medium gap-1.5 px-2.5 py-0.5`}
                    >
                      {vendor.status === "Active" && (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {vendor.status === "Pending" && (
                        <Clock className="h-3 w-3" />
                      )}
                      {vendor.status === "Suspended" && (
                        <Ban className="h-3 w-3" />
                      )}
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:text-[#3E8940] hover:bg-[#3E8940]/5 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(vendor);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-32 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="h-8 w-8 text-slate-300" />
                    <p>No vendors found matching your criteria.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t bg-slate-50/50 text-xs text-slate-500">
          <p>
            Showing <strong>{filteredVendors.length}</strong> vendors
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
