"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowRight,
  FileText,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";

const pendingVerifications = [
  {
    id: "pv1",
    name: "Rahul Kumar",
    applied: "2 hours ago",
    status: "Pending",
    documents: [
      { name: "Driving License", status: "Pending" },
      { name: "Vehicle RC", status: "Pending" },
      { name: "Insurance", status: "Pending" },
    ],
    avatar: "RK",
    notes: "Please check the expiry date on Insurance.",
  },
  {
    id: "pv2",
    name: "Amit Singh",
    applied: "5 hours ago",
    status: "In Review",
    documents: [
      { name: "Driving License", status: "Verified" },
      { name: "Vehicle RC", status: "Pending" },
    ],
    avatar: "AS",
    notes: "",
  },
  {
    id: "pv3",
    name: "Priya Sharma",
    applied: "1 day ago",
    status: "Action Required",
    documents: [{ name: "Insurance", status: "Rejected" }],
    avatar: "PS",
    notes: "Insurance document is blurry.",
  },
];

export default function VerificationPage() {
  const router = useRouter();

  const handleVerifyClick = (id: string) => {
    router.push(`/rider/verification/${id}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Rider Verification
          </h1>
          <p className="text-slate-500 mt-1">
            Review and approve new rider applications
          </p>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-amber-500" />
            Pending Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingVerifications.map((item) => (
                <TableRow key={item.id} className="group hover:bg-slate-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-amber-100 text-amber-700">
                          {item.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-semibold text-slate-900 block">
                          {item.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          ID: {item.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {item.applied}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.documents.map((doc, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={`text-[10px] bg-white ${
                            doc.status === "Verified"
                              ? "border-green-200 text-green-700"
                              : doc.status === "Rejected"
                                ? "border-red-200 text-red-700"
                                : "border-slate-200 text-slate-600"
                          }`}
                        >
                          {doc.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          item.status === "Pending"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : item.status === "Action Required"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-blue-100 text-blue-700 border-blue-200"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-[#3E8940] hover:bg-[#3E8940]/90"
                      onClick={() => handleVerifyClick(item.id)}
                    >
                      Verify
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
