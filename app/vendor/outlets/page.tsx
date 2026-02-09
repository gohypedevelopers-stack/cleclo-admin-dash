"use client";

import { useState } from "react";
import { OUTLETS } from "@/lib/outletsData";
import {
  Search,
  Filter,
  MapPin,
  Store,
  Phone,
  User,
  Star,
  MoreVertical,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Inactive":
      return "bg-slate-100 text-slate-700";
    case "Maintenance":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function OutletsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOutlets = OUTLETS.filter((outlet) => {
    const matchesSearch =
      outlet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      outlet.manager.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && outlet.status === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-black font-bold tracking-tight">
          Outlets
        </h1>
        <p className="text-slate-500 mt-1">
          Manage and monitor all vendor outlet locations.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search outlets, vendors, or locations..."
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
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Outlets Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                Outlet Name
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Vendor
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Location
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Manager
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Performance
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOutlets.map((outlet) => (
              <TableRow key={outlet.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="font-semibold text-black">{outlet.name}</div>
                  <div className="text-xs text-slate-500">{outlet.id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-700">
                      {outlet.vendorName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {outlet.location}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-slate-400" />
                      {outlet.manager}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3 w-3" />
                      {outlet.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {outlet.ordersProcessed} Orders
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600">
                      <Star className="h-3 w-3 fill-current" />
                      {outlet.rating} Rating
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      outlet.status,
                    )} border-none font-medium`}
                  >
                    {outlet.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4 text-slate-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit Outlet</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredOutlets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  No outlets found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
