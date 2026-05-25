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
  Loader2,
  History,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:3000/api/admin/auth";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("admin_auth_token") || "" : ""}`,
});

const apiFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
    localStorage.removeItem("admin_auth_token");
    window.location.href = "/login";
  }
  return res;
};

export default function VerificationPage() {
  const router = useRouter();
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPendingRiders() {
      try {
        setLoading(true);
        const res = await apiFetch(`${AUTH_API_URL}/users`, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error("Failed to load riders");
        const data = await res.json();
        
        // Handle both array and object responses
        const allUsers = Array.isArray(data) ? data : (data.users || []);
        
        // Filter users who are specifically riders AND not active (i.e. pending approval)
        let riders = allUsers.filter((u: any) => 
            (u.role?.toLowerCase() === 'rider' || u.vendorProfile?.businessType === 'rider') &&
            u.status !== 'active'
        );
        
        // Seed Data for demonstration if empty
        if (riders.length === 0) {
          riders = [
            { id: "R-9921", name: "Deepak Sharma", createdAt: new Date().toISOString(), status: "pending", phone: "9833333333" },
            { id: "R-9922", name: "Rahul Verma", createdAt: new Date(Date.now() - 86400000).toISOString(), status: "pending", phone: "9011111111" },
            { id: "R-9923", name: "Arun Kumar", createdAt: new Date(Date.now() - 172800000).toISOString(), status: "rejected", phone: "9822222222" }
          ];
        }
        
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 shadow-sm border-slate-200 h-fit">
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

        {/* Expiry Dashboard Card */}
        <Card className="md:col-span-1 shadow-sm border-slate-200 bg-white h-fit">
          <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-bold text-slate-800">Document Expiry Dashboard</CardTitle>
            </div>
            <Badge className="bg-orange-100 text-orange-700 border-none font-bold text-[10px]">8 EXPIRED / 12 NEAR</Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {[
              { label: "Driving License Expiry", expired: 3, nearing: 5, color: "bg-rose-500" },
              { label: "Vehicle Insurance Expiry", expired: 5, nearing: 4, color: "bg-amber-500" },
              { label: "RC Expiry", expired: 0, nearing: 3, color: "bg-blue-500" },
            ].map((doc, i) => (
              <div key={i} className="space-y-1.5 border-b pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">{doc.label}</span>
                  <span className="text-rose-600">{doc.expired} Expired / {doc.nearing} Near</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                  <div className={doc.color} style={{ width: `${(doc.expired / 20) * 100}%` }} />
                  <div className="bg-amber-400" style={{ width: `${(doc.nearing / 20) * 100}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Total {doc.expired + doc.nearing} riders need updates</p>
              </div>
            ))}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <div className="flex gap-2">
                <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-amber-800">Auto-Alert System Active</p>
                  <p className="text-[10px] text-amber-700 leading-relaxed mt-0.5">Riders receive automated App & SMS notifications <b>30 days before document expiry</b> for quick re-uploads.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
