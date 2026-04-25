"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Shield, 
  Clock, 
  ArrowLeft, 
  History, 
  Database, 
  User, 
  Eye, 
  Download, 
  AlertCircle, 
  ShieldCheck,
  MoreVertical,
  Activity
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
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// Mock Audit Logs
const AUDIT_LOGS = [
  {
    id: "LOG-8821",
    timestamp: "2024-10-25T10:30:00Z",
    admin: "Aniket Sharma",
    role: "Super Admin",
    action: "UPDATE_COMMISSION",
    entity: "Vendor",
    target: "Bright Laundry (VEN-001)",
    change: "Commission 15% -> 12%",
    severity: "Medium",
    ip: "192.168.1.1"
  },
  {
    id: "LOG-8820",
    timestamp: "2024-10-25T09:15:00Z",
    admin: "Priya Singh",
    role: "Operations",
    action: "APPROVE_GROUND_INSPECTION",
    entity: "Vendor",
    target: "Cleclo Express (VEN-042)",
    change: "Facility Check: Passed",
    severity: "Low",
    ip: "192.168.1.42"
  },
  {
    id: "LOG-8819",
    timestamp: "2024-10-25T08:45:00Z",
    admin: "Rahul Gupta",
    role: "Finance",
    action: "PROCESS_PAYOUT",
    entity: "Rider",
    target: "Amit Kumar (RID-104)",
    change: "Amount: ₹4,250",
    severity: "High",
    ip: "192.168.1.12"
  },
  {
    id: "LOG-8818",
    timestamp: "2024-10-24T18:20:00Z",
    admin: "Aniket Sharma",
    role: "Super Admin",
    action: "BLOCK_USER",
    entity: "Customer",
    target: "John Doe (CUST-901)",
    change: "Status: Active -> Blocked",
    severity: "High",
    ip: "192.168.1.1"
  },
  {
    id: "LOG-8817",
    timestamp: "2024-10-24T16:10:00Z",
    admin: "Priya Singh",
    role: "Operations",
    action: "CREATE_BANNER",
    entity: "Campaign",
    target: "Diwali Special Offer",
    change: "New Growth Banner added",
    severity: "Low",
    ip: "192.168.1.42"
  }
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "High": return "bg-red-50 text-red-700 border-red-200";
    case "Medium": return "bg-amber-50 text-amber-700 border-amber-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export default function AuditLogsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return AUDIT_LOGS.filter(log => {
      const matchesSearch = 
        log.admin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || log.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [searchTerm, roleFilter]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mb-3 gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8 text-[#3E8940]" />
            Global Audit Trail
          </h1>
          <p className="text-slate-500 mt-1">
            Tracking every administrative action across the platform for transparency and compliance.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 h-9 px-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Immutable Logs Active
          </Badge>
        </div>
      </div>

      {/* Audit Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-slate-50/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Actions (24h)</p>
            <h3 className="text-2xl font-bold text-slate-900">142</h3>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">High Severity</p>
            <h3 className="text-2xl font-bold text-red-700">12</h3>
          </CardContent>
        </Card>
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Unique Admins</p>
            <h3 className="text-2xl font-bold text-blue-700">8</h3>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50/50 border-emerald-100">
          <CardContent className="p-4">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">System Health</p>
            <h3 className="text-2xl font-bold text-emerald-700">100%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by Admin, Action, or Target..." 
            className="pl-10 bg-slate-50 border-none rounded-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button 
            variant={roleFilter === "all" ? "default" : "outline"} 
            className="rounded-xl h-9 text-xs"
            onClick={() => setRoleFilter("all")}
          >All Roles</Button>
          <Button 
            variant={roleFilter === "Super Admin" ? "default" : "outline"} 
            className="rounded-xl h-9 text-xs"
            onClick={() => setRoleFilter("Super Admin")}
          >Super Admin</Button>
          <Button 
            variant={roleFilter === "Operations" ? "default" : "outline"} 
            className="rounded-xl h-9 text-xs"
            onClick={() => setRoleFilter("Operations")}
          >Operations</Button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 pl-6">Timestamp / ID</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4">Admin / Role</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4">Action</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4">Target Entity</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4">Severity</TableHead>
              <TableHead className="text-xs font-bold uppercase text-slate-500 py-4 text-right pr-6">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                <TableCell className="pl-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">{log.admin}</span>
                      <span className="text-[10px] text-[#3E8940] font-bold uppercase">{log.role}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-slate-700">{log.action}</span>
                    <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{log.change}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-500 border-slate-200">
                      {log.entity}
                    </Badge>
                    <span className="text-xs font-medium text-slate-600">{log.target}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] font-bold ${getSeverityColor(log.severity)}`}>
                    {log.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                  <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  No audit logs found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Security Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">Security Best Practice</h4>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Audit logs are immutable and cryptographically signed. Review high-severity logs weekly to ensure platform integrity and catch unauthorized administrative actions early.
          </p>
        </div>
      </div>
    </div>
  );
}
