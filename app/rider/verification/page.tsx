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
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

export default function VerificationPage() {
  const router = useRouter();
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPendingRiders() {
      try {
        setLoading(true);
        const res = await fetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load riders");
        const data = await res.json();
        
        // Filter users who are specifically riders AND not active (i.e. pending approval)
        const riders = data.filter((u: any) => 
            (u.role?.toLowerCase() === 'rider' || u.vendorProfile?.businessType === 'rider') &&
            u.status !== 'active'
        );
        
        setPendingVerifications(riders);
      } catch (err) {
        toast.error("Failed to load generic overview.");
      } finally {
        setLoading(false);
      }
    }
    loadPendingRiders();
  }, []);

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
            Pending Requests ({pendingVerifications.length})
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3E8940] mb-2" />
                    Loading Applications...
                  </TableCell>
                </TableRow>
              ) : pendingVerifications.length === 0 ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    No pending riders require verification.
                  </TableCell>
                </TableRow>
              ) : (
                pendingVerifications.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-amber-100 text-amber-700 uppercase">
                            {(item.name || "U")[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-semibold text-slate-900 block truncate max-w-[150px]">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[150px]">
                            ID: {item.id}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white border-slate-200 text-slate-600"
                        >
                          Driving License
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-white border-slate-200 text-slate-600"
                        >
                          Vehicle RC
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            item.status === "pending" || !item.status
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-red-100 text-red-700 border-red-200"
                          }
                        >
                          {item.status || "Pending Verification"}
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
