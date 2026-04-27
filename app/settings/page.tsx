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
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
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

interface PlatformConfig {
  defaultCommissionRate: number;
  autoApproveVendors: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  newOrderAlerts: boolean;
  vendorApplicationAlerts: boolean;
  issueAlerts: boolean;
  settlementAlerts: boolean;
  riderAlerts: boolean;
  maxLoginAttempts: number;
  captchaAfterAttempts: number;
  supportedCities: string[];
  defaultDeliveryType: string;
  minOrderAmount: number;
  maxOrderAmount: number;
}

const DEFAULT_CONFIG: PlatformConfig = {
  defaultCommissionRate: 15,
  autoApproveVendors: false,
  emailNotifications: true,
  pushNotifications: true,
  newOrderAlerts: true,
  vendorApplicationAlerts: true,
  issueAlerts: true,
  settlementAlerts: true,
  riderAlerts: true,
  maxLoginAttempts: 5,
  captchaAfterAttempts: 3,
  supportedCities: ["Bangalore", "Delhi", "Hyderabad", "Mumbai", "Pune"],
  defaultDeliveryType: "Standard",
  minOrderAmount: 99,
  maxOrderAmount: 25000,
};

export default function SettingsPage() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [newCity, setNewCity] = useState("");

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/wallet/config`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfig({ ...DEFAULT_CONFIG, ...data });
      }
      // If 404 or error, use defaults — settings page is self-bootstrapping
    } catch (err: any) {
      // Use defaults on network error
      console.error("Settings fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateField = (field: keyof PlatformConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`${AUTH_API_URL}/wallet/config`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved successfully", {
        description: "Platform configuration has been updated.",
      });
      setHasChanges(false);
    } catch (err: any) {
      toast.error("Failed to save settings", { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCity = () => {
    if (newCity.trim() && !config.supportedCities.includes(newCity.trim())) {
      updateField("supportedCities", [...config.supportedCities, newCity.trim()]);
      setNewCity("");
    }
  };

  const handleRemoveCity = (city: string) => {
    updateField("supportedCities", config.supportedCities.filter((c) => c !== city));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#3E8940]" />
        <p className="text-sm font-medium text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
          <p className="text-slate-500 text-lg">Manage your dashboard preferences and configurations</p>
        </div>
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 shadow-sm rounded-xl"
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          You have unsaved changes. Click "Save Changes" to apply.
        </div>
      )}

      <div className="grid gap-8">
        {/* Notifications */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100/50 rounded-xl border border-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Notifications</CardTitle>
                <CardDescription>Control how you receive alerts and updates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Email Notifications</Label>
                  <p className="text-sm text-slate-500">Receive daily summaries and critical alerts via email</p>
                </div>
                <Switch checked={config.emailNotifications} onCheckedChange={(v) => updateField("emailNotifications", v)} className="data-[state=checked]:bg-[#3E8940]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Push Notifications</Label>
                  <p className="text-sm text-slate-500">Get real-time updates in your browser</p>
                </div>
                <Switch checked={config.pushNotifications} onCheckedChange={(v) => updateField("pushNotifications", v)} className="data-[state=checked]:bg-[#3E8940]" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
              <div className="relative flex justify-start">
                <span className="bg-white pr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Alert Types</span>
              </div>
            </div>

            <div className="grid gap-4 pl-4 border-l-2 border-slate-100 ml-1">
              {[
                { key: "newOrderAlerts" as const, label: "New Order Alerts" },
                { key: "vendorApplicationAlerts" as const, label: "Vendor Application Alerts" },
                { key: "issueAlerts" as const, label: "Issue & Report Alerts" },
                { key: "settlementAlerts" as const, label: "Settlement & Payout Alerts" },
                { key: "riderAlerts" as const, label: "Rider Status Alerts" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between group">
                  <Label className="font-normal text-slate-600 group-hover:text-slate-900 transition-colors">{label}</Label>
                  <Switch checked={config[key]} onCheckedChange={(v) => updateField(key, v)} className="data-[state=checked]:bg-[#3E8940]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Settings */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100/50 rounded-xl border border-purple-100">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Platform Settings</CardTitle>
                <CardDescription>Configure global defaults for the platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6">
              {/* Commission Rate */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Default Commission Rate</Label>
                <div className="flex items-center gap-4">
                  <div className="relative max-w-[200px]">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="number"
                      value={config.defaultCommissionRate}
                      onChange={(e) => updateField("defaultCommissionRate", parseFloat(e.target.value) || 0)}
                      className="pl-9 font-medium text-lg rounded-xl"
                      min={0}
                      max={100}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                  </div>
                  <p className="text-sm text-slate-500">Applied to all new vendor registrations by default.</p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Order Limits */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Order Amount Limits</Label>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Minimum (₹)</Label>
                    <Input
                      type="number"
                      value={config.minOrderAmount}
                      onChange={(e) => updateField("minOrderAmount", parseInt(e.target.value) || 0)}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Maximum (₹)</Label>
                    <Input
                      type="number"
                      value={config.maxOrderAmount}
                      onChange={(e) => updateField("maxOrderAmount", parseInt(e.target.value) || 0)}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Auto-Approve */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Auto-Approve Vendors</Label>
                  <p className="text-sm text-slate-500">Automatically approve new vendors without manual review (Not Recommended)</p>
                </div>
                <Switch checked={config.autoApproveVendors} onCheckedChange={(v) => updateField("autoApproveVendors", v)} className="data-[state=checked]:bg-[#3E8940]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100/50 rounded-xl border border-red-100">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Security</CardTitle>
                <CardDescription>Login protection and access control settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Max Login Attempts</Label>
                <Input
                  type="number"
                  value={config.maxLoginAttempts}
                  onChange={(e) => updateField("maxLoginAttempts", parseInt(e.target.value) || 5)}
                  className="rounded-xl"
                  min={1}
                  max={20}
                />
                <p className="text-[10px] text-slate-400">Account locks after this many failed attempts</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">CAPTCHA After Attempts</Label>
                <Input
                  type="number"
                  value={config.captchaAfterAttempts}
                  onChange={(e) => updateField("captchaAfterAttempts", parseInt(e.target.value) || 3)}
                  className="rounded-xl"
                  min={1}
                  max={10}
                />
                <p className="text-[10px] text-slate-400">Show CAPTCHA challenge after this many failures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-City Configuration */}
        <Card className="border-slate-200 shadow-sm overflow-hidden rounded-2xl">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100/50 rounded-xl border border-emerald-100">
                <MapPin className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Service Areas</CardTitle>
                <CardDescription>Manage cities where the platform operates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-2">
              {config.supportedCities.map((city) => (
                <div
                  key={city}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700 group"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {city}
                  <button
                    onClick={() => handleRemoveCity(city)}
                    className="ml-1 h-4 w-4 rounded-full bg-emerald-200 text-emerald-700 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 max-w-sm">
              <Input
                placeholder="Add new city..."
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
                className="rounded-xl"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCity}
                disabled={!newCity.trim()}
                className="rounded-xl whitespace-nowrap"
              >
                Add City
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

  );
}
