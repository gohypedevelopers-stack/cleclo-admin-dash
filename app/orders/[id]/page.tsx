"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Star,
  Clock,
  Truck,
  CheckCircle2,
  AlertCircle,
  Timer,
  User,
  Phone,
  MapPin,
  IndianRupee,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDERS } from "@/lib/ordersData";
const getStatusColor = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-amber-100 text-amber-700";
    case "Not Scheduled":
      return "bg-slate-100 text-slate-600";
    case "Picked Up":
      return "bg-blue-100 text-blue-700";
    case "Received by Vendor":
      return "bg-purple-100 text-purple-700";
    case "Delivered":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getSummaryStatusClasses = (status: string) => {
  switch (status) {
    case "Processing":
      return "bg-purple-50 text-purple-600";
    case "Not Scheduled":
      return "bg-slate-100 text-slate-600";
    case "Picked Up":
      return "bg-blue-50 text-blue-600";
    case "Received by Vendor":
      return "bg-amber-50 text-amber-600";
    case "Delivered":
      return "bg-green-50 text-green-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const getSpeedBadgeClasses = (type?: string) => {
  switch (type) {
    case "Express 24h":
      return "bg-red-50 text-red-600 border border-red-100";
    case "Express 48h":
      return "bg-orange-50 text-orange-600 border border-orange-100";
    default:
      return "bg-blue-50 text-blue-600 border border-blue-100";
  }
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id as string;

  const order = ORDERS.find((o) => o.id === rawId || o.id === `ORD-${rawId}`);
  const displayId = order?.id.startsWith("ORD-")
    ? order.id.replace("ORD-", "#")
    : `#${rawId}`;

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-slate-500 font-medium">Order not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const deliveryVerification = order.verification.delivery;
  const vendorVerification = order.verification.vendor;

  const orderItems = order.orderItems ?? [];
  const baseItemCount = orderItems.reduce(
    (sum, item) => sum + (item.quantity ?? 1),
    0,
  );
  const expectedItemCount = Math.max(
    order.itemCount ?? baseItemCount,
    baseItemCount,
  );

  const displayItems =
    orderItems.length > 0
      ? Array.from({ length: expectedItemCount }, (_, index) => {
          const baseItem = orderItems[index % orderItems.length];
          return {
            ...baseItem,
            uniqueId: `${baseItem.name}-${index}`,
          };
        })
      : [];

  const vendorVerifiedCount = vendorVerification.verifiedCount;
  const deliveryVerifiedCount = deliveryVerification.verifiedCount;
  const totalItemsCount = expectedItemCount;
  const heroDateLabel = order.dueDate?.split(",")[0] || order.date;
  const statusStageIndex: Record<string, number> = {
    "Not Scheduled": 1,
    Processing: 5,
    "Received by Vendor": 4,
    "Picked Up": 8,
    Delivered: 11,
  };

  const currentStageIndex = statusStageIndex[order.status] ?? 0;

  const timelineSteps = [
    {
      stage: 0,
      title: "Order Placed",
      description: `Customer placed the order for ${totalItemsCount} items`,
      time: order.dueDate ? order.dueDate.replace(/,.*$/, "") : order.date,
      icon: CheckCircle2,
      note: null,
    },
    {
      stage: 1,
      title: "Waiting for Driver Assignment",
      description: "No delivery partner assigned yet",
      time: "Jan 16, 10:35 AM",
      icon: Clock,
      note: "Waiting for a delivery partner to accept this pickup",
    },
    {
      stage: 2,
      title: "Pickup from Customer",
      description: "Waiting for driver assignment",
      icon: Package,
    },
    {
      stage: 3,
      title: "In Transit to Vendor",
      description: "Pending pickup",
      icon: Truck,
    },
    {
      stage: 4,
      title: "Received at Vendor",
      description: "Waiting for delivery",
      icon: Package,
    },
    {
      stage: 5,
      title: "Processing",
      description: "Laundry service will begin after receiving",
      icon: Timer,
    },
    {
      stage: 6,
      title: "Ready for Delivery",
      description: "Items cleaned and ready for pickup",
      icon: Package,
    },
    {
      stage: 7,
      title: "Delivery Driver Assigned",
      description: "Waiting for driver assignment",
      icon: User,
    },
    {
      stage: 8,
      title: "Picked Up from Vendor",
      description: "Driver will pickup items for delivery",
      icon: Truck,
    },
    {
      stage: 9,
      title: "Verified by Delivery Driver",
      description: "Items will be verified before delivery",
      icon: CheckCircle2,
    },
    {
      stage: 10,
      title: "Out for Delivery",
      description: "On the way to customer",
      icon: Truck,
    },
    {
      stage: 11,
      title: "Delivered to Customer",
      description: "Order completed",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header - Admin Dashboard Style */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-black tracking-tight">
                {displayId}
              </h1>
              <Badge
                className={cn(
                  "font-medium border-none px-3 py-1",
                  getStatusColor(order.status),
                )}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <Calendar className="h-4 w-4" />
              Placed on {order.date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 text-black border-slate-200"
          >
            Edit Order
          </Button>
          <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90">
            Print Invoice
          </Button>
        </div>
      </div>

      {/* Stats Cards - Standardized Admin Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Items",
            value: totalItemsCount,
            icon: Package,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
          },
          {
            title: "Amount Paid",
            value: order.amount,
            icon: IndianRupee,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
          },
          {
            title: "Verified",
            value: `${vendorVerifiedCount}/${totalItemsCount}`,
            icon: CheckCircle2,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
          },
          {
            title: "Rating",
            value: order.rating,
            icon: Star,
            color: "text-amber-600",
            bgColor: "bg-amber-50",
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-xl", stat.bgColor)}>
              <stat.icon className={cn("h-6 w-6", stat.color)} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.title}</p>
              <h3 className="text-2xl font-bold text-black">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Verification Logic - Admin Aesthetic */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#3E8940]" />
                </div>
                Vendor Verification
              </h2>
              <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs font-semibold px-3 py-1">
                {vendorVerifiedCount}/{totalItemsCount} Verified
              </Badge>
            </div>
            <div className="p-4">
              <p className="text-[11px] text-slate-500 mb-4 font-medium">
                Select items to verify as received by the vendor
              </p>
              <div className="grid grid-cols-4 gap-3 mb-6">
                {displayItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center border-2 rounded-xl p-3 gap-2 bg-white border-slate-100"
                  >
                    <div className="h-14 w-14 rounded-lg overflow-hidden border border-slate-100 shadow-inner">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-900 text-center line-clamp-1">
                      {item.name}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  {
                    title: "Delivery Partner",
                    status: deliveryVerification.status,
                    actor: deliveryVerification.verifiedBy,
                    showDetail:
                      deliveryVerification.status === "Completed" ||
                      deliveryVerification.status === "Verified" ||
                      order.status === "Processing",
                    detail: `${deliveryVerifiedCount}/${totalItemsCount} verified`,
                    accent: "bg-blue-50 text-blue-700 border-blue-100",
                    verifiedAt: deliveryVerification.verifiedAt,
                  },
                  {
                    title: "Vendor",
                    status: vendorVerification.status,
                    actor: vendorVerification.verifiedBy,
                    showDetail:
                      vendorVerification.status === "Completed" ||
                      vendorVerification.status === "Verified" ||
                      order.status === "Processing",
                    detail: `${vendorVerifiedCount}/${totalItemsCount} verified`,
                    accent: "bg-emerald-50 text-emerald-700 border-emerald-100",
                    verifiedAt: vendorVerification.verifiedAt,
                  },
                ].map((stat) => (
                  <div
                    key={stat.title}
                    className="flex items-start gap-3 p-3 border rounded-xl bg-white shadow-sm border-slate-100"
                  >
                    <div
                      className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center border",
                        stat.accent,
                      )}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-[11px]">
                      <p className="font-semibold text-slate-800">
                        {stat.title} verification
                      </p>
                      <p className="text-slate-500">
                        {stat.status} · {stat.actor}
                      </p>
                      {stat.showDetail && (
                        <p className="text-[10px] text-slate-400 mt-1">
                          {stat.detail}
                        </p>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 self-center">
                      {stat.verifiedAt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Support Section - Moved Here */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="text-base font-bold text-black flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-[#3E8940]" />
              Support
            </h3>
            <div className="grid gap-3 ">
              {[
                {
                  label: "Client",
                  name: order.customer,
                  status: "No Issues",
                  statusColor: "bg-slate-100 text-slate-500",
                  icon: User,
                  avatarColor: "bg-blue-100 text-blue-600",
                },
                {
                  label: "Vendor",
                  name: order.vendor,
                  status: "1 Open Ticket",
                  statusColor: "bg-amber-100 text-amber-700",
                  icon: Package,
                  avatarColor: "bg-purple-100 text-purple-600",
                },
                {
                  label: "Delivery",
                  name:
                    order.pickupPerson === "Pending"
                      ? "Not Assigned"
                      : order.pickupPerson,
                  status: "No Issues",
                  statusColor: "bg-slate-100 text-slate-500",
                  icon: Truck,
                  avatarColor: "bg-amber-100 text-amber-600",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col p-3 border rounded-xl hover:bg-slate-50 transition-colors gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs",
                          item.avatarColor,
                        )}
                      >
                        {item.name === "Not Assigned"
                          ? "?"
                          : item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          {item.label}
                        </p>
                        <p className="text-sm font-bold text-black line-clamp-1">
                          {item.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-[#3E8940]"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <span className="text-[10px] font-medium text-slate-400">
                      Status
                    </span>
                    <Badge
                      className={cn(
                        "border-none text-[10px] font-medium px-2 py-0.5 h-5",
                        item.statusColor,
                      )}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Item List / History Placeholder */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-black flex items-center gap-2">
                  <Truck className="h-5 w-5 text-purple-600" />
                  Delivery Status
                </h2>
                <p className="text-xs text-slate-500">
                  Track the journey of your items
                </p>
              </div>
              <span className="text-[11px] text-slate-400">Updated Today</span>
            </div>
            <div className="relative pl-8 mt-6 space-y-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[1px] before:bg-slate-100">
              {timelineSteps.map((step) => {
                const Icon = step.icon;
                const stepState =
                  step.stage < currentStageIndex
                    ? "completed"
                    : step.stage === currentStageIndex
                      ? "current"
                      : "upcoming";
                const badgeBg =
                  stepState === "completed"
                    ? "bg-emerald-500"
                    : stepState === "current"
                      ? "bg-amber-500"
                      : "bg-slate-200";
                return (
                  <div key={`${step.title}-${step.stage}`} className="relative">
                    <div
                      className={cn(
                        "absolute -left-10 h-8 w-8 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center transition-all",
                        badgeBg,
                      )}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={cn(
                            "font-semibold text-sm",
                            stepState === "upcoming" && "text-slate-400",
                          )}
                        >
                          {step.title}
                        </p>
                        {step.time && (
                          <span className="text-[11px] text-slate-400">
                            {step.time}
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "text-xs",
                          stepState === "upcoming"
                            ? "text-slate-400"
                            : "text-slate-500",
                        )}
                      >
                        {step.description}
                      </p>
                      {step.note && stepState === "current" && (
                        <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-[12px] text-amber-700 flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {step.note}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Entity Details */}
        <div className="space-y-4">
          {/* Customer Details */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-black flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Customer
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#3E8940] font-bold"
              >
                Details
              </Button>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {order.customer.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-black">{order.customer}</p>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Phone className="h-3 w-3" />
                  {order.customerPhone}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 flex gap-2">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="leading-relaxed font-medium">
                45/B, Green Park View, New Delhi - 110016
              </span>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-black flex items-center gap-2">
                <Truck className="h-4 w-4 text-purple-600" />
                Vendor
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-[#3E8940] font-bold"
              >
                Manage
              </Button>
            </div>
            <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                {order.vendor.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-black">{order.vendor}</p>
                <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] mt-1 pulse-subtle">
                  PREMIUM
                </Badge>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>Commission</span>
              <span className="text-black">15%</span>
            </div>
          </div>

          {/* Delivery Team */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="font-bold text-black flex items-center gap-2 mb-4">
              <Timer className="h-4 w-4 text-amber-500" />
              Staff Assignment
            </h3>
            <div className="space-y-3">
              {[
                { label: "Pickup", person: order.pickupPerson },
                { label: "Delivery", person: order.deliveryPerson },
              ].map((staff, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {staff.label}
                    </p>
                    <p
                      className={cn(
                        "text-sm font-bold mt-0.5",
                        staff.person === "Pending"
                          ? "text-red-500 italic"
                          : "text-black",
                      )}
                    >
                      {staff.person === "Pending"
                        ? "Not Assigned"
                        : staff.person}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-400"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center shadow-md shadow-amber-200 shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900 text-sm">
                  Customer Note
                </h3>
                <p className="text-amber-700 text-xs mt-1 leading-relaxed font-medium">
                  {order.note === "-"
                    ? "No special instructions provided."
                    : order.note}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
