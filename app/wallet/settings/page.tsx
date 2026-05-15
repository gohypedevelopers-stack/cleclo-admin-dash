"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Wallet, 
  Save, 
  Gift, 
  Plus, 
  TrendingUp, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Trash2, 
  Coins, 
  Percent, 
  Copy, 
  Pencil 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { adminWalletApi } from "@/lib/admin-api";

type WalletReward = {
  id: string;
  ruleType?: string;
  rewardMode: string;
  rewardValue: number;
  minRechargeValue?: number;
  minOrderValue?: number;
  expiryDays?: number;
  isActive: boolean;
  updatedByAdminName?: string;
  createdByAdminName?: string;
  updatedAt: string;
};

type LiabilitySummary = {
  totalLiability: number;
  promotionalLiability: number;
  cashLiability: number;
};

const formatMoney = (value: number) => `Rs. ${Math.round(value || 0).toLocaleString("en-IN")}`;

export default function WalletSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [liability, setLiability] = useState<LiabilitySummary>({
    totalLiability: 0,
    promotionalLiability: 0,
    cashLiability: 0,
  });
  const [settings, setSettings] = useState({
    minAddAmount: 100,
    maxAddAmount: 10000,
    bonusEnabled: true,
    bonuses: [] as WalletReward[],
  });

  const loadBackend = async () => {
    try {
      setLoading(true);
      const [config, rewards, liabilitySummary] = await Promise.all([
        adminWalletApi.getConfig(),
        adminWalletApi.getRewards(),
        adminWalletApi.getLiabilitySummary()
      ]);
      
      setSettings({
        minAddAmount: config?.minAddAmount || 100,
        maxAddAmount: config?.maxAddAmount || 10000,
        bonusEnabled: config?.bonusEnabled ?? true,
        bonuses: rewards || [],
      });
      setLiability({
        totalLiability: liabilitySummary?.totalLiability || 0,
        promotionalLiability: liabilitySummary?.promotionalLiability || 0,
        cashLiability: liabilitySummary?.cashLiability || 0,
      });
    } catch (e) {
      console.error("Failed to load wallet config", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBackend();
  }, []);

  const handleSave = async () => {
    try {
      await adminWalletApi.updateConfig({
        minAddAmount: settings.minAddAmount,
        maxAddAmount: settings.maxAddAmount,
        bonusEnabled: settings.bonusEnabled
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save config", e);
    }
  };

  const toggleBonus = async (id: string, currentStatus: boolean) => {
    try {
      setSettings((s) => ({
        ...s,
        bonuses: s.bonuses.map((b) => b.id === id ? { ...b, isActive: !currentStatus } : b)
      }));
      await adminWalletApi.updateReward(id, { isActive: !currentStatus });
    } catch (error) {
      console.error(error);
      loadBackend(); 
    }
  };

  const handleCreateRule = async (ruleType: string, duplicateFrom?: WalletReward) => {
      try {
          const payload = duplicateFrom ? {
            ruleType: duplicateFrom.ruleType,
            rewardMode: duplicateFrom.rewardMode,
            rewardValue: duplicateFrom.rewardValue,
            minRechargeValue: duplicateFrom.minRechargeValue,
            minOrderValue: duplicateFrom.minOrderValue,
            expiryDays: duplicateFrom.expiryDays,
            isActive: true
          } : {
              ruleType,
              rewardMode: "percentage",
              rewardValue: ruleType === "order_cashback" ? 5 : 2,
              minRechargeValue: ruleType === "recharge_bonus" ? 500 : undefined,
              minOrderValue: ruleType === "order_cashback" ? 2000 : undefined,
              expiryDays: 30,
              isActive: true
          };
          const newRule = await adminWalletApi.createReward(payload);
          setSettings(s => ({ ...s, bonuses: [newRule, ...s.bonuses] }));
      } catch (e) {
          console.error(e);
      }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await adminWalletApi.deleteReward(id);
      setSettings(s => ({ ...s, bonuses: s.bonuses.filter(b => b.id !== id) }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRule = async (id: string, updates: Partial<WalletReward>) => {
      try {
          setSettings((s) => ({
              ...s,
              bonuses: s.bonuses.map((b) => b.id === id ? { ...b, ...updates } : b)
          }));
          await adminWalletApi.updateReward(id, updates);
      } catch (error) {
          console.error(error);
          loadBackend();
      }
  };

  const activeBonuses = settings.bonuses.filter((b) => b.isActive);
  const totalRewardValue = settings.bonuses.reduce(
    (sum, b) => sum + (b.rewardValue || 0),
    0
  );

  return (
    <div className="flex flex-col items-center w-full px-4 py-8 bg-slate-50/30 min-h-screen">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-slate-500 hover:text-slate-800 gap-2">
              <Link href="/app">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-4xl text-slate-900 font-extrabold tracking-tight">
              Wallet Settings
            </h1>
            <p className="text-slate-500 mt-1">Manage bonuses, cashback rules, and liability</p>
          </div>
          <Button
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 shadow-xl shadow-green-100 transition-all active:scale-95"
            onClick={handleSave}
            disabled={loading}
          >
            <Save className="h-4 w-4" />
            {saved ? "Config Saved!" : "Save Configuration"}
          </Button>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-12 w-12 border-4 border-[#3E8940]/20 border-t-[#3E8940] rounded-full animate-spin" />
                <p className="text-slate-400 font-medium">Syncing with Financial Engine...</p>
            </div>
        ) : (
            <>
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={<Wallet className="text-blue-600" />} label="Min Add Amount" value={formatMoney(settings.minAddAmount)} bg="bg-blue-50" />
                  <StatCard icon={<TrendingUp className="text-green-600" />} label="Max Add Amount" value={formatMoney(settings.maxAddAmount)} bg="bg-green-50" />
                  <StatCard icon={<Gift className="text-amber-600" />} label="Active Bonuses" value={String(activeBonuses.length)} bg="bg-amber-50" />
                  <StatCard icon={<Sparkles className="text-purple-600" />} label="Avg. Reward" value={`${totalRewardValue}%`} bg="bg-purple-50" />
                </div>

                {/* Liability Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 space-y-6">
                  <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-slate-950 text-white shadow-lg">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Financial Liability</h2>
                        <p className="text-sm text-slate-500 font-medium">Real-time outstanding wallet balances</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <LiabilityMetric label="Total Balance Outstanding" value={formatMoney(liability.totalLiability)} color="text-slate-950" />
                      <LiabilityMetric label="Cash (Recharge) Balance" value={formatMoney(liability.cashLiability)} color="text-slate-600" />
                      <LiabilityMetric label="Promotional Bonus Balance" value={formatMoney(liability.promotionalLiability)} color="text-emerald-600" />
                  </div>
                </div>

                {/* Limits Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 space-y-8">
                  <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
                        <Coins className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Transaction Limits</h2>
                        <p className="text-sm text-slate-500 font-medium">Control customer wallet recharge range</p>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-bold ml-1">Minimum Recharge (Rs.)</Label>
                      <div className="relative group">
                          <Input
                            type="number"
                            value={settings.minAddAmount === 0 ? "" : settings.minAddAmount}
                            placeholder="0"
                            onChange={(e) => setSettings(s => ({ ...s, minAddAmount: parseInt(e.target.value) || 0 }))}
                            className="h-14 pl-6 pr-4 rounded-2xl border-slate-200 text-xl font-black focus:ring-[#3E8940] focus:border-[#3E8940] transition-all bg-slate-50/50 group-hover:bg-white"
                          />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-700 font-bold ml-1">Maximum Recharge (Rs.)</Label>
                      <div className="relative group">
                          <Input
                            type="number"
                            value={settings.maxAddAmount === 0 ? "" : settings.maxAddAmount}
                            placeholder="0"
                            onChange={(e) => setSettings(s => ({ ...s, maxAddAmount: parseInt(e.target.value) || 0 }))}
                            className="h-14 pl-6 pr-4 rounded-2xl border-slate-200 text-xl font-black focus:ring-[#3E8940] focus:border-[#3E8940] transition-all bg-slate-50/50 group-hover:bg-white"
                          />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Rules Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 space-y-8">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-100">
                            <Gift className="h-6 w-6" />
                          </div>
                          <div>
                            <h2 className="text-xl font-black text-slate-900">Recharge Bonuses</h2>
                            <p className="text-sm text-slate-500 font-medium">Incentivize customers to add more money</p>
                          </div>
                      </div>
                      <Switch 
                        checked={settings.bonusEnabled} 
                        onCheckedChange={(val) => setSettings(s => ({ ...s, bonusEnabled: val }))} 
                        className="data-[state=checked]:bg-[#3E8940]"
                      />
                  </div>

                  {settings.bonusEnabled && (
                    <div className="space-y-4">
                      {settings.bonuses
                        .filter(b => b.ruleType === "recharge_bonus")
                        .map(rule => (
                          <RewardRuleCard 
                            key={rule.id}
                            rule={rule}
                            icon={<Coins className="h-5 w-5" />}
                            label="Recharge"
                            valueLabel="Bonus"
                            valueSuffix="%"
                            fieldKey="minRechargeValue"
                            onUpdate={handleUpdateRule}
                            onDelete={handleDeleteRule}
                            onDuplicate={() => handleCreateRule("recharge_bonus", rule)}
                          />
                        ))
                      }
                      <Button
                        variant="outline"
                        onClick={() => handleCreateRule("recharge_bonus")}
                        className="w-full h-16 rounded-2xl border-dashed border-2 border-slate-200 text-slate-500 font-bold hover:border-[#3E8940] hover:text-[#3E8940] hover:bg-emerald-50/30 transition-all gap-2"
                      >
                        <Plus className="h-5 w-5" />
                        Create New Bonus Tier
                      </Button>
                    </div>
                  )}
                </div>

                {/* Cashback Rules Section */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 space-y-8">
                  <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-100">
                        <Percent className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Auto Cashback Rules</h2>
                        <p className="text-sm text-slate-500 font-medium">Automatic rewards triggered by order value</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                    {settings.bonuses
                      .filter(b => b.ruleType === "order_cashback")
                      .map(rule => (
                        <RewardRuleCard 
                          key={rule.id}
                          rule={rule}
                          icon={<Sparkles className="h-5 w-5" />}
                          label="Orders Above"
                          valueLabel="Cashback"
                          valueSuffix="%"
                          fieldKey="minOrderValue"
                          onUpdate={handleUpdateRule}
                          onDelete={handleDeleteRule}
                          onDuplicate={() => handleCreateRule("order_cashback", rule)}
                        />
                      ))
                    }
                    <Button
                      variant="outline"
                      onClick={() => handleCreateRule("order_cashback")}
                      className="w-full h-16 rounded-2xl border-dashed border-2 border-slate-200 text-slate-500 font-bold hover:border-[#3E8940] hover:text-[#3E8940] hover:bg-emerald-50/30 transition-all gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Create New Cashback Rule
                    </Button>
                  </div>
                </div>

                {/* Expiry & Logistics */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-8 space-y-8">
                  <div className="flex items-center gap-4">
                      <div className="p-3.5 rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-100">
                        <AlertCircle className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-slate-900">Expiry Management</h2>
                        <p className="text-sm text-slate-500 font-medium">Control validity of promotional credits</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.bonuses.map(rule => (
                      <div key={rule.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            {rule.ruleType === 'order_cashback' ? 'Cashback' : 'Bonus'}
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            {rule.rewardValue}% Rule
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Input 
                             type="number"
                             value={rule.expiryDays === 0 ? "" : rule.expiryDays}
                             onChange={(e) => handleUpdateRule(rule.id, { expiryDays: parseInt(e.target.value) || 0 })}
                             className="w-20 h-10 rounded-xl font-bold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                           />
                           <span className="text-xs font-bold text-slate-500">Days</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }: { icon: React.ReactNode, label: string, value: string, bg: string }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/60 p-6 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1">
      <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center mb-4 shadow-sm`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}

function LiabilityMetric({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`mt-2 text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function RewardRuleCard({ 
  rule, 
  icon, 
  label, 
  valueLabel, 
  valueSuffix, 
  fieldKey, 
  onUpdate, 
  onDelete, 
  onDuplicate 
}: { 
  rule: WalletReward, 
  icon: React.ReactNode, 
  label: string, 
  valueLabel: string, 
  valueSuffix: string, 
  fieldKey: string,
  onUpdate: (id: string, updates: Partial<WalletReward>) => void,
  onDelete: (id: string) => void,
  onDuplicate: () => void
}) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 hover:bg-emerald-50/10 hover:border-[#3E8940]/30 transition-all shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-[#3E8940] flex items-center justify-center shadow-inner">
            {icon}
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
              <div className="flex items-center gap-1">
                <span className="text-lg font-black text-slate-400">Rs.</span>
                <Input
                  type="number"
                  value={(rule as any)[fieldKey] === 0 ? "" : ((rule as any)[fieldKey] || 0)}
                  placeholder="0"
                  onChange={(e) => onUpdate(rule.id, { [fieldKey]: parseInt(e.target.value) || 0 })}
                  className="h-10 w-28 rounded-xl border-slate-200 bg-white text-xl font-black text-slate-900 focus:ring-[#3E8940] focus:border-[#3E8940] transition-all px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
            
            <div className="hidden md:block h-8 w-px bg-slate-100" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{valueLabel}</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={rule.rewardValue === 0 ? "" : (rule.rewardValue || 0)}
                  placeholder="0"
                  onChange={(e) => onUpdate(rule.id, { rewardValue: parseInt(e.target.value) || 0 })}
                  className="h-10 w-20 rounded-xl border-slate-200 bg-white text-xl font-black text-emerald-600 focus:ring-[#3E8940] focus:border-[#3E8940] transition-all px-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-xl font-black text-emerald-600">{valueSuffix}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 self-start md:self-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-[#3E8940] hover:bg-emerald-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
            onClick={() => {}}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all rounded-full"
            onClick={onDuplicate}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-full"
            onClick={() => onDelete(rule.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 pt-4">
          <p className="text-[10px] text-slate-400 font-bold tracking-wide italic">
            Updated by: <span className="text-slate-600 uppercase not-italic">{rule.updatedByAdminName || rule.createdByAdminName || "Arjun"}</span> | {new Date(rule.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, ' ')}
          </p>
          <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${rule.isActive ? 'text-[#3E8940]' : 'text-slate-400'}`}>
              {rule.isActive ? 'System Active' : 'Suspended'}
            </span>
            <Switch 
              checked={rule.isActive} 
              onCheckedChange={(val) => onUpdate(rule.id, { isActive: val })}
              className="scale-75 data-[state=checked]:bg-[#3E8940]"
            />
          </div>
      </div>
    </div>
  );
}
