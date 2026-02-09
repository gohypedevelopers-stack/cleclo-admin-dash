"use client";

import { useState } from "react";
import { Wallet, Save, Gift, Plus, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

export default function WalletSettingsPage() {
  const [settings, setSettings] = useState({
    minAddAmount: 100,
    maxAddAmount: 10000,
    bonusEnabled: true,
    bonuses: [
      { threshold: 500, bonus: 25, active: true },
      { threshold: 1000, bonus: 75, active: true },
      { threshold: 2000, bonus: 200, active: true },
    ],
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleBonus = (index: number) => {
    setSettings((s) => ({
      ...s,
      bonuses: s.bonuses.map((b, i) =>
        i === index ? { ...b, active: !b.active } : b
      ),
    }));
  };

  const activeBonuses = settings.bonuses.filter((b) => b.active);
  const totalPotentialBonus = settings.bonuses.reduce(
    (sum, b) => sum + b.bonus,
    0
  );

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl text-black font-bold tracking-tight">
              Wallet Settings
            </h1>
            <p className="text-slate-500 mt-1">
              Configure add money limits and bonuses
            </p>
          </div>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 shadow-lg shadow-green-200/50"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save Settings"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-primary">
              ₹{settings.minAddAmount}
            </p>
            <p className="text-xs text-slate-500 mt-1">Min Amount</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{settings.maxAddAmount}
            </p>
            <p className="text-xs text-slate-500 mt-1">Max Amount</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-2">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {activeBonuses.length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Active Bonuses</p>
          </div>
        </div>

        {/* Add Money Limits */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200/50">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-black">Add Money Limits</h2>
              <p className="text-sm text-slate-500">
                Set minimum and maximum amounts
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-slate-600">Minimum Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  value={settings.minAddAmount}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      minAddAmount: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="pl-8 h-12 text-lg font-semibold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-600">Maximum Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  value={settings.maxAddAmount}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      maxAddAmount: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="pl-8 h-12 text-lg font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bonus Settings */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-200/50">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-black">
                  Add Money Bonuses
                </h2>
                <p className="text-sm text-slate-500">
                  Reward users for adding money
                </p>
              </div>
            </div>
            <Switch
              checked={settings.bonusEnabled}
              onCheckedChange={(checked) =>
                setSettings((s) => ({ ...s, bonusEnabled: checked }))
              }
            />
          </div>

          {settings.bonusEnabled && (
            <div className="space-y-3">
              {settings.bonuses.map((bonus, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                    bonus.active
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-center min-w-[80px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Add
                      </p>
                      <p className="text-xl font-bold text-black">
                        ₹{bonus.threshold}+
                      </p>
                    </div>
                    <div className="text-3xl text-slate-300">→</div>
                    <div className="text-center min-w-[80px]">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                        Get
                      </p>
                      <p className="text-xl font-bold text-green-600">
                        +₹{bonus.bonus}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        bonus.active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      } border-none`}
                    >
                      {Math.round((bonus.bonus / bonus.threshold) * 100)}% bonus
                    </Badge>
                  </div>
                  <Switch
                    checked={bonus.active}
                    onCheckedChange={() => toggleBonus(idx)}
                  />
                </div>
              ))}

              <Button
                variant="outline"
                className="w-full gap-2 border-dashed border-2 h-14 text-slate-500 hover:text-primary hover:border-primary"
              >
                <Plus className="h-4 w-4" />
                Add Bonus Tier
              </Button>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3E8940] via-[#4A9F4D] to-[#5FAD61] rounded-2xl p-6 text-white shadow-xl shadow-green-200/50">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5" />
              <p className="font-bold">Preview: Add Money Screen</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 space-y-3">
              {settings.bonuses
                .filter((b) => b.active)
                .map((bonus, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Gift className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        Add ₹{bonus.threshold}+
                      </span>
                    </div>
                    <Badge className="bg-white/25 text-white border-none font-bold">
                      +₹{bonus.bonus} Extra
                    </Badge>
                  </div>
                ))}
              {activeBonuses.length === 0 && (
                <p className="text-white/70 text-center py-4">
                  No active bonuses
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

