"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Briefcase,
  Star,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VENDORS } from "@/lib/vendorsData";
import { ORDERS } from "@/lib/ordersData";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700 border-emerald-200/50";
    case "Pending":
      return "bg-amber-100 text-amber-700 border-amber-200/50";
    case "Suspended":
      return "bg-rose-100 text-rose-700 border-rose-200/50";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-yellow-100 text-yellow-600 border-yellow-200/50";
    case "Assigned":
      return "bg-blue-100 text-blue-600 border-blue-200/50";
    case "Ready":
      return "bg-green-100 text-green-600 border-green-200/50";
    case "Pending Pickup":
      return "bg-orange-100 text-orange-600 border-orange-200/50";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200/50";
  }
};

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id;
  const vendor = VENDORS.find((v) => v.id === vendorId);

  // Filter orders for this specific vendor (mock logic: matching by vendor name string roughly)
  // Note: ideally orders would have a vendor ID.
  const vendorOrders = ORDERS.filter((order) => order.vendor === vendor?.name);

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/40 text-center">
          <p className="text-slate-500 font-medium">Vendor not found</p>
          <Button
            variant="outline"
            className="mt-4 bg-white/80 hover:bg-white border-slate-200"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full bg-white/50 hover:bg-white border border-white/40 shadow-sm transition-all duration-300 hover:scale-105"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 text-slate-700" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest bg-slate-100/50 px-2 py-0.5 rounded-full border border-slate-200/50">
                Vendor Details
              </span>
            </div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-slate-900 via-slate-800 to-slate-700">
              {vendor.name}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            className={cn(
              "text-xs px-3 py-1 font-semibold backdrop-blur-md shadow-sm border",
              getStatusColor(vendor.status),
            )}
          >
            {vendor.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-12">
        {/* Main Profile Card - Spans 4 columns */}
        <div className="md:col-span-4 flex flex-col">
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden h-full transform transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] duration-500">
            <div className="h-24 bg-linear-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center relative overlow-hidden">
              <div className="absolute inset-0 opacity-30 pattern-grid-lg" />
            </div>
            <div className="px-6 pb-6 -mt-10 relative z-10">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                <AvatarFallback className="bg-linear-to-br from-slate-800 to-slate-950 text-white text-xl font-bold">
                  {vendor.name
                    .split(" ")
                    .map((word) => word[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3 mb-5">
                <h2 className="text-xl font-bold text-slate-900">
                  {vendor.name}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {vendor.owner}
                </p>
              </div>

              <div className="space-y-3">
                <div className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-transparent hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Phone
                    </span>
                    <p className="text-xs font-semibold text-slate-700 truncate">
                      {vendor.phone}
                    </p>
                  </div>
                </div>

                <div className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/50 border border-transparent hover:border-emerald-100 hover:bg-emerald-50/30 transition-all duration-300">
                  <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                      Location
                    </span>
                    <p className="text-xs font-semibold text-slate-700">
                      {vendor.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Spans 8 columns */}
        <div className="md:col-span-8 flex flex-col gap-4">
          {/* Stats Card */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-500">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-700">
              <Briefcase className="h-24 w-24" />
            </div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  Performance Overview
                </h3>
                <p className="text-slate-500 text-xs">
                  Based on recent activity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Rating
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {vendor.rating > 0 ? vendor.rating : "N/A"}
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Completion
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {vendor.completionRate}%
                </p>
              </div>
              <div className="bg-white/60 rounded-xl p-3 border border-white/50">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                  Total Orders
                </p>
                <p className="text-xl font-bold text-slate-800">
                  {vendor.totalOrders}
                </p>
              </div>
            </div>

            <div className="mt-4 bg-white/60 rounded-xl p-3 border border-white/50 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Pending Payout
                </p>
                <p className="text-xl font-bold text-emerald-600">
                  {vendor.pendingPayout}
                </p>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8">
                View History
              </Button>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 flex-1">
            <h3 className="text-base font-bold text-slate-800 mb-4">
              Account Information
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Vendor ID
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {vendor.id}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Joined Date
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {vendor.joinedDate}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">
          Assigned Orders
        </h3>
        {vendorOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-200/60">
                <TableHead className="w-[100px] text-xs font-bold uppercase text-slate-400">
                  ID
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400">
                  Due Date
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">
                  Amount
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-slate-400 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="hover:bg-slate-50/50 border-slate-100 transition-colors"
                >
                  <TableCell className="font-semibold text-slate-700 text-sm">
                    {order.id}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        "text-[10px] px-2 py-0.5 border font-medium shadow-sm",
                        getOrderStatusColor(order.status),
                      )}
                    >
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {order.dueDate}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800 text-sm">
                    {order.amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs font-medium text-slate-500 hover:text-slate-900"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-slate-500 text-sm">
            No active orders for this vendor.
          </div>
        )}
      </div>
    </div>
  );
}
