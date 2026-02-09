"use client";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  RefreshCcw,
  AlertTriangle,
  ArrowRight,
  Star,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Ban,
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
import Link from "next/link";

import { ORDERS } from "@/lib/ordersData";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-purple-100 text-purple-700";
    case "Not Scheduled":
      return "bg-slate-100 text-slate-600";
    case "Picked Up":
      return "bg-blue-100 text-blue-700";
    case "Received by Vendor":
      return "bg-amber-100 text-amber-700";
    case "Delivered":
      return "bg-green-100 text-green-700";
    case "Issue Reported":
      return "bg-red-100 text-red-700";
    case "Cancelled":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getDeliveryBadgeColor = (type?: string) => {
  switch (type) {
    case "Express 24h":
      return "bg-red-100 text-red-700 border-red-200";
    case "Express 48h":
      return "bg-orange-100 text-orange-700 border-orange-200";
    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Processing":
      return <Clock className="h-3.5 w-3.5" />;
    case "Not Scheduled":
      return <Clock className="h-3.5 w-3.5" />;
    case "Picked Up":
      return <Truck className="h-3.5 w-3.5" />;
    case "Received by Vendor":
      return <Package className="h-3.5 w-3.5" />;
    case "Delivered":
      return <CheckCircle className="h-3.5 w-3.5" />;
    case "Issue Reported":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "Cancelled":
      return <Ban className="h-3.5 w-3.5" />;
    default:
      return null;
  }
};

import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderList, setOrderList] = useState(ORDERS);
  const router = useRouter();

  // Dialog States
  const [selectedOrder, setSelectedOrder] = useState<(typeof ORDERS)[0] | null>(
    null,
  );
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [newVendor, setNewVendor] = useState("");

  const handleViewDetails = (order: (typeof ORDERS)[0]) => {
    router.push(`/orders/${order.id}`);
  };

  const handleReassignClick = (order: (typeof ORDERS)[0]) => {
    setSelectedOrder(order);
    setNewVendor(""); // Reset
    setIsReassignOpen(true);
  };

  const handleReassignConfirm = () => {
    if (selectedOrder && newVendor) {
      setOrderList((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, vendor: newVendor } : o,
        ),
      );
      setIsReassignOpen(false);
    }
  };

  const filteredOrders = orderList.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.vendor.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return (
      matchesSearch &&
      order.status.toLowerCase().replace(" ", "-") === statusFilter
    );
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ... Header, Stats, Filters ... */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Orders
          </h1>
          <p className="text-slate-500 mt-1">
            View and manage all platform orders
          </p>
        </div>
        <Button variant="outline" className="gap-2" asChild>
          <Link href="/orders/settings">
            <RefreshCcw className="h-4 w-4" />
            Allocation Settings
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: "Total", value: orderList.length, color: "text-slate-700" },
          {
            label: "Not Scheduled",
            value: orderList.filter((o) => o.status === "Not Scheduled").length,
            color: "text-slate-600",
          },
          {
            label: "Processing",
            value: orderList.filter((o) => o.status === "Processing").length,
            color: "text-purple-600",
          },
          {
            label: "Picked Up",
            value: orderList.filter((o) => o.status === "Picked Up").length,
            color: "text-blue-600",
          },
          {
            label: "Received",
            value: orderList.filter((o) => o.status === "Received by Vendor")
              .length,
            color: "text-amber-600",
          },
          {
            label: "Delivered",
            value: orderList.filter((o) => o.status === "Delivered").length,
            color: "text-green-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border p-4 text-center"
          >
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by order ID, customer, or vendor..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="not-scheduled">Not Scheduled</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="picked-up">Picked Up</SelectItem>
              <SelectItem value="received-by-vendor">
                Received by Vendor
              </SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="issue-reported">Issue Reported</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                Date
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Rating
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Pickup Person
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Delivery Person
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Message
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Speed
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Items
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
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      {order.status === "Delivered" ? (
                        <Package className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Truck className="h-5 w-5 text-purple-600" />
                      )}
                    </div>
                    <p className="font-bold text-black whitespace-nowrap">
                      {order.dueDate.split(",")[0]}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-amber-500 text-sm font-bold">
                      {order.rating}
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {order.customer}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {order.customerPhone}
                    </p>
                    <p className="text-[10px] text-purple-600 font-bold uppercase mt-1">
                      {order.vendor}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">#{order.id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  {(order.pickupPerson && order.pickupPerson !== "Pending") ||
                  (order.deliveryPerson &&
                    order.deliveryPerson !== "Pending") ? (
                    <p className="text-sm font-bold text-slate-900">
                      {order.pickupPerson && order.pickupPerson !== "Pending"
                        ? order.pickupPerson
                        : order.deliveryPerson}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500 italic font-medium">
                      Not Assigned
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {order.deliveryPerson === "Pending" ? (
                    <p className="text-sm text-red-500 italic font-medium">
                      Not Assigned
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-slate-900">
                      {order.deliveryPerson}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-500 italic truncate max-w-[150px]">
                    {order.note || "-"}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      "border font-semibold px-2.5 py-0.5 whitespace-nowrap",
                      getDeliveryBadgeColor(order.deliveryType),
                    )}
                  >
                    {order.deliveryType || "Standard"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-[#f8f9fa] border border-slate-200 shadow-sm">
                    <span className="text-sm font-bold text-slate-700">
                      {order.itemCount}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      order.status,
                    )} border-none font-medium gap-1.5 px-3 py-1 rounded-full whitespace-nowrap`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Link href={`/orders/${order.id}`}>
                    <Button
                      size="sm"
                      className="h-8 px-4 bg-[#3E8940] hover:bg-[#3E8940]/90 text-xs font-bold gap-1.5"
                    >
                      View
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination - kept static for now */}
        <div className="flex items-center justify-between p-4 border-t bg-white rounded-b-xl">
          <p className="text-sm text-slate-500">
            Showing {filteredOrders.length} of {ORDERS.length} orders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 h-9 px-4"
              disabled
            >
              Previous
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm h-9 px-6 font-medium"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Reassign Vendor Dialog */}
      <Dialog open={isReassignOpen} onOpenChange={setIsReassignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign Vendor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-600">
              Select a new vendor for Order{" "}
              <span className="font-bold">#{selectedOrder?.id}</span>.
            </p>
            <div className="space-y-2">
              <Label>Select New Vendor</Label>
              <Select value={newVendor} onValueChange={setNewVendor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clean Express">Clean Express</SelectItem>
                  <SelectItem value="Sparkle Wash">Sparkle Wash</SelectItem>
                  <SelectItem value="Fresh Laundry">Fresh Laundry</SelectItem>
                  <SelectItem value="Quick Clean">Quick Clean</SelectItem>
                  <SelectItem value="Urban Laundry">Urban Laundry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReassignOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleReassignConfirm}
              disabled={!newVendor}
            >
              Confirm Reassignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
