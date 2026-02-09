"use client";

import { useState } from "react";
import { SUPPORT_TICKETS } from "@/lib/supportData";
import {
  Search,
  Filter,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Send,
  User,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Open":
      return "bg-blue-100 text-blue-700";
    case "In Progress":
      return "bg-amber-100 text-amber-700";
    case "Resolved":
    case "Closed":
      return "bg-green-100 text-green-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High":
      return "text-red-600 bg-red-50 border-red-200";
    case "Medium":
      return "text-amber-600 bg-amber-50 border-amber-200";
    default: // Low
      return "text-green-600 bg-green-50 border-green-200";
  }
};

export default function VendorSupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<
    (typeof SUPPORT_TICKETS)[0] | null
  >(null);
  const [replyText, setReplyText] = useState("");
  const [isReplyOpen, setIsReplyOpen] = useState(false);

  const filteredTickets = SUPPORT_TICKETS.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && ticket.status === statusFilter;
  });

  const handleReplyClick = (ticket: (typeof SUPPORT_TICKETS)[0]) => {
    setSelectedTicket(ticket);
    setReplyText("");
    setIsReplyOpen(true);
  };

  const handleSendReply = () => {
    // Simulate sending reply
    console.log(`Replying to ${selectedTicket?.id}: ${replyText}`);
    setIsReplyOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-black font-bold tracking-tight">
          Support
        </h1>
        <p className="text-slate-500 mt-1">
          Manage support tickets and vendor inquiries.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search details..."
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
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                Ticket Details
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Vendor
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Priority
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Last Updated
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
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="font-semibold text-black">
                    {ticket.subject}
                  </div>
                  <div className="text-xs text-slate-500">{ticket.id}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <User className="h-4 w-4 text-slate-400" />
                    {ticket.vendorName}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-slate-600">
                    {ticket.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(ticket.priority)}`}
                  >
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {ticket.lastUpdated}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      ticket.status,
                    )} border-none font-medium`}
                  >
                    {ticket.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-slate-600 hover:text-[#3E8940]"
                      onClick={() => handleReplyClick(ticket)}
                    >
                      <MessageSquare className="h-4 w-4 mr-1" /> Reply
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4 text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                        <DropdownMenuItem>Escalate Ticket</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Close Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredTickets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-slate-500"
                >
                  No tickets found fitting the criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyOpen} onOpenChange={setIsReplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reply to {selectedTicket?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 max-h-40 overflow-y-auto">
              <p className="font-semibold mb-1 text-black">
                Subject: {selectedTicket?.subject}
              </p>
              {selectedTicket?.messages.length ? (
                selectedTicket.messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`mt-2 p-2 rounded ${
                      msg.sender === "Support"
                        ? "bg-blue-50 ml-4 border-l-2 border-blue-400"
                        : "bg-white border text-black"
                    }`}
                  >
                    <p className="text-xs font-bold">{msg.sender}</p>
                    <p>{msg.text}</p>
                  </div>
                ))
              ) : (
                <p className="italic text-slate-400">No messages yet.</p>
              )}
            </div>
            <Textarea
              placeholder="Type your response..."
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReplyOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleSendReply}
            >
              <Send className="h-4 w-4 mr-2" /> Send Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
