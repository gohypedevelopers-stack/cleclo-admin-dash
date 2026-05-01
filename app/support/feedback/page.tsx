"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare,
  Star,
  Clock,
  Mail,
  Search,
  Filter,
  Eye,
  TrendingUp,
  MapPin,
  Truck,
  Store,
  Hash,
  AlertCircle,
  Gift,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Timer,
  BarChart3,
  Layers,
  RefreshCw,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const feedbacks = [
  {
    id: 1,
    user: "Alice Freeman",
    email: "alice@example.com",
    type: "Bug",
    message: "The app crashes when I try to add money to my wallet. This happens every time I enter an amount above ₹1000.",
    rating: 2,
    status: "Pending",
    date: "Jan 16, 2026",
    orderId: "ORD-9921",
    deliveryTime: "30 mins",
    rider: "Rahul Kumar",
    vendor: "Clean Express",
    outlet: "Andheri West",
    city: "Mumbai",
    resolutionTime: null,
    resolutionTimeMins: 45,
  },
  {
    id: 2,
    user: "Mark Wilson",
    email: "mark.w@example.com",
    type: "Feature Request",
    message: "It would be great to have a recurring order option for weekly laundry pickup.",
    rating: 4,
    status: "Reviewed",
    date: "Jan 15, 2026",
    orderId: "ORD-8821",
    deliveryTime: "45 mins",
    rider: "Suresh P.",
    vendor: "Laundry Co",
    outlet: "Juhu",
    city: "Mumbai",
    resolutionTime: "2h 30m",
    resolutionTimeMins: 150,
  },
  {
    id: 3,
    user: "Sarah Jenkins",
    email: "sarah.j@example.com",
    type: "Service Complaint",
    message: "My order was delivered late and some items were missing. Order #ORD-8234.",
    rating: 1,
    status: "Resolved",
    date: "Jan 14, 2026",
    orderId: "ORD-8234",
    deliveryTime: "2h 15m",
    rider: "Amit S.",
    vendor: "Quick Clean",
    outlet: "Khar",
    city: "Mumbai",
    resolutionTime: "1h 15m",
    resolutionTimeMins: 75,
  },
  {
    id: 4,
    user: "James Doe",
    email: "james.doe@example.com",
    type: "Rider Behavior",
    message: "The rider was extremely rude and refused to come to the doorstep despite the instructions.",
    rating: 1,
    status: "Pending",
    date: "Jan 13, 2026",
    orderId: "ORD-7721",
    deliveryTime: "25 mins",
    rider: "Vikas K.",
    vendor: "Clean Express",
    outlet: "Andheri West",
    city: "Mumbai",
    resolutionTime: null,
    resolutionTimeMins: 12,
  },
  {
    id: 5,
    user: "Priya Sharma",
    email: "priya.s@example.com",
    type: "Payment Issue",
    message: "Amount was deducted twice for my last order. Please refund one transaction.",
    rating: 2,
    status: "Resolved",
    date: "Jan 12, 2026",
    orderId: "ORD-6621",
    deliveryTime: "N/A",
    rider: "N/A",
    vendor: "System",
    outlet: "Online",
    city: "Mumbai",
    resolutionTime: "4h 20m",
    resolutionTimeMins: 260,
  }
];

const getTypeConfig = (type: string) => {
  switch (type) {
    case "Bug": return { color: "bg-red-50 text-red-600 border-red-100", icon: AlertCircle };
    case "Feature Request": return { color: "bg-purple-50 text-purple-600 border-purple-100", icon: TrendingUp };
    case "Service Complaint": return { color: "bg-orange-50 text-orange-600 border-orange-100", icon: MessageSquare };
    case "Rider Behavior": return { color: "bg-pink-50 text-pink-600 border-pink-100", icon: Truck };
    case "Vendor Quality": return { color: "bg-indigo-50 text-indigo-600 border-indigo-100", icon: Store };
    case "Payment Issue": return { color: "bg-amber-50 text-amber-600 border-amber-100", icon: IndianRupee };
    case "App UI/UX": return { color: "bg-blue-50 text-blue-600 border-blue-100", icon: Layers };
    case "Suggestion": return { color: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Heart };
    default: return { color: "bg-slate-50 text-slate-600 border-slate-100", icon: MessageSquare };
  }
};

