"use client";

import { useState } from "react";
import {
  MessageSquare,
  Star,
  Clock,
  Mail,
  Search,
  Filter,
  Eye,
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

const feedbacks = [
  {
    id: 1,
    user: "Alice Freeman",
    email: "alice@example.com",
    type: "Bug Report",
    message:
      "The app crashes when I try to add money to my wallet. This happens every time I enter an amount above ₹1000.",
    rating: 2,
    status: "Pending",
    date: "Jan 16, 2026",
  },
  {
    id: 2,
    user: "Mark Wilson",
    email: "mark.w@example.com",
    type: "Feature Request",
    message:
      "It would be great to have a recurring order option for weekly laundry pickup.",
    rating: 4,
    status: "Reviewed",
    date: "Jan 15, 2026",
  },
  {
    id: 3,
    user: "Sarah Jenkins",
    email: "sarah.j@example.com",
    type: "Complaint",
    message:
      "My order was delivered late and some items were missing. Order #ORD-8234.",
    rating: 1,
    status: "Resolved",
    date: "Jan 14, 2026",
  },
  {
    id: 4,
    user: "James Doe",
    email: "james.doe@example.com",
    type: "General Feedback",
    message:
      "Love the service! The app is easy to use and the delivery is always on time.",
    rating: 5,
    status: "Reviewed",
    date: "Jan 13, 2026",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Reviewed":
      return "bg-blue-100 text-blue-700";
    case "Resolved":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "Bug Report":
      return "bg-red-100 text-red-700";
    case "Feature Request":
      return "bg-purple-100 text-purple-700";
    case "Complaint":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function FeedbackPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredFeedbacks = feedbacks.filter((f) => {
    const matchesSearch =
      f.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.message.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && f.status.toLowerCase() === statusFilter;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Feedback
          </h1>
          <p className="text-slate-500 mt-1">
            User feedback and support requests
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total", value: feedbacks.length, color: "text-slate-700" },
          {
            label: "Pending",
            value: feedbacks.filter((f) => f.status === "Pending").length,
            color: "text-amber-600",
          },
          {
            label: "Reviewed",
            value: feedbacks.filter((f) => f.status === "Reviewed").length,
            color: "text-blue-600",
          },
          {
            label: "Resolved",
            value: feedbacks.filter((f) => f.status === "Resolved").length,
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
            placeholder="Search feedback..."
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
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        {filteredFeedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className="bg-white rounded-xl shadow-sm border p-5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-black">{feedback.user}</p>
                  <p className="text-sm text-slate-500">{feedback.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getTypeColor(feedback.type)} border-none`}>
                  {feedback.type}
                </Badge>
                <Badge
                  className={`${getStatusColor(feedback.status)} border-none`}
                >
                  {feedback.status}
                </Badge>
              </div>
            </div>

            <p className="text-slate-700 mb-3">{feedback.message}</p>

            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= feedback.rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-500 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {feedback.date}
                </span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-[#3E8940] hover:bg-[#3E8940]/90"
                >
                  <Mail className="h-4 w-4" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

