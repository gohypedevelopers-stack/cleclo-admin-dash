"use client";

import { useState } from "react";
import {
  MapPin,
  Save,
  RefreshCcw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function OrderSettingsPage() {
  const [settings, setSettings] = useState({
    autoAssignRadius: 5,
    autoAssignEnabled: true,
    maxOrdersPerVendor: 20,
    prioritizeRating: true,
    prioritizeDistance: true,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl text-black font-bold tracking-tight">
          Order Settings
        </h1>
        <p className="text-slate-500 mt-1">
          Configure order allocation and assignment rules
        </p>
      </div>

      {/* Auto-Assign Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-black">Auto-Assign Orders</h2>
            <p className="text-sm text-slate-500">
              Automatically assign orders to nearest vendors
            </p>
          </div>
          <Switch
            checked={settings.autoAssignEnabled}
            onCheckedChange={(checked) =>
              setSettings((s) => ({ ...s, autoAssignEnabled: checked }))
            }
          />
        </div>

        {settings.autoAssignEnabled && (
          <>
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">
                Auto-Assign Radius (km)
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <Input
                    type="number"
                    value={settings.autoAssignRadius}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        autoAssignRadius: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-24"
                  />
                  <span className="text-slate-500">km</span>
                </div>
                <p className="text-sm text-slate-500">
                  Orders will be assigned to vendors within this radius
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-medium">
                Max Orders Per Vendor (Daily)
              </Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={settings.maxOrdersPerVendor}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      maxOrdersPerVendor: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-24"
                />
                <p className="text-sm text-slate-500">
                  Limit orders to prevent vendor overload
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <Label className="text-sm font-medium">Priority Factors</Label>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-black">Prioritize by Rating</p>
                  <p className="text-sm text-slate-500">
                    Higher rated vendors get priority
                  </p>
                </div>
                <Switch
                  checked={settings.prioritizeRating}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, prioritizeRating: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-black">
                    Prioritize by Distance
                  </p>
                  <p className="text-sm text-slate-500">
                    Nearest vendors get priority
                  </p>
                </div>
                <Switch
                  checked={settings.prioritizeDistance}
                  onCheckedChange={(checked) =>
                    setSettings((s) => ({ ...s, prioritizeDistance: checked }))
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Override Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <RefreshCcw className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-800">Manual Override</p>
          <p className="text-sm text-blue-700 mt-1">
            You can manually reassign any order from the Orders page by clicking
            on the order and selecting &quot;Reassign Vendor&quot; from the
            dropdown menu.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
        {saved && (
          <Badge className="bg-green-100 text-green-700 border-none gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Settings saved!
          </Badge>
        )}
      </div>
    </div>
  );
}

