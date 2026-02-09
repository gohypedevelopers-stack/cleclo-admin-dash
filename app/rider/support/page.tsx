"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

// Mock Data
const TICKETS = [
  {
    id: "TKT-1024",
    rider: { name: "Rahul Kumar", id: "R-101", avatar: "RK" },
    issue: "Payment Discrepancy",
    description:
      "My last payout for Order #ORD-459 is showing less amount than expected.",
    status: "Open",
    priority: "High",
    created: "2 hours ago",
    category: "Finance",
  },
  {
    id: "TKT-1023",
    rider: { name: "Amit Singh", id: "R-102", avatar: "AS" },
    issue: "App Crashing",
    description: "The app crashes whenever I try to upload delivery proof.",
    status: "In Progress",
    priority: "Medium",
    created: "5 hours ago",
    category: "Technical",
  },
  {
    id: "TKT-1022",
    rider: { name: "Priya Sharma", id: "R-103", avatar: "PS" },
    issue: "Change Vehicle Request",
    description: "I bought a new bike and want to update my vehicle details.",
    status: "Open",
    priority: "Low",
    created: "1 day ago",
    category: "Account",
  },
  {
    id: "TKT-1020",
    rider: { name: "Vikram Malhotra", id: "R-104", avatar: "VM" },
    issue: "Location Issue",
    description: "GPS is not updating correctly in Indiranagar area.",
    status: "Resolved",
    priority: "Medium",
    created: "2 days ago",
    category: "Technical",
  },
  {
    id: "TKT-1019",
    rider: { name: "Suresh R", id: "R-105", avatar: "SR" },
    issue: "Login Problem",
    description: "Unable to login after password reset.",
    status: "Resolved",
    priority: "High",
    created: "3 days ago",
    category: "Account",
  },
];

export default function RiderSupportPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredTickets = TICKETS.filter((ticket) => {
    const matchesSearch =
      ticket.rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.issue.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "open")
      return (
        matchesSearch &&
        (ticket.status === "Open" || ticket.status === "In Progress")
      );
    if (activeTab === "resolved")
      return matchesSearch && ticket.status === "Resolved";

    return matchesSearch;
  });

  const handleResolve = (id: string) => {
    toast.success(`Ticket ${id} marked as resolved.`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600 bg-red-50 border-red-200";
      case "Medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Low":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "In Progress":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "Resolved":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-slate-600 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Rider Support</h1>
          <p className="text-slate-500 mt-1">Manage and resolve rider issues</p>
        </div>
        <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90">
          Create Ticket
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Open Tickets</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">12</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Resolved Today
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">28</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Avg. Response Time
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">45m</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Tickets</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search tickets..."
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

          <Tabs
            defaultValue="all"
            className="w-full mt-4"
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="all">All Tickets</TabsTrigger>
              <TabsTrigger value="open">Open & In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                No tickets found matching your criteria.
              </div>
            ) : (
              filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-xl hover:bg-slate-50 transition-all gap-4 group"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="mt-1">
                      <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-medium">
                        {ticket.rider.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-900">
                          {ticket.issue}
                        </h4>
                        <span className="text-xs text-slate-400">
                          • {ticket.id}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5 bg-slate-100 text-slate-600 border-slate-200"
                        >
                          {ticket.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 max-w-xl">
                        {ticket.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-medium text-slate-900">
                          {ticket.rider.name}
                        </span>
                        <span>Created {ticket.created}</span>
                        {ticket.status !== "Resolved" && (
                          <div className="flex gap-3 ml-2">
                            <button className="flex items-center gap-1 hover:text-[#3E8940] transition-colors">
                              <Phone className="h-3 w-3" /> Call
                            </button>
                            <button className="flex items-center gap-1 hover:text-[#3E8940] transition-colors">
                              <Mail className="h-3 w-3" /> Email
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pl-14 md:pl-0">
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={getStatusColor(ticket.status)}
                      >
                        {ticket.status}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getPriorityColor(ticket.priority)}`}
                      >
                        {ticket.priority} Priority
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {ticket.status !== "Resolved" ? (
                        <Button
                          size="sm"
                          className="bg-white border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 border shadow-sm"
                          onClick={() => handleResolve(ticket.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" /> Resolve
                        </Button>
                      ) : (
                        <Button size="sm" variant="ghost" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" /> Closed
                        </Button>
                      )}

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
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Assign to Team</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
