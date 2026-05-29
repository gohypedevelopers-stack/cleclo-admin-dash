"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Bell,
  Globe,
  Save,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Shield,
  MapPin,
  IndianRupee,
  CheckCircle,
  ShieldCheck,
  User,
  Camera,
  Mail,
  Smartphone,
  Lock,
  Truck,
  Timer,
  FileText,
  BadgePercent,
  Settings2,
  Zap,
  HardHat,
  Scale,
  Building2,
  History,
  AlertCircle,
  Calendar,
  GanttChartSquare,
  Users2,
  Plus,
  Trash2
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// --- Interfaces & Defaults ---

interface NotificationSetting {
  enabled: boolean;
  roles: string[]; // ["Super Admin", "Finance Manager", etc.]
}

interface VendorCommission {
  vendorName: string;
  rate: number;
}

interface SettingsConfig {
  // General
  defaultCommissionRate: number;
  expressCommissionOverride: number;
  settlementCycle: "Weekly" | "Bi-Weekly" | "Monthly";
  customVendorCommissions: VendorCommission[];
  
  // Notifications
  notifications: {
    orders: {
      expressAlert: NotificationSetting;
      slaBreach: NotificationSetting;
      unassigned30m: NotificationSetting;
    };
    vendors: {
      settlementPending3d: NotificationSetting;
      highComplaint: NotificationSetting;
    };
    riders: {
      lowRating: NotificationSetting;
      highCancellation: NotificationSetting;
      docExpiry: NotificationSetting;
    };
    finance: {
      failedPayout: NotificationSetting;
      largeSettlement: NotificationSetting;
    };
  };

  // Allocation
  allocation: {
    autoAssign: boolean;
    priorityRule: "Nearest Rider" | "Lowest Workload" | "Highest Rating";
    expressMultiplier: number;
  };

  // Payouts
  riderPayout: {
    baseRate: number;
    distanceRate: number;
    peakBonus: number;
    penaltyRules: string;
  };

  // SLA
  sla: {
    standardHours: number;
    expressHours: number;
    pickupHours: number;
    autoFlagBreach: boolean;
    autoApplyPenalty: boolean;
  };

  // Compliance
  compliance: {
    gstPercent: number;
    tdsPercent: number;
    autoInvoice: boolean;
    mandatoryPanGst: boolean;
  };

  // Policy
  policy: {
    damageCap: number;
    freeRewash: boolean;
    lateCompAmount: number;
  };

  supportedCities: string[];
}

const DEFAULT_CONFIG: SettingsConfig = {
  defaultCommissionRate: 15,
  expressCommissionOverride: 18,
  settlementCycle: "Weekly",
  customVendorCommissions: [
    { vendorName: "Royal Dry Cleaners", rate: 12 },
    { vendorName: "EcoWash Solutions", rate: 14 },
    { vendorName: "Express Laundry Hub", rate: 13.5 }
  ],
  notifications: {
    orders: {
      expressAlert: { enabled: true, roles: ["Super Admin", "Operations Head"] },
      slaBreach: { enabled: true, roles: ["Operations Head", "Support Team"] },
      unassigned30m: { enabled: true, roles: ["Operations Head"] },
    },
    vendors: {
      settlementPending3d: { enabled: true, roles: ["Finance Manager"] },
      highComplaint: { enabled: true, roles: ["Vendor Manager", "Support Team"] },
    },
    riders: {
      lowRating: { enabled: true, roles: ["Operations Head"] },
      highCancellation: { enabled: true, roles: ["Operations Head"] },
      docExpiry: { enabled: true, roles: ["Operations Head"] },
    },
    finance: {
      failedPayout: { enabled: true, roles: ["Finance Manager"] },
      largeSettlement: { enabled: true, roles: ["Super Admin", "Finance Manager"] },
    },
  },
  allocation: {
    autoAssign: true,
    priorityRule: "Nearest Rider",
    expressMultiplier: 1.5,
  },
  riderPayout: {
    baseRate: 40,
    distanceRate: 10,
    peakBonus: 15,
    penaltyRules: "₹50 for no-show, ₹20 for late pickup",
  },
  sla: {
    standardHours: 48,
    expressHours: 24,
    pickupHours: 2,
    autoFlagBreach: true,
    autoApplyPenalty: false,
  },
  compliance: {
    gstPercent: 18,
    tdsPercent: 1,
    autoInvoice: true,
    mandatoryPanGst: true,
  },
  policy: {
    damageCap: 2000,
    freeRewash: true,
    lateCompAmount: 50,
  },
  supportedCities: ["Mumbai", "Bangalore", "Delhi"],
};

