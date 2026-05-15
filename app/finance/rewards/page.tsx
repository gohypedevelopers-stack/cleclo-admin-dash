"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Edit,
  Gift,
  Plus,
  Save,
  Trash2,
  Wallet,
  Zap,
} from "lucide-react";
import { adminWalletApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type RewardRule = {
  id: string;
  name: string;
  type: "order_cashback" | "recharge_bonus";
  minAmount: number;
  rewardValue: number;
  rewardType: "percentage" | "fixed";
  isActive: boolean;
};

export default function RewardsPage() {
  const [rules, setRules] = useState<RewardRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    try {
      setLoading(true);
      const data = await adminWalletApi.getRewards();
      setRules(data);
    } catch (error) {
      toast.error("Failed to load reward rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleAddRule = () => {
    const newRule: RewardRule = {
      id: `temp-${Date.now()}`,
      name: "New Cashback Rule",
      type: "order_cashback",
      minAmount: 0,
      rewardValue: 0,
      rewardType: "percentage",
      isActive: true,
    };
    setRules([...rules, newRule]);
  };

  const handleUpdateRule = (id: string, updates: Partial<RewardRule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      // In a real app, we might have a bulk update endpoint or save individually
      // For now, let's assume we save the state back to the server
      for (const rule of rules) {
        if (rule.id.startsWith("temp-")) {
          const { id, ...data } = rule;
          await adminWalletApi.createReward(data);
        } else {
          await adminWalletApi.updateReward(rule.id, rule);
        }
      }
      toast.success("Reward rules saved successfully");
      loadRules();
    } catch (error) {
      toast.error("Failed to save rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2 gap-2 text-slate-500 hover:text-[#3E8940]">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3E8940]/10 text-[#3E8940] shadow-sm">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reward & Cashback Rules</h1>
              <p className="text-slate-500">Configure automated incentives for order loyalty and wallet top-ups.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="rounded-xl border-slate-200"
            onClick={loadRules}
            disabled={loading}
          >
            Reset
          </Button>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 rounded-xl px-6 shadow-lg shadow-emerald-900/10 transition-all active:scale-95"
            onClick={handleSaveAll}
            disabled={saving || loading}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8">
        {/* Order Cashback Section */}
        <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3E8940] text-white shadow-lg shadow-emerald-900/20">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Auto Cashback Rules</h2>
                  <p className="text-sm text-slate-500">Reward users with cashback on orders</p>
                </div>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#3E8940]" />
            </div>

            <div className="mt-8 space-y-3">
              {rules
                .filter((r) => r.type === "order_cashback")
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 transition-all hover:bg-emerald-50/40"
                  >
                    <div className="flex flex-1 items-center gap-4 lg:gap-12">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Orders Above</span>
                        <div className="flex items-center gap-1 group/input relative">
                           <span className="text-lg font-bold text-slate-800">Rs.</span>
                           <div className="relative">
                             <Input
                              type="number"
                              value={rule.minAmount}
                              onChange={(e) => handleUpdateRule(rule.id, { minAmount: Number(e.target.value) })}
                              className="h-10 w-24 rounded-lg border-emerald-100/50 bg-white text-lg font-bold text-slate-800 focus:border-[#3E8940] focus:ring-1 focus:ring-[#3E8940] transition-all px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                             <Edit className="absolute -right-2 -top-2 h-3 w-3 text-slate-300 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                           </div>
                          <span className="text-lg font-bold text-slate-800">+</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-2">
                         <div className="h-px w-8 bg-emerald-200" />
                         <ChevronRight className="h-4 w-4 text-emerald-300 -ml-1" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cashback</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                             <div className="relative group/edit">
                               <Input
                                type="number"
                                value={rule.rewardValue}
                                onChange={(e) => handleUpdateRule(rule.id, { rewardValue: Number(e.target.value) })}
                                className="h-10 w-16 rounded-lg border-emerald-100/50 bg-white text-lg font-bold text-emerald-600 focus:border-[#3E8940] focus:ring-1 focus:ring-[#3E8940] transition-all px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                                <Edit className="h-2 w-2 text-slate-500" />
                              </div>
                             </div>
                            <span className="text-lg font-bold text-emerald-600">%</span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 border-none font-medium px-2 py-0 h-5 text-[9px] uppercase tracking-wider">
                            Cashback
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all rounded-full border border-slate-100"
                        onClick={() => handleRemoveRule(rule.id)}
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="h-8 w-px bg-slate-100 mx-1" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Active</span>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => handleUpdateRule(rule.id, { isActive: checked })}
                          className="data-[state=checked]:bg-[#3E8940] scale-90"
                        />
                      </div>
                    </div>
                  </div>
                ))}

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-slate-200 bg-slate-50/50 text-slate-400 hover:bg-slate-100 hover:text-[#3E8940] hover:border-[#3E8940]/30 transition-all font-medium"
                  onClick={handleAddRule}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Cashback Rule
                </Button>

                <Button
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
                  onClick={handleSaveAll}
                  disabled={saving || loading}
                >
                  {saving ? "Saving Changes..." : "Apply All Cashback Rules"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Recharge Bonus Section */}
        <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-900/20">
                  <Gift className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Money Bonuses</h2>
                  <p className="text-sm text-slate-500">Reward users for adding money</p>
                </div>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#3E8940]" />
            </div>

            <div className="mt-8 space-y-3">
              {rules
                .filter((r) => r.type === "recharge_bonus")
                .map((rule) => (
                  <div
                    key={rule.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4 transition-all hover:bg-emerald-50/40"
                  >
                    <div className="flex flex-1 items-center gap-4 lg:gap-12">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Add</span>
                        <div className="flex items-center gap-1 group/input relative">
                           <span className="text-lg font-bold text-slate-800">Rs.</span>
                           <div className="relative">
                             <Input
                              type="number"
                              value={rule.minAmount}
                              onChange={(e) => handleUpdateRule(rule.id, { minAmount: Number(e.target.value) })}
                              className="h-10 w-24 rounded-lg border-emerald-100/50 bg-white text-lg font-bold text-slate-800 focus:border-[#3E8940] focus:ring-1 focus:ring-[#3E8940] transition-all px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                             <Edit className="absolute -right-2 -top-2 h-3 w-3 text-slate-300 opacity-0 group-hover/input:opacity-100 transition-opacity" />
                           </div>
                          <span className="text-lg font-bold text-slate-800">+</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-center pt-2">
                         <div className="h-px w-8 bg-emerald-200" />
                         <ChevronRight className="h-4 w-4 text-emerald-300 -ml-1" />
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Get</span>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                             <div className="relative group/edit">
                               <Input
                                type="number"
                                value={rule.rewardValue}
                                onChange={(e) => handleUpdateRule(rule.id, { rewardValue: Number(e.target.value) })}
                                className="h-10 w-16 rounded-lg border-emerald-100/50 bg-white text-lg font-bold text-emerald-600 focus:border-[#3E8940] focus:ring-1 focus:ring-[#3E8940] transition-all px-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-slate-100 flex items-center justify-center shadow-sm">
                                <Edit className="h-2 w-2 text-slate-500" />
                              </div>
                             </div>
                            <span className="text-lg font-bold text-emerald-600">%</span>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-700 border-none font-medium px-2 py-0 h-5 text-[9px] uppercase tracking-wider">
                            bonus tier
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all rounded-full border border-slate-100"
                        onClick={() => handleRemoveRule(rule.id)}
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="h-8 w-px bg-slate-100 mx-1" />
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Active</span>
                        <Switch
                          checked={rule.isActive}
                          onCheckedChange={(checked) => handleUpdateRule(rule.id, { isActive: checked })}
                          className="data-[state=checked]:bg-[#3E8940] scale-90"
                        />
                      </div>
                    </div>
                  </div>
                ))}

              <div className="flex flex-col gap-3">
                <Button
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-dashed border-slate-200 bg-slate-50/50 text-slate-400 hover:bg-slate-100 hover:text-[#3E8940] hover:border-[#3E8940]/30 transition-all font-medium"
                  onClick={() => {
                    const newRule: RewardRule = {
                      id: `temp-${Date.now()}`,
                      name: "New Recharge Bonus",
                      type: "recharge_bonus",
                      minAmount: 0,
                      rewardValue: 0,
                      rewardType: "percentage",
                      isActive: true,
                    };
                    setRules([...rules, newRule]);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Default Bonus Tier
                </Button>

                <Button
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 transition-all active:scale-[0.98]"
                  onClick={handleSaveAll}
                  disabled={saving || loading}
                >
                  {saving ? "Saving Changes..." : "Apply All Recharge Rules"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* B. Expiry Rules Section */}
        <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-900/20">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Add Expiry Rules</h2>
                  <p className="text-sm text-slate-500">Define when promotional balances expire</p>
                </div>
              </div>
              <Switch defaultChecked className="data-[state=checked]:bg-[#3E8940]" />
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Wallet Bonus Expiry</span>
                <div className="mt-2 flex items-center gap-3">
                  <Input 
                    type="number" 
                    placeholder="30" 
                    className="h-12 w-24 rounded-xl border-indigo-100 bg-white text-lg font-bold"
                  />
                  <span className="font-bold text-slate-700">Days</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 italic">Example: Bonus expires in 30 days after credit.</p>
              </div>

              <div className="rounded-2xl border border-indigo-50 bg-indigo-50/20 p-5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Referral Credit Expiry</span>
                <div className="mt-2 flex items-center gap-3">
                  <Input 
                    type="number" 
                    placeholder="60" 
                    className="h-12 w-24 rounded-xl border-indigo-100 bg-white text-lg font-bold"
                  />
                  <span className="font-bold text-slate-700">Days</span>
                </div>
                <p className="mt-2 text-xs text-slate-500 italic">Example: Referral credits expire in 60 days.</p>
              </div>
            </div>
            
            <Button className="mt-6 w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-900/10">
              Apply Expiry Rules
            </Button>
          </div>
        </div>

        {/* C. Wallet Liability Dashboard */}
        <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-900/20">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Wallet Liability Dashboard</h2>
                <p className="text-sm text-slate-500">Real-time overview of platform's financial liability</p>
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Outstanding Balance</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">₹</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tight">12,45,850</span>
                </div>
                <Badge className="mt-3 bg-rose-100 text-rose-700 border-none font-bold">Liability</Badge>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Bonus Pool Used</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-sm font-bold text-slate-400">₹</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tight">2,15,400</span>
                </div>
                <Badge className="mt-3 bg-amber-100 text-amber-700 border-none font-bold">Unclaimed</Badge>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Active Wallet Users</span>
                <div className="mt-3">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">8,452</span>
                </div>
                <Badge className="mt-3 bg-emerald-100 text-emerald-700 border-none font-bold">Healthy</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
