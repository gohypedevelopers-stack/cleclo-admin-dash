"use client";

import { useState } from "react";
import {
  Gift,
  Save,
  Upload,
  ImageIcon,
  Users,
  Coins,
  ShoppingBag,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function ReferralPage() {
  const [settings, setSettings] = useState({
    referrerReward: 50,
    refereeReward: 100,
    minOrderValue: 200,
    maxReferrals: 10,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Referral Program
          </h1>
          <p className="text-slate-500 mt-2">
            Configure rewards and customize the referral banner
          </p>
        </div>

        {/* Banner Preview */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#3E8940] via-[#4A9F4D] to-[#5FAD61] rounded-3xl p-8 text-white shadow-xl shadow-green-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Gift className="h-12 w-12" />
            </div>
            <div className="text-center md:text-left flex-1">
              <Badge className="bg-white/20 text-white border-none mb-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Referral Program
              </Badge>
              <h2 className="text-3xl font-bold mb-2">
                Refer a Friend, Get Rewarded!
              </h2>
              <p className="text-white/80 text-lg">
                You get{" "}
                <span className="font-bold text-yellow-300">
                  ₹{settings.referrerReward}
                </span>{" "}
                and your friend gets{" "}
                <span className="font-bold text-yellow-300">
                  ₹{settings.refereeReward}
                </span>{" "}
                on their first order!
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Coins className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₹{settings.referrerReward}
            </p>
            <p className="text-sm text-slate-500 mt-1">Per Referral</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              ₹{settings.refereeReward}
            </p>
            <p className="text-sm text-slate-500 mt-1">New User Bonus</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">
              ₹{settings.minOrderValue}
            </p>
            <p className="text-sm text-slate-500 mt-1">Min Order Value</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {settings.maxReferrals}
            </p>
            <p className="text-sm text-slate-500 mt-1">Max Referrals</p>
          </div>
        </div>

        {/* Reward Settings */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Reward Settings</h2>
              <p className="text-sm text-slate-500">
                Configure referral rewards
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                Referrer Reward (₹)
              </Label>
              <Input
                type="number"
                value={settings.referrerReward}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    referrerReward: parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
              <p className="text-xs text-slate-500">
                Amount credited to the person who refers
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                Referee Reward (₹)
              </Label>
              <Input
                type="number"
                value={settings.refereeReward}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    refereeReward: parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
              <p className="text-xs text-slate-500">
                Amount credited to the new user
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                Minimum Order Value (₹)
              </Label>
              <Input
                type="number"
                value={settings.minOrderValue}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    minOrderValue: parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
              <p className="text-xs text-slate-500">
                First order must be above this amount
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                Max Referrals Per User
              </Label>
              <Input
                type="number"
                value={settings.maxReferrals}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    maxReferrals: parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
              <p className="text-xs text-slate-500">Limit referrals per user</p>
            </div>
          </div>
        </div>

        {/* Banner Image */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">
                Banner Background
              </h2>
              <p className="text-sm text-slate-500">
                Upload a custom background image
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-lg">
                  Drop your image here or click to upload
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  PNG, JPG up to 2MB • Recommended: 1200x400px
                </p>
              </div>
              <Button variant="outline" className="gap-2 mt-2">
                <Upload className="h-4 w-4" />
                Choose File
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 px-12 h-14 text-lg shadow-lg shadow-green-200/50"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

