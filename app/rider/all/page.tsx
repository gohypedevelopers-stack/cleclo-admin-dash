"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { USERS } from "@/lib/usersData";

const users = USERS;

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Blocked":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "VIP":
      return "bg-purple-100 text-purple-700";
    case "Top Spender":
      return "bg-amber-100 text-amber-700";
    case "New":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function RidersPage() {
  const router = useRouter();
  const [userList, setUserList] = useState(users);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<(typeof USERS)[0] | null>(
    null,
  );

  const handleManageWallet = (user: (typeof USERS)[0]) => {
    setSelectedUser(user);
    setIsWalletOpen(true);
  };

  const handleViewAddresses = (user: (typeof USERS)[0]) => {
    setSelectedUser(user);
    setIsAddressOpen(true);
  };

  const handleBlockUser = (user: (typeof USERS)[0]) => {
    setUserList((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              status: u.status === "Blocked" ? "Active" : "Blocked",
            }
          : u,
      ),
    );
  };

  const handleViewDetails = (user: (typeof USERS)[0]) => {
    router.push(`/rider/${user.id}`); // Updated to point to rider detail page
  };

  const filteredUsers = userList.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    if (filterType === "all") return matchesSearch;
    if (filterType === "top-spenders")
      return matchesSearch && user.type === "Top Spender";
    if (filterType === "new") return matchesSearch && user.type === "New";
    if (filterType === "blocked")
      return matchesSearch && user.status === "Blocked";
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Riders List
          </h1>
          <p className="text-slate-500 mt-1">
            Manage rider accounts and profiles
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Riders</SelectItem>
              <SelectItem value="top-spenders">Top Rated</SelectItem>
              <SelectItem value="new">New Riders</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                Rider
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Contact
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Wallet
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Orders
              </TableHead>
              <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                Type
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
            {filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-slate-50">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-black">{user.name}</p>
                      <p className="text-xs text-slate-500">
                        Joined {user.joinDate}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {user.email}
                    </p>
                    <p className="text-sm flex items-center gap-1.5 text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      {user.phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-[#3E8940]">
                  {user.walletBalance}
                </TableCell>
                <TableCell className="font-medium">
                  24 {/* Mocked total orders */}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getTypeColor(
                      user.type,
                    )} border-none font-medium`}
                  >
                    {user.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getStatusColor(
                      user.status,
                    )} border-none font-medium`}
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-black"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleManageWallet(user)}
                        >
                          <Wallet className="h-4 w-4" /> Manage Wallet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={() => handleViewAddresses(user)}
                        >
                          <MapPin className="h-4 w-4" /> View Addresses
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-600"
                          onClick={() => handleBlockUser(user)}
                        >
                          <Ban className="h-4 w-4" />{" "}
                          {user.status === "Blocked" ? "Unblock" : "Block"} User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-slate-500">
            Showing {filteredUsers.length} of {USERS.length} riders
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Edit User Dialog */}

      {/* Manage Wallet Dialog */}
      <Dialog open={isWalletOpen} onOpenChange={setIsWalletOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Wallet</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                <div>
                  <p className="text-sm text-slate-500">Current Balance</p>
                  <p className="text-2xl font-bold text-[#3E8940]">
                    {selectedUser.walletBalance}
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-slate-300" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Add/Deduct Amount</label>
                <div className="flex gap-2">
                  <Select defaultValue="add">
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="deduct">Deduct</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Input placeholder="e.g. Refund, Bonus, Adjustment" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWalletOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={() => setIsWalletOpen(false)}
            >
              Update Balance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Addresses Dialog */}
      <Dialog open={isAddressOpen} onOpenChange={setIsAddressOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Saved Addresses</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="mt-1 h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">Home</p>
                    {i === 1 && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    123, Green Park Avenue, Near Central Mall,
                    <br />
                    Bangalore, Karnataka - 560001
                  </p>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
