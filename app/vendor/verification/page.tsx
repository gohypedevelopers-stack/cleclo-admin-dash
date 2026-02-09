"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { VENDORS } from "@/lib/vendorsData";
import {
  Search,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  MapPin,
  Phone,
  Store,
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

export default function VendorVerificationPage() {
  const router = useRouter();
  // Filter for only Pending vendors initially
  const [pendingVendors, setPendingVendors] = useState(
    VENDORS.filter((v) => v.status === "Pending"),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const handleAction = (id: string, action: "approve" | "reject") => {
    // In a real app, this would make an API call.
    // Here we just remove it from the list to simulate processing.
    setPendingVendors((prev) => prev.filter((v) => v.id !== id));
    console.log(`Vendor ${id} was ${action}d`);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/vendors/${id}`);
  };

  const filteredVendors = pendingVendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            New Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve new vendor applications.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-4 rounded-xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search pending vendors..."
            className="pl-10 bg-slate-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {filteredVendors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-[#fbfbfb] border-none bg-[#fbfbfb]">
                <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 pl-6">
                  Vendor Details
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                  Location
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                  Business Type
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4">
                  Documents
                </TableHead>
                <TableHead className="text-xs font-bold uppercase text-[#4FA851] py-4 text-right pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-slate-50">
                  <TableCell className="py-4 pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-amber-100 text-amber-600 font-bold">
                          {vendor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-black">
                          {vendor.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Store className="h-3 w-3" /> {vendor.owner}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {vendor.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {vendor.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      Laundry Service
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-slate-200"
                      >
                        <FileText className="h-3 w-3" /> License
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-slate-200"
                      >
                        <FileText className="h-3 w-3" /> ID
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(vendor.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button
                        size="sm"
                        className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200"
                        onClick={() => handleAction(vendor.id, "reject")}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(vendor.id, "approve")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              No pending verifications
            </h3>
            <p className="text-slate-500 max-w-sm mt-1">
              There are no new vendor applications waiting for verification at
              the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
