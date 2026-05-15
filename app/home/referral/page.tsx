"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
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
  ArrowLeft,
  History,
  Hash,
  MapPin,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { adminReferralApi, adminLocationApi } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

type ReferralCampaignVersion = {
  id: string;
  title?: string;
  bannerImageUrl?: string | null;
  referrerRewardAmount: number;
  refereeRewardAmount: number;
  minimumCartValue: number;
  maxReferralsPerUser?: number | null;
  firstOrderRequired: boolean;
  targetCityCodes: string[];
  isActive: boolean;
  createdAt: string;
  usedByUsersCount?: number;
  redemptionsCount?: number;
  successfulRedemptionsCount?: number;
};

export default function ReferralPage() {
  const [settings, setSettings] = useState({
    referrerReward: 50,
    refereeReward: 100,
    minOrderValue: 200,
    maxReferrals: 10,
    firstOrderRequired: true,
    targetCityCodes: [] as string[],
  });
  const [availableCities, setAvailableCities] = useState<{ code: string; name: string }[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [campaignHistory, setCampaignHistory] = useState<ReferralCampaignVersion[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyCampaignToForm = (campaign: ReferralCampaignVersion) => {
    setSettings({
      referrerReward: Number(campaign.referrerRewardAmount) || 0,
      refereeReward: Number(campaign.refereeRewardAmount) || 0,
      minOrderValue: Number(campaign.minimumCartValue) || 0,
      maxReferrals: Number(campaign.maxReferralsPerUser) || 0,
      firstOrderRequired: campaign.firstOrderRequired ?? true,
      targetCityCodes: campaign.targetCityCodes || [],
    });
    setBannerImage(campaign.bannerImageUrl || null);
    setActiveCampaignId(campaign.id);
  };

  const loadCampaignHistory = async () => {
    try {
      setLoading(true);
      const data = (await adminReferralApi.getCampaigns()) as ReferralCampaignVersion[];
      const normalized = Array.isArray(data) ? data : [];
      setCampaignHistory(normalized);

      const active = normalized.find((campaign) => campaign.isActive) || normalized[0] || null;
      if (active) {
        applyCampaignToForm(active);
      } else {
        setActiveCampaignId(null);
        setBannerImage(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load referral settings");
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async () => {
    try {
      const cities = await adminLocationApi.getCities();
      setAvailableCities(cities || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadCampaignHistory();
    loadCities();
  }, []);

  const handleBannerImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose a valid image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large", {
        description: "Maximum image size is 2MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        title: "Referral Program",
        referrerRewardAmount: settings.referrerReward,
        refereeRewardAmount: settings.refereeReward,
        minimumCartValue: settings.minOrderValue,
        maxReferralsPerUser: settings.maxReferrals || null,
        bannerImageUrl: bannerImage,
        targetCityCodes: settings.targetCityCodes,
        firstOrderRequired: settings.firstOrderRequired,
        isActive: true,
      };

      let savedCampaign: ReferralCampaignVersion;
      if (activeCampaignId) {
        savedCampaign = await adminReferralApi.updateCampaign(activeCampaignId, payload);
        toast.success("Referral settings updated", {
          description: "A new referral ID has been generated for this version.",
        });
      } else {
        savedCampaign = await adminReferralApi.createCampaign(payload);
        toast.success("Referral settings created");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await loadCampaignHistory();
      if (savedCampaign?.id) {
        setActiveCampaignId(savedCampaign.id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save referral settings";
      toast.error(message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString();
  };

  const activeCampaign =
    campaignHistory.find((campaign) => campaign.id === activeCampaignId) ||
    campaignHistory.find((campaign) => campaign.isActive) ||
    null;

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full max-w-4xl space-y-8">
        <div>
          <Button asChild variant="outline" size="sm" className="w-fit gap-2">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Referral Program
          </h1>
          <p className="text-slate-500 mt-2">
            Configure rewards and maintain versioned referral IDs
          </p>
          {activeCampaignId ? (
            <div className="mt-3 flex justify-center">
              <Badge className="bg-slate-100 text-slate-700 border-none gap-1 font-mono">
                <Hash className="h-3 w-3" />
                Active ID: {activeCampaignId}
              </Badge>
            </div>
          ) : null}
        </div>

        <div className="relative overflow-hidden bg-linear-to-br from-[#3E8940] via-[#4A9F4D] to-[#5FAD61] rounded-3xl p-8 text-white shadow-xl shadow-green-200/50">
          {bannerImage ? (
            <>
              <img
                src={bannerImage}
                alt="Referral banner preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35" />
            </>
          ) : null}
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
              <p className="text-white/90 text-lg">
                You get <span className="font-bold text-yellow-300">₹{settings.referrerReward}</span> and your friend gets <span className="font-bold text-yellow-300">₹{settings.refereeReward}</span> on their first order.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Coins className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">₹{settings.referrerReward}</p>
            <p className="text-sm text-slate-500 mt-1">Per Referral</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Gift className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-600">₹{settings.refereeReward}</p>
            <p className="text-sm text-slate-500 mt-1">New User Bonus</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-600">₹{settings.minOrderValue}</p>
            <p className="text-sm text-slate-500 mt-1">Min Order Value</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{settings.maxReferrals}</p>
            <p className="text-sm text-slate-500 mt-1">Max Referrals</p>
          </div>
          <div className="bg-white rounded-2xl border p-5 text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <History className="h-6 w-6 text-slate-700" />
            </div>
            <p className="text-2xl font-bold text-slate-700">{activeCampaign?.usedByUsersCount || 0}</p>
            <p className="text-sm text-slate-500 mt-1">Used on Active ID</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Reward Settings</h2>
              <p className="text-sm text-slate-500">
                Updating these values creates a new referral ID version
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
                    referrerReward: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                New User Bonus (₹)
              </Label>
              <Input
                type="number"
                value={settings.refereeReward}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    refereeReward: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
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
                    minOrderValue: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
            </div>

            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <Label className="text-sm font-semibold text-slate-700">
                Max Referral Limit Per User
              </Label>
              <Input
                type="number"
                value={settings.maxReferrals}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    maxReferrals: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="bg-white text-lg font-semibold"
              />
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold text-slate-700">First Order Condition</Label>
                <p className="text-xs text-slate-500">Reward is only granted on the friend's first successful order</p>
              </div>
              <Switch 
                checked={settings.firstOrderRequired}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, firstOrderRequired: checked }))}
              />
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold text-slate-700">Target Cities</Label>
                </div>
                {availableCities.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-primary hover:text-primary/80"
                    onClick={() => {
                      if (settings.targetCityCodes.length === availableCities.length) {
                        setSettings(s => ({ ...s, targetCityCodes: [] }));
                      } else {
                        // Use cityCode if code is missing (backend field is cityCode)
                        setSettings(s => ({ 
                          ...s, 
                          targetCityCodes: availableCities.map(c => (c as any).cityCode || (c as any).code) 
                        }));
                      }
                    }}
                  >
                    {settings.targetCityCodes.length === availableCities.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">Select cities where this referral campaign is active. Leave empty for all cities.</p>
              
              {availableCities.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center">
                  <p className="text-sm text-slate-400">No cities configured in the system.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {availableCities.map((city, idx) => {
                    const code = (city as any).cityCode || (city as any).code;
                    const name = (city as any).cityName || (city as any).name;
                    const isSelected = settings.targetCityCodes.includes(code);
                    
                    return (
                      <div 
                        key={code || idx} 
                        className={cn(
                          "flex items-center space-x-2 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                          isSelected 
                            ? "bg-primary/5 border-primary shadow-sm" 
                            : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setSettings(s => ({ ...s, targetCityCodes: s.targetCityCodes.filter(c => c !== code) }));
                          } else {
                            setSettings(s => ({ ...s, targetCityCodes: [...s.targetCityCodes, code] }));
                          }
                        }}
                      >
                        <Checkbox 
                          id={`city-${code}`}
                          checked={isSelected}
                          onCheckedChange={() => {}} // Handled by div onClick
                          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label 
                          htmlFor={`city-${code}`}
                          className="text-[13px] font-medium leading-none cursor-pointer flex-1"
                        >
                          {name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Banner Background</h2>
              <p className="text-sm text-slate-500">Upload image for this referral ID version</p>
            </div>
          </div>

          <div
            className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={handleBannerImageChange}
            />
            <div className="flex flex-col items-center gap-4">
              {bannerImage ? (
                <img
                  src={bannerImage}
                  alt="Referral banner preview"
                  className="h-40 w-full max-w-xl rounded-xl object-cover border"
                />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border flex items-center justify-center">
                  <Upload className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-700 text-lg">
                  Drop your image here or click to upload
                </p>
                <p className="text-sm text-slate-500 mt-1">PNG/JPG up to 2MB</p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-2 mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
                {bannerImage ? "Change File" : "Choose File"}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black">Referral ID History</h2>
              <p className="text-sm text-slate-500">
                Every update creates a new ID. Usage is tracked per ID.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-slate-500 text-sm">Loading history...</div>
          ) : campaignHistory.length === 0 ? (
            <div className="text-slate-500 text-sm">No referral history yet.</div>
          ) : (
            <div className="space-y-3">
              {campaignHistory.map((campaign, idx) => (
                <div
                  key={campaign.id || idx}
                  className={`rounded-xl border p-4 ${campaign.isActive ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Referral ID</p>
                      <p className="font-mono text-xs sm:text-sm break-all text-slate-900">{campaign.id}</p>
                    </div>
                    <Badge className={`${campaign.isActive ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700"} border-none`}>
                      {campaign.isActive ? "Active" : "Archived"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-slate-700">
                    <p>Referral: ₹{campaign.referrerRewardAmount}</p>
                    <p>New User: ₹{campaign.refereeRewardAmount}</p>
                    <p>Min Order: ₹{campaign.minimumCartValue}</p>
                    <p>Max/User: {campaign.maxReferralsPerUser ?? "No limit"}</p>
                    <p>First Order: {campaign.firstOrderRequired ? "Yes" : "No"}</p>
                    <p className="col-span-2">Cities: {campaign.targetCityCodes?.length > 0 ? campaign.targetCityCodes.join(", ") : "All Cities"}</p>
                    <p>Used Users: {campaign.usedByUsersCount ?? 0}</p>
                    <p>Redemptions: {campaign.redemptionsCount ?? 0}</p>
                    <p>Successful: {campaign.successfulRedemptionsCount ?? 0}</p>
                    <p>Created: {formatDateTime(campaign.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center pb-8">
          <Button
            size="lg"
            className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/90 px-12 h-14 text-lg shadow-lg shadow-green-200/50"
            onClick={handleSave}
            disabled={saving}
          >
            {saved ? (
              <>
                <CheckCircle className="h-5 w-5" />
                Saved Successfully!
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {saving ? "Saving..." : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
