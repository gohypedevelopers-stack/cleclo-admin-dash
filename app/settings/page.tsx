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
import { Bell, Globe, Save, Settings } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [vendorAppAlerts, setVendorAppAlerts] = useState(true);
  const [issueAlerts, setIssueAlerts] = useState(true);
  const [autoApproveVendors, setAutoApproveVendors] = useState(false);
  const [commissionRate, setCommissionRate] = useState("15");

  return (
    <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="text-slate-500 text-lg">
            Manage your dashboard preferences and configurations
          </p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 shadow-sm">
          <Save className="h-4 w-4" /> Save Changes
        </Button>
      </div>

      <div className="grid gap-8">
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100/50 rounded-lg border border-blue-100">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Notifications</CardTitle>
                <CardDescription>
                  Control how you receive alerts and updates
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-slate-500">
                    Receive daily summaries and critical alerts via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-slate-500">
                    Get real-time updates in your browser
                  </p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-start">
                <span className="bg-white pr-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Alert Types
                </span>
              </div>
            </div>

            <div className="grid gap-4 pl-4 border-l-2 border-slate-100 ml-1">
              <div className="flex items-center justify-between group">
                <Label className="font-normal text-slate-600 group-hover:text-slate-900 transition-colors">
                  New Order Alerts
                </Label>
                <Switch
                  checked={newOrderAlerts}
                  onCheckedChange={setNewOrderAlerts}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
              <div className="flex items-center justify-between group">
                <Label className="font-normal text-slate-600 group-hover:text-slate-900 transition-colors">
                  Vendor Application Alerts
                </Label>
                <Switch
                  checked={vendorAppAlerts}
                  onCheckedChange={setVendorAppAlerts}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
              <div className="flex items-center justify-between group">
                <Label className="font-normal text-slate-600 group-hover:text-slate-900 transition-colors">
                  Issue & Report Alerts
                </Label>
                <Switch
                  checked={issueAlerts}
                  onCheckedChange={setIssueAlerts}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100/50 rounded-lg border border-purple-100">
                <Globe className="h-5 w-5 text-purple-600" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl">Platform Settings</CardTitle>
                <CardDescription>
                  Configure global defaults for the platform
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Default Commission Rate
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative max-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                      %
                    </span>
                    <Input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="pl-8 font-medium text-lg"
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    This rate will be applied to all new vendor registrations by
                    default.
                  </p>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    Auto-Approve Vendors
                  </Label>
                  <p className="text-sm text-slate-500">
                    Automatically approve new vendors without manual review (Not
                    Recommended)
                  </p>
                </div>
                <Switch
                  checked={autoApproveVendors}
                  onCheckedChange={setAutoApproveVendors}
                  className="data-[state=checked]:bg-[#3E8940]"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