const ROLES = ["Super Admin", "Finance Manager", "Operations Head", "Vendor Manager", "Support Team"];

// --- Components ---

function AccountSecurityCard() {
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return toast.error("New passwords do not match");
    }
    setIsUpdating(true);
    setTimeout(() => {
      toast.success("Security profile hardened successfully");
      setPasswords({ current: "", new: "", confirm: "" });
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100/50 rounded-xl border border-amber-100">
            <Lock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-black">Account Security</CardTitle>
            <CardDescription className="font-medium">Update your administrator credentials</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label className="text-xs font-black uppercase text-slate-400">Current Password</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">New Password</Label>
              <Input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Confirm</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={isUpdating}
            className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl font-bold w-full md:w-auto"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Harden Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ProfileDetailsCard() {
  const [formData, setFormData] = useState({ name: "Super Admin", email: "admin@cleclo.com", phone: "+91 9876543210", image: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setTimeout(() => {
      toast.success("Identity profile updated successfully");
      setIsUpdating(false);
    }, 800);
  };

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100/50 rounded-xl border border-indigo-100">
            <User className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl font-black">Profile Details</CardTitle>
            <CardDescription className="font-medium">Manage your administrator public identity</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl ring-1 ring-slate-100">
                <AvatarFallback className="bg-slate-100 text-slate-400 text-3xl font-black">SA</AvatarFallback>
              </Avatar>
              <label className="absolute bottom-1 right-1 h-9 w-9 bg-[#3E8940] text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-2 border-white">
                <Camera className="h-4 w-4" />
                <input type="file" className="hidden" accept="image/*" />
              </label>
            </div>
            <Badge className="rounded-full px-4 py-1 font-black text-[10px] uppercase tracking-wider bg-indigo-50 text-indigo-700 border-indigo-100">
              Super Admin
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 space-y-4 max-w-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-slate-400">Phone Number</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl font-bold gap-2"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Identity
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SettingsConfig>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [newCity, setNewCity] = useState("");
  const [isAddingVendorComm, setIsAddingVendorComm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorRate, setNewVendorRate] = useState("");

  const updateNestedField = (path: string, value: any) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
    setHasChanges(true);
  };

  const toggleRole = (path: string, role: string) => {
    const currentRoles = path.split('.').reduce((obj, key) => obj[key], config as any);
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter((r: string) => r !== role)
      : [...currentRoles, role];
    updateNestedField(path, newRoles);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      toast.success("Platform Governance Updated", {
        description: "All configuration changes are now live across the system.",
        className: "rounded-2xl border-emerald-100 font-bold"
      });
      setHasChanges(false);
      setIsSaving(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-8 p-8 max-w-6xl mx-auto w-full pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Platform Governance</h1>
          <p className="text-slate-500 font-medium text-lg">Centralized configuration engine for CleClo operations</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl border-slate-200 font-bold bg-white text-slate-600 gap-2">
              <History className="h-4 w-4" />
              Audit Log
           </Button>
           <Button
             className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 shadow-xl shadow-[#3E8940]/20 rounded-xl font-bold h-12 px-8"
             onClick={handleSave}
             disabled={!hasChanges || isSaving}
           >
             {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
             Deploy Changes
           </Button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm font-bold text-amber-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4" />
             </div>
             Pending architectural changes detected. Deploy to apply.
          </div>
          <Button variant="ghost" className="h-8 text-amber-700 hover:bg-amber-100 font-black text-xs uppercase" onClick={() => setHasChanges(false)}>Dismiss</Button>
        </div>
      )}

      <div className="grid gap-8">
        {/* Profile & Security Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <ProfileDetailsCard />
           <AccountSecurityCard />
        </div>

        {/* Granular Notification Governance */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100/50 rounded-xl border border-blue-100 shadow-sm">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black">Notification Governance</CardTitle>
                  <CardDescription className="font-medium">Define role-based alerting thresholds and event triggers</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-2 bg-white border border-slate-100 rounded-xl shadow-sm">
                 <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Master Email</Label>
                    <Switch checked={true} className="scale-75 data-[state=checked]:bg-blue-600" />
                 </div>
                 <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Master Push</Label>
                    <Switch checked={true} className="scale-75 data-[state=checked]:bg-blue-600" />
                 </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 border-b border-slate-100">
                     <tr>
                        <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-6">Alert Context & Trigger</th>
                        {ROLES.map(role => (
                          <th key={role} className="p-4 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center whitespace-nowrap">{role}</th>
                        ))}
                        <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-6">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {/* Orders Section */}
                     <tr className="bg-slate-50/30">
                        <td colSpan={ROLES.length + 2} className="p-3 pl-6 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50/50">Orders & Fulfillment</td>
                     </tr>
                     {[
                       { path: 'notifications.orders.expressAlert', label: 'Express Order Alert', desc: 'Real-time ping for high-priority pickups' },
                       { path: 'notifications.orders.slaBreach', label: 'SLA Breach (Risk Level)', desc: 'Alert when order is within 10% of breach' },
                       { path: 'notifications.orders.unassigned30m', label: 'Unassigned > 30 mins', desc: 'Escalate unallocated express orders' },
                     ].map(item => (
                       <tr key={item.path} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6">
                             <p className="text-sm font-black text-slate-900 leading-tight">{item.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                          </td>
                          {ROLES.map(role => (
                            <td key={role} className="p-4 text-center">
                               <input 
                                 type="checkbox" 
                                 className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                 checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).roles.includes(role)}
                                 onChange={() => toggleRole(`${item.path}.roles`, role)}
                               />
                            </td>
                          ))}
                          <td className="p-4 text-right pr-6">
                             <Switch 
                               checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).enabled} 
                               onCheckedChange={(v) => updateNestedField(`${item.path}.enabled`, v)}
                               className="scale-90 data-[state=checked]:bg-blue-600" 
                             />
                          </td>
                       </tr>
                     ))}

                     {/* Vendors Section */}
                     <tr className="bg-slate-50/30">
                        <td colSpan={ROLES.length + 2} className="p-3 pl-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50/50">Vendor Operations</td>
                     </tr>
                     {[
                       { path: 'notifications.vendors.settlementPending3d', label: 'Settlement Aging > 3 Days', desc: 'Warn finance of pending payouts' },
                       { path: 'notifications.vendors.highComplaint', label: 'High Complaint Volume', desc: 'Flag vendors with > 5 complaints in 24h' },
                     ].map(item => (
                       <tr key={item.path} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6">
                             <p className="text-sm font-black text-slate-900 leading-tight">{item.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                          </td>
                          {ROLES.map(role => (
                            <td key={role} className="p-4 text-center">
                               <input 
                                 type="checkbox" 
                                 className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                 checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).roles.includes(role)}
                                 onChange={() => toggleRole(`${item.path}.roles`, role)}
                               />
                            </td>
                          ))}
                          <td className="p-4 text-right pr-6">
                             <Switch 
                               checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).enabled} 
                               onCheckedChange={(v) => updateNestedField(`${item.path}.enabled`, v)}
                               className="scale-90 data-[state=checked]:bg-emerald-600" 
                             />
                          </td>
                       </tr>
                     ))}

                     {/* Riders Section */}
                     <tr className="bg-slate-50/30">
                        <td colSpan={ROLES.length + 2} className="p-3 pl-6 text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-50/50">Rider Fleet Management</td>
                     </tr>
                     {[
                       { path: 'notifications.riders.lowRating', label: 'Critical Low Rating (< 3.0)', desc: 'Instant alert for immediate retraining' },
                       { path: 'notifications.riders.highCancellation', label: 'Fraudulent Cancellation Pattern', desc: 'Flag > 2 cancellations in a shift' },
                       { path: 'notifications.riders.docExpiry', label: 'Document Expiry Warning', desc: 'Notify 7 days before DL/Insurance expiry' },
                     ].map(item => (
                       <tr key={item.path} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6">
                             <p className="text-sm font-black text-slate-900 leading-tight">{item.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                          </td>
                          {ROLES.map(role => (
                            <td key={role} className="p-4 text-center">
                               <input 
                                 type="checkbox" 
                                 className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                 checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).roles.includes(role)}
                                 onChange={() => toggleRole(`${item.path}.roles`, role)}
                               />
                            </td>
                          ))}
                          <td className="p-4 text-right pr-6">
                             <Switch 
                               checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).enabled} 
                               onCheckedChange={(v) => updateNestedField(`${item.path}.enabled`, v)}
                               className="scale-90 data-[state=checked]:bg-amber-600" 
                             />
                          </td>
                       </tr>
                     ))}

                     {/* Finance Section */}
                     <tr className="bg-slate-50/30">
                        <td colSpan={ROLES.length + 2} className="p-3 pl-6 text-[10px] font-black text-red-600 uppercase tracking-widest bg-red-50/50">Financial Compliance</td>
                     </tr>
                     {[
                       { path: 'notifications.finance.failedPayout', label: 'Failed Payout Disbursal', desc: 'Alert finance for bank-level rejection' },
                       { path: 'notifications.finance.largeSettlement', label: 'High-Value Settlement (> ₹50k)', desc: 'Require 2nd tier auth for bulk payouts' },
                     ].map(item => (
                       <tr key={item.path} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 pl-6">
                             <p className="text-sm font-black text-slate-900 leading-tight">{item.label}</p>
                             <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                          </td>
                          {ROLES.map(role => (
                            <td key={role} className="p-4 text-center">
                               <input 
                                 type="checkbox" 
                                 className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                                 checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).roles.includes(role)}
                                 onChange={() => toggleRole(`${item.path}.roles`, role)}
                               />
                            </td>
                          ))}
                          <td className="p-4 text-right pr-6">
                             <Switch 
                               checked={(item.path.split('.').reduce((obj, key) => obj[key], config as any)).enabled} 
                               onCheckedChange={(v) => updateNestedField(`${item.path}.enabled`, v)}
                               className="scale-90 data-[state=checked]:bg-red-600" 
                             />
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </CardContent>
        </Card>

        {/* Operational Logic Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Allocation Logic */}
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl flex flex-col">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="p-2 bg-purple-100/50 rounded-xl border border-purple-100 shadow-sm">
                          <Truck className="h-5 w-5 text-purple-600" />
                       </div>
                       <div className="space-y-1">
                          <CardTitle className="text-xl font-black">Allocation Logic</CardTitle>
                          <CardDescription className="font-medium">Define how orders are distributed to riders</CardDescription>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={cn("text-xs font-black uppercase tracking-wider", config.allocation.autoAssign ? "text-[#3E8940]" : "text-slate-400")}>
                          Auto-Assign Rider: {config.allocation.autoAssign ? "ON" : "OFF"}
                       </span>
                       <Switch checked={config.allocation.autoAssign} onCheckedChange={(v) => updateNestedField('allocation.autoAssign', v)} className="data-[state=checked]:bg-[#3E8940]" />
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 flex-1">
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Primary Priority Rule</Label>
                    <Select value={config.allocation.priorityRule} onValueChange={(v: any) => updateNestedField('allocation.priorityRule', v)}>
                       <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          <SelectItem value="Nearest Rider" className="font-bold">Nearest Rider</SelectItem>
                          <SelectItem value="Lowest Workload" className="font-bold">Lowest Workload</SelectItem>
                          <SelectItem value="Highest Rating" className="font-bold">Highest Rating</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center justify-between">
                       <Label className="text-xs font-black uppercase text-slate-400">Express Orders → Priority Multiplier</Label>
                       <Badge className="bg-purple-50 text-purple-700 border-purple-100 font-black text-[10px]">Active</Badge>
                    </div>
                    <div className="relative">
                       <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400" />
                       <Input 
                         type="number" 
                         step="0.1" 
                         value={config.allocation.expressMultiplier}
                         onChange={(e) => updateNestedField('allocation.expressMultiplier', parseFloat(e.target.value))}
                         className="pl-10 rounded-xl border-slate-200 h-12 font-black text-lg" 
                       />
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-sm">Multiplier Factor</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Higher value pulls riders from further distances for express pickups</p>
                 </div>
              </CardContent>
           </Card>

           {/* SLA Engine */}
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl flex flex-col">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-orange-100/50 rounded-xl border border-orange-100 shadow-sm">
                       <Timer className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                       <CardTitle className="text-xl font-black">SLA Configuration Engine</CardTitle>
                       <CardDescription className="font-medium">Configure fulfillment time-limits and automated actions</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 flex-1">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Standard Orders SLA</Label>
                       <Input 
                         type="number" 
                         value={config.sla.standardHours} 
                         onChange={(e) => updateNestedField('sla.standardHours', parseInt(e.target.value))}
                         className="rounded-xl font-black h-12" 
                       />
                       <p className="text-[9px] text-center font-black text-slate-300 uppercase">Hours</p>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-orange-500">Express Orders SLA</Label>
                       <Input 
                         type="number" 
                         value={config.sla.expressHours} 
                         onChange={(e) => updateNestedField('sla.expressHours', parseInt(e.target.value))}
                         className="rounded-xl font-black h-12 border-orange-100 bg-orange-50/30 text-orange-600" 
                       />
                       <p className="text-[9px] text-center font-black text-slate-300 uppercase">Hours</p>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Pickup SLA</Label>
                       <Input 
                         type="number" 
                         value={config.sla.pickupHours} 
                         onChange={(e) => updateNestedField('sla.pickupHours', parseInt(e.target.value))}
                         className="rounded-xl font-black h-12" 
                       />
                       <p className="text-[9px] text-center font-black text-slate-300 uppercase">Hours</p>
                    </div>
                 </div>
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-800">Auto-Flag Breach</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Send alert as soon as timer reaches 0</p>
                       </div>
                       <Switch checked={config.sla.autoFlagBreach} onCheckedChange={(v) => updateNestedField('sla.autoFlagBreach', v)} className="data-[state=checked]:bg-orange-600" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-800">Auto-Apply Penalty</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase text-red-500 underline">Deduct penalty from vendor/rider wallet</p>
                       </div>
                       <Switch checked={config.sla.autoApplyPenalty} onCheckedChange={(v) => updateNestedField('sla.autoApplyPenalty', v)} className="data-[state=checked]:bg-red-600" />
                    </div>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Finance & Payouts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Commission & Settlement */}
            <Card className="border-slate-200 shadow-md hover:shadow-lg overflow-hidden rounded-2xl flex flex-col transition-all duration-300">
               <CardHeader className="border-b bg-slate-50/50 pb-5">
                  <div className="flex items-center gap-3">
                     <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm transition-transform duration-300 hover:scale-105">
                        <BadgePercent className="h-5 w-5 text-indigo-600" />
                     </div>
                     <div className="space-y-1">
                        <CardTitle className="text-xl font-black text-slate-800">Commission Configuration Panel</CardTitle>
                        <CardDescription className="font-medium text-slate-500">Define platform revenue overrides and custom vendor models</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="pt-6 space-y-6 flex-1 bg-white/50 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Default Commission %</Label>
                        <div className="relative group">
                           <Input 
                             type="number" 
                             value={config.defaultCommissionRate} 
                             onChange={(e) => updateNestedField('defaultCommissionRate', parseFloat(e.target.value))}
                             className="rounded-xl h-12 font-black text-lg pr-10 border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all shadow-sm" 
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 group-focus-within:text-indigo-600 transition-colors">%</span>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-purple-600 tracking-wider">Commission Override for Express Orders</Label>
                        <div className="relative group">
                           <Input 
                             type="number" 
                             value={config.expressCommissionOverride} 
                             onChange={(e) => updateNestedField('expressCommissionOverride', parseFloat(e.target.value))}
                             className="rounded-xl h-12 font-black text-lg pr-10 border-purple-100 bg-purple-50/20 hover:bg-purple-50/40 focus:bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 transition-all text-purple-700 shadow-sm" 
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-purple-400 group-focus-within:text-purple-600 transition-colors">%</span>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Settlement Cycle</Label>
                     <Select value={config.settlementCycle} onValueChange={(v: any) => updateNestedField('settlementCycle', v)}>
                        <SelectTrigger className="rounded-xl border-slate-200 h-12 font-bold bg-slate-50/50 hover:bg-slate-50 transition-all">
                           <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="Weekly" className="font-bold">Weekly (Standard)</SelectItem>
                           <SelectItem value="Bi-Weekly" className="font-bold">Bi-Weekly (Fast Track)</SelectItem>
                           <SelectItem value="Monthly" className="font-bold">Monthly (Legacy Vendors)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>

                  {/* Custom Commission per Vendor overrides */}
                  <div className="space-y-4 pt-5 border-t border-slate-100">
                     <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Custom Commission per Vendor</Label>
                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">Active Overrides</Badge>
                     </div>

                     <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {config.customVendorCommissions?.map((vc, idx) => (
                           <div key={idx} className="flex items-center justify-between bg-slate-50/40 hover:bg-slate-50 p-3 rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-[0.5px]">
                              <div className="flex items-center gap-3">
                                 <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <Building2 className="h-4 w-4 text-indigo-600" />
                                 </div>
                                 <span className="text-xs font-black text-slate-700 tracking-tight">{vc.vendorName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="relative w-20">
                                    <input
                                      type="number"
                                      value={vc.rate}
                                      onChange={(e) => {
                                        const newComms = [...config.customVendorCommissions];
                                        newComms[idx].rate = parseFloat(e.target.value) || 0;
                                        updateNestedField('customVendorCommissions', newComms);
                                      }}
                                      className="w-full h-8 rounded-lg border border-slate-200 text-xs font-black text-center pr-5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all shadow-sm"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">%</span>
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   type="button"
                                   className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50/60 rounded-lg border border-transparent hover:border-red-100 transition-all shrink-0 shadow-sm hover:shadow"
                                   onClick={() => {
                                      const newComms = config.customVendorCommissions.filter((_, i) => i !== idx);
                                      updateNestedField('customVendorCommissions', newComms);
                                   }}
                                 >
                                    <Trash2 className="h-4 w-4" />
                                 </Button>
                              </div>
                           </div>
                        ))}
                        {(!config.customVendorCommissions || config.customVendorCommissions.length === 0) && (
                           <p className="text-xs text-slate-400 font-bold text-center py-5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">No custom vendor commissions configured.</p>
                        )}
                     </div>

                     {isAddingVendorComm ? (
                        <div className="space-y-3 p-3.5 bg-indigo-50/20 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                           <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                 <Label className="text-[9px] font-black uppercase text-slate-400">Vendor Name</Label>
                                 <Input
                                   placeholder="e.g. CleClo Express"
                                   value={newVendorName}
                                   onChange={(e) => setNewVendorName(e.target.value)}
                                   className="h-9 text-xs rounded-lg border-slate-200 bg-white"
                                 />
                              </div>
                              <div className="space-y-1">
                                 <Label className="text-[9px] font-black uppercase text-slate-400">Override Rate %</Label>
                                 <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="15"
                                      value={newVendorRate}
                                      onChange={(e) => setNewVendorRate(e.target.value)}
                                      className="h-9 text-xs rounded-lg border-slate-200 bg-white pr-6"
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">%</span>
                                 </div>
                              </div>
                           </div>
                           <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                type="button"
                                className="h-8 text-[10px] font-black uppercase text-slate-400 hover:bg-slate-100 rounded-lg"
                                onClick={() => {
                                   setIsAddingVendorComm(false);
                                   setNewVendorName("");
                                   setNewVendorRate("");
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                className="h-8 px-3 text-[10px] font-black uppercase bg-[#3E8940] hover:bg-[#3E8940]/90 text-white rounded-lg shadow"
                                onClick={() => {
                                   if (newVendorName && newVendorRate) {
                                      const newComms = [
                                         ...(config.customVendorCommissions || []),
                                         { vendorName: newVendorName, rate: parseFloat(newVendorRate) || 0 }
                                      ];
                                      updateNestedField('customVendorCommissions', newComms);
                                      setNewVendorName("");
                                      setNewVendorRate("");
                                      setIsAddingVendorComm(false);
                                   } else {
                                      toast.error("Please specify vendor name and commission rate");
                                   }
                                }}
                              >
                                Add Override
                              </Button>
                           </div>
                        </div>
                     ) : (
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:bg-indigo-50/30 font-bold text-xs rounded-xl h-10 gap-1.5 transition-all duration-200 hover:shadow-sm"
                          onClick={() => setIsAddingVendorComm(true)}
                        >
                           <Plus className="h-4 w-4" />
                           Add Custom Vendor Override
                        </Button>
                     )}
                  </div>
               </CardContent>
            </Card>

           {/* Rider Payout Model */}
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl flex flex-col">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100/50 rounded-xl border border-emerald-100 shadow-sm">
                       <IndianRupee className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="space-y-1">
                       <CardTitle className="text-xl font-black">Rider Payment Model Settings</CardTitle>
                       <CardDescription className="font-medium">Define fleet compensation and bonuses</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4 flex-1">
                 <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Per Delivery Base Rate</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={config.riderPayout.baseRate} 
                            onChange={(e) => updateNestedField('riderPayout.baseRate', parseFloat(e.target.value))}
                            className="rounded-xl font-black h-12 pl-6" 
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">₹</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-slate-400">Distance Rate (₹ per km)</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={config.riderPayout.distanceRate} 
                            onChange={(e) => updateNestedField('riderPayout.distanceRate', parseFloat(e.target.value))}
                            className="rounded-xl font-black h-12 pl-6" 
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">₹</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-[#3E8940]">Peak Hour Bonus</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={config.riderPayout.peakBonus} 
                            onChange={(e) => updateNestedField('riderPayout.peakBonus', parseFloat(e.target.value))}
                            className="rounded-xl font-black h-12 pl-6 border-emerald-100 bg-emerald-50/30 text-emerald-600" 
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xs">₹</span>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Penalty Rules</Label>
                    <textarea 
                      value={config.riderPayout.penaltyRules}
                      onChange={(e) => updateNestedField('riderPayout.penaltyRules', e.target.value)}
                      className="w-full h-20 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium focus:ring-2 focus:ring-[#3E8940] outline-none"
                      placeholder="Enter penalty logic..."
                    />
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Compliance & Policy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Tax & Compliance */}
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-xl border border-slate-200 shadow-sm">
                       <Scale className="h-5 w-5 text-slate-600" />
                    </div>
                    <div className="space-y-1">
                       <CardTitle className="text-xl font-black">Tax & Compliance Settings</CardTitle>
                       <CardDescription className="font-medium">Regulatory settings and automated invoicing</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase text-slate-400">GST %</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={config.compliance.gstPercent} 
                            onChange={(e) => updateNestedField('compliance.gstPercent', parseFloat(e.target.value))}
                            className="rounded-xl h-12 font-black text-lg pr-8" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-black uppercase text-slate-400">TDS %</Label>
                       <div className="relative">
                          <Input 
                            type="number" 
                            value={config.compliance.tdsPercent} 
                            onChange={(e) => updateNestedField('compliance.tdsPercent', parseFloat(e.target.value))}
                            className="rounded-xl h-12 font-black text-lg pr-8" 
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300">%</span>
                       </div>
                    </div>
                 </div>
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-800">Invoice Auto-Generation</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Generate PDF as soon as settlement is processed</p>
                       </div>
                       <Switch checked={config.compliance.autoInvoice} onCheckedChange={(v) => updateNestedField('compliance.autoInvoice', v)} className="data-[state=checked]:bg-[#3E8940]" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="space-y-0.5">
                          <p className="text-sm font-black text-slate-800">PAN/GST Mandatory Toggle</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase text-red-500">Block registration without verification documents</p>
                       </div>
                       <Switch checked={config.compliance.mandatoryPanGst} onCheckedChange={(v) => updateNestedField('compliance.mandatoryPanGst', v)} className="data-[state=checked]:bg-red-600" />
                    </div>
                 </div>
              </CardContent>
           </Card>

           {/* Damage & Compensation */}
           <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
              <CardHeader className="border-b bg-slate-50/50 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-red-100/50 rounded-xl border border-red-100 shadow-sm">
                       <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="space-y-1">
                       <CardTitle className="text-xl font-black">Damage & Compensation Policy Configuration</CardTitle>
                       <CardDescription className="font-medium">Define service recovery and liability policies</CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6 flex-1">
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Damage Compensation Cap</Label>
                    <div className="relative">
                       <Input 
                         type="number" 
                         value={config.policy.damageCap} 
                         onChange={(e) => updateNestedField('policy.damageCap', parseFloat(e.target.value))}
                         className="rounded-xl h-12 font-black text-lg pl-8" 
                       />
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-300">₹</span>
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs">Per Item Cap</span>
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-slate-400">Late Delivery Compensation</Label>
                    <div className="relative">
                       <Input 
                         type="number" 
                         value={config.policy.lateCompAmount} 
                         onChange={(e) => updateNestedField('policy.lateCompAmount', parseFloat(e.target.value))}
                         className="rounded-xl h-12 font-black text-lg pl-8 border-red-100 bg-red-50/30 text-red-600" 
                       />
                       <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-300">₹</span>
                       <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-300 text-xs">Wallet Credit</span>
                    </div>
                 </div>
                 <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                       <p className="text-sm font-black text-slate-800">Free Rewash Policy</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Enable 1-click free rewash for stain complaints</p>
                    </div>
                    <Switch checked={config.policy.freeRewash} onCheckedChange={(v) => updateNestedField('policy.freeRewash', v)} className="data-[state=checked]:bg-[#3E8940]" />
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Multi-City Configuration Layer */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/50 rounded-xl border border-emerald-100 shadow-sm">
                  <Globe className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black">Multi-City Configuration Layer</CardTitle>
                  <CardDescription className="font-medium">Define region-specific overrides for operations and pricing</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Input 
                   placeholder="Add region..." 
                   className="w-48 h-10 rounded-xl"
                   value={newCity}
                   onChange={(e) => setNewCity(e.target.value)}
                 />
                 <Button type="button" variant="outline" className="rounded-xl h-10 font-bold px-4" onClick={(e) => {
                   e.preventDefault();
                   if(newCity.trim()) {
                     setConfig(prev => ({ ...prev, supportedCities: [...prev.supportedCities, newCity.trim()] }));
                     setNewCity("");
                     setHasChanges(true);
                   }
                 }}>Add City</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50/50 border-b border-slate-100">
                      <tr>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest pl-6">Active City/Region</th>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Commission</th>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">SLA</th>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Rider Base Rate</th>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Express Pricing</th>
                         <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right pr-6">Status</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {config.supportedCities.map(city => (
                        <tr key={city} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-4 pl-6">
                              <div className="flex items-center gap-2">
                                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                 <p className="font-black text-slate-900">{city}</p>
                              </div>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-1">
                                 <input type="number" defaultValue={15} className="w-16 h-8 rounded-lg border-slate-200 text-xs font-black text-center" />
                                 <span className="text-[10px] font-black text-slate-300">%</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <input type="number" defaultValue={48} className="w-16 h-8 rounded-lg border-slate-200 text-xs font-black text-center" />
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-1">
                                 <span className="text-[10px] font-black text-slate-300">₹</span>
                                 <input type="number" defaultValue={40} className="w-16 h-8 rounded-lg border-slate-200 text-xs font-black text-center" />
                              </div>
                           </td>
                           <td className="p-4">
                              <input type="number" defaultValue={1.5} step="0.1" className="w-16 h-8 rounded-lg border-slate-200 text-xs font-black text-center" />
                           </td>
                           <td className="p-4 text-right pr-6">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black text-[9px] uppercase tracking-wider">Operational</Badge>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