const IndianRupee = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c4.5 0 8.5-4 8.5-8.5v-1.5" />
  </svg>
);

function FeedbackContent() {
  const searchParams = useSearchParams();
  const urlSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");

  useEffect(() => {
    setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      f.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.orderId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || f.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType = typeFilter === "all" || f.type.toLowerCase() === typeFilter.toLowerCase();
    const matchesOutlet = outletFilter === "all" || f.outlet.toLowerCase() === outletFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType && matchesOutlet;
  });

  const avgResolutionTime = useMemo(() => {
    const resolved = feedbacks.filter(f => f.resolutionTimeMins);
    if (resolved.length === 0) return "N/A";
    const total = resolved.reduce((acc, curr) => acc + curr.resolutionTimeMins, 0);
    const avg = Math.round(total / resolved.length);
    return `${Math.floor(avg / 60)}h ${avg % 60}m`;
  }, []);

  const handleCompensation = (id: number, type: string) => {
    toast.success(`Success: ${type} issued for Feedback #${id}`, {
      description: "Customer has been notified via Email & SMS.",
      className: "rounded-2xl font-bold border-emerald-100"
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Customer Feedback
          </h1>
          <p className="text-slate-500 mt-1">
            Analyze customer sentiment and drive service recovery
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold bg-[#fbfbfb]">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Analytics
           </Button>
        </div>
      </div>

      {/* Monthly Trend Heatmap Header */}
      <Card className="shadow-none border-slate-100 bg-white">
         <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <TrendingUp className="h-4 w-4" />
               Monthly Sentiment Trend (Avg. Rating)
            </CardTitle>
         </CardHeader>
         <CardContent>
            <div className="flex items-end gap-1.5 h-16 pt-4">
               {[
                 { m: 'Oct', v: 4.2 }, { m: 'Nov', v: 4.5 }, { m: 'Dec', v: 4.1 },
                 { m: 'Jan', v: 4.6 }, { m: 'Feb', v: 4.4 }, { m: 'Mar', v: 4.8 }
               ].map((item, idx) => (
                 <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                    <div 
                      className={cn(
                        "w-full rounded-t-lg transition-all duration-500 group-hover:brightness-90",
                        item.v >= 4.5 ? "bg-emerald-500" : item.v >= 4.0 ? "bg-amber-400" : "bg-red-400"
                      )} 
                      style={{ height: `${(item.v / 5) * 100}%` }}
                    />
                    <div className="text-[9px] font-black text-slate-400 uppercase group-hover:text-slate-900">{item.m}</div>
                 </div>
               ))}
            </div>
         </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Received", value: feedbacks.length, icon: MessageSquare, color: "bg-slate-50 text-slate-600" },
          { label: "Pending Review", value: feedbacks.filter(f => f.status === "Pending").length, icon: Clock, color: "bg-amber-50 text-amber-600" },
          { label: "Resolved Cycle", value: "88%", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
          { label: "Avg. Resolution", value: avgResolutionTime, icon: Timer, color: "bg-blue-50 text-blue-600" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-none border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
              <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</CardTitle>
              <stat.icon className="h-3.5 w-3.5 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-black text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-col gap-4 bg-white p-6 rounded-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by User, Message or Order ID..."
              className="pl-10 bg-slate-50 border-slate-200 rounded-xl h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 rounded-xl h-12 border-slate-200 bg-white font-bold text-xs">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 rounded-xl h-12 border-slate-200 bg-white font-bold text-xs">
                <Layers className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Bug">Bug</SelectItem>
                <SelectItem value="Feature Request">Feature Request</SelectItem>
                <SelectItem value="Service Complaint">Service Complaint</SelectItem>
                <SelectItem value="Rider Behavior">Rider Behavior</SelectItem>
                <SelectItem value="Vendor Quality">Vendor Quality</SelectItem>
                <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                <SelectItem value="App UI/UX">App UI/UX</SelectItem>
                <SelectItem value="Suggestion">Suggestion</SelectItem>
              </SelectContent>
            </Select>
            <Select value={outletFilter} onValueChange={setOutletFilter}>
              <SelectTrigger className="w-40 rounded-xl h-12 border-slate-200 bg-white font-bold text-xs">
                <Store className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Outlet" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Outlets</SelectItem>
                <SelectItem value="Andheri West">Andheri West</SelectItem>
                <SelectItem value="Juhu">Juhu</SelectItem>
                <SelectItem value="Khar">Khar</SelectItem>
                <SelectItem value="Online">Online System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="grid gap-4">
        {filteredFeedbacks.length > 0 ? filteredFeedbacks.map((feedback) => {
          const config = getTypeConfig(feedback.type);
          const needsCompensation = ["Service Complaint", "Rider Behavior", "Vendor Quality", "Payment Issue"].includes(feedback.type) && feedback.rating <= 2;

          return (
            <div
              key={feedback.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-emerald-100 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400 ring-4 ring-white shadow-sm uppercase">
                      {feedback.user[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{feedback.user}</p>
                      <p className="text-[11px] text-slate-400 font-bold">{feedback.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("rounded-lg px-2 py-1 border font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5", config.color)}>
                        <config.icon className="h-3 w-3" />
                        {feedback.type}
                      </Badge>
                      <Badge className={cn(
                        "rounded-lg px-2 py-1 border-none font-black text-[9px] uppercase tracking-wider",
                        feedback.status === "Pending" ? "bg-amber-100 text-amber-700" : 
                        feedback.status === "Resolved" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {feedback.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-300 font-black uppercase tracking-widest">{feedback.date}</span>
                  </div>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-50 mb-4">
                   <p className="text-slate-700 text-sm font-medium leading-relaxed italic">"{feedback.message}"</p>
                </div>

                {/* Linked Order View */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border border-slate-100 rounded-xl mb-4 shadow-sm">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                         <Hash className="h-2.5 w-2.5" /> Order ID
                      </p>
                      <p className="text-xs font-black text-slate-900">{feedback.orderId}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                         <Timer className="h-2.5 w-2.5" /> Delivery
                      </p>
                      <p className="text-xs font-bold text-slate-600">{feedback.deliveryTime}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                         <Truck className="h-2.5 w-2.5" /> Rider
                      </p>
                      <p className="text-xs font-bold text-slate-600">{feedback.rider}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                         <Store className="h-2.5 w-2.5" /> Vendor/Outlet
                      </p>
                      <p className="text-xs font-bold text-slate-600 leading-none">{feedback.vendor}</p>
                      <p className="text-[9px] text-slate-400 font-bold leading-none">{feedback.outlet}</p>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= feedback.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    {feedback.resolutionTime && (
                       <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-700 uppercase">Resolved in {feedback.resolutionTime}</span>
                       </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {needsCompensation && (
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-xl border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold gap-2 text-xs">
                               <Gift className="h-4 w-4" />
                               Compensate
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end" className="rounded-2xl p-2 w-56 border-slate-200">
                            <DropdownMenuItem onClick={() => handleCompensation(feedback.id, "Coupon (₹100)")} className="gap-2 font-bold text-xs p-3 cursor-pointer">
                               <Gift className="h-4 w-4 text-purple-600" /> ₹100 Discount Coupon
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompensation(feedback.id, "Partial Refund")} className="gap-2 font-bold text-xs p-3 cursor-pointer">
                               <IndianRupee className="h-4 w-4 text-emerald-600" /> Partial Refund (30%)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCompensation(feedback.id, "Free Service Credit")} className="gap-2 font-bold text-xs p-3 cursor-pointer text-blue-600">
                               <RefreshCw className="h-4 w-4" /> Next Service Free
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-bold gap-2 text-xs hover:bg-slate-50">
                      <Eye className="h-4 w-4" />
                      View Detail
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl bg-[#3E8940] hover:bg-[#3E8940]/90 font-bold gap-2 text-xs shadow-lg shadow-[#3E8940]/10"
                    >
                      <Mail className="h-4 w-4" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
             <MessageSquare className="h-12 w-12 text-slate-200 mb-2" />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No feedback found matching criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3E8940] border-t-transparent mx-auto"></div>
        <p className="text-sm font-medium text-slate-500">Loading feedback intelligence...</p>
      </div>
    }>
      <FeedbackContent />
    </Suspense>
  );
}
