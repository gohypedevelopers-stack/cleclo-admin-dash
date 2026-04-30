"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Edit,
  GripVertical,
  Link as LinkIcon,
  MapPin,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { adminContentApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Banner = {
  id: string;
  title: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  startAt?: string | null;
  endAt?: string | null;
  priorityRank: number;
  targetCityCodes: string[];
  targetVendorIds: string[];
  targetUserSegments: string[];
};

type BannerForm = {
  title: string;
  linkedTo: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
  priorityRank: string;
  targetCityCodes: string[];
  targetVendorIds: string[];
  targetUserSegments: string[];
};

type StateOption = {
  code: string;
  name: string;
  configuredCityCount?: number;
};

type CityOption = {
  cityCode: string;
  cityName: string;
  stateCode?: string;
  stateName?: string;
  source?: string;
};

type VendorOption = {
  id: string;
  label: string;
  status?: string;
};

const USER_SEGMENTS = [
  { value: "new_users", label: "New users" },
  { value: "repeat_users", label: "Repeat users" },
];

const emptyBannerForm: BannerForm = {
  title: "",
  linkedTo: "",
  startDate: "",
  endDate: "",
  imageUrl: "",
  priorityRank: "0",
  targetCityCodes: [],
  targetVendorIds: [],
  targetUserSegments: [],
};

const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (value.includes("T")) return value.slice(0, 10);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return "No date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
};

const normalizeBanner = (raw: unknown): Banner => {
  const item = raw as Partial<Banner>;
  return {
    id: String(item.id || ""),
    title: String(item.title || ""),
    ctaLabel: item.ctaLabel || null,
    ctaUrl: item.ctaUrl || null,
    imageUrl: item.imageUrl || null,
    isActive: Boolean(item.isActive),
    startAt: item.startAt || null,
    endAt: item.endAt || null,
    priorityRank: Number(item.priorityRank || 0),
    targetCityCodes: Array.isArray(item.targetCityCodes) ? item.targetCityCodes : [],
    targetVendorIds: Array.isArray(item.targetVendorIds) ? item.targetVendorIds : [],
    targetUserSegments: Array.isArray(item.targetUserSegments) ? item.targetUserSegments : [],
  };
};

const normalizeCityOptions = (raw: unknown): CityOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as Partial<CityOption> & { code?: string; name?: string })
    .map((item) => ({
      cityCode: String(item.cityCode || item.code || ""),
      cityName: String(item.cityName || item.name || ""),
      stateCode: item.stateCode,
      stateName: item.stateName,
      source: item.source,
    }))
    .filter((item) => item.cityCode && item.cityName);
};

const normalizeStates = (raw: unknown): StateOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => item as Partial<StateOption>)
    .map((item) => ({
      code: String(item.code || ""),
      name: String(item.name || ""),
      configuredCityCount: Number(item.configuredCityCount || 0),
    }))
    .filter((item) => item.code && item.name);
};

const normalizeVendors = (raw: unknown): VendorOption[] => {
  const list = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { vendors?: unknown[] }).vendors)
      ? (raw as { vendors: unknown[] }).vendors
      : [];

  return list
    .map((item) => item as Record<string, unknown>)
    .map((item) => {
      const profile = (item.vendorProfile || {}) as Record<string, unknown>;
      const businessName = String(profile.businessName || "");
      const name = String(item.name || "");
      const phone = String(item.phone || "");
      return {
        id: String(item.id || ""),
        label: businessName || name || phone || "Unnamed vendor",
        status: String(item.status || ""),
      };
    })
    .filter((item) => item.id);
};

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function BannersPage() {
  const [bannerList, setBannerList] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyBannerForm);
  const [states, setStates] = useState<StateOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLabelByCode, setCityLabelByCode] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const vendorLabelById = useMemo(
    () => Object.fromEntries(vendors.map((vendor) => [vendor.id, vendor.label])),
    [vendors]
  );

  const selectedCityLabels = form.targetCityCodes.map((code) => cityLabelByCode[code] || code);
  const selectedVendorLabels = form.targetVendorIds.map((id) => vendorLabelById[id] || id);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await adminContentApi.getBanners();
      setBannerList(Array.isArray(data) ? data.map(normalizeBanner) : []);
    } catch (error) {
      console.error("Failed to load banners", error);
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const loadTargetingOptions = async () => {
    try {
      const [stateData, vendorData] = await Promise.all([
        adminLocationApi.getStates(),
        adminVendorApi.getVendors(),
      ]);
      const normalizedStates = normalizeStates(stateData);
      setStates(normalizedStates);
      setVendors(normalizeVendors(vendorData));
      setSelectedStateCode((current) => current || normalizedStates[0]?.code || "");
    } catch (error) {
      console.error("Failed to load targeting options", error);
      toast.error("Failed to load targeting options");
    }
  };

  const loadCitiesForState = async (stateCode: string) => {
    if (!stateCode) {
      setCityOptions([]);
      return;
    }

    try {
      const data = await adminLocationApi.getCitiesByState(stateCode);
      const normalized = normalizeCityOptions(data);
      setCityOptions(normalized);
      setCityLabelByCode((prev) => ({
        ...prev,
        ...Object.fromEntries(normalized.map((city) => [city.cityCode, city.cityName])),
      }));
    } catch (error) {
      console.error("Failed to load cities", error);
      toast.error("Failed to load cities for selected state");
    }
  };

  useEffect(() => {
    loadBanners();
    loadTargetingOptions();
  }, []);

  useEffect(() => {
    loadCitiesForState(selectedStateCode);
  }, [selectedStateCode]);

  const toggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      setBannerList((prev) =>
        prev.map((banner) => (banner.id === id ? { ...banner, isActive: !currentStatus } : banner))
      );
      await adminContentApi.updateBanner(id, { isActive: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle banner", error);
      toast.error("Failed to update banner status");
      loadBanners();
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      ...emptyBannerForm,
      priorityRank: String(bannerList.length + 1),
    });
    setPreviewImage(null);
    setIsDialogOpen(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      linkedTo: banner.ctaUrl || banner.ctaLabel || "",
      startDate: toDateInputValue(banner.startAt),
      endDate: toDateInputValue(banner.endAt),
      imageUrl: banner.imageUrl || "",
      priorityRank: String(banner.priorityRank || 0),
      targetCityCodes: banner.targetCityCodes || [],
      targetVendorIds: banner.targetVendorIds || [],
      targetUserSegments: banner.targetUserSegments || [],
    });
    setPreviewImage(banner.imageUrl || null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewImage(base64String);
      setForm((prev) => ({ ...prev, imageUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async () => {
    if (!form.title.trim() || !form.linkedTo.trim()) {
      toast.error("Title and link are required");
      return;
    }

    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    const priorityRank = Number(form.priorityRank);
    if (!Number.isFinite(priorityRank) || priorityRank < 0) {
      toast.error("Priority rank must be a valid number");
      return;
    }

    try {
      const currentBanner = editingId ? bannerList.find((banner) => banner.id === editingId) : null;
      const payload = {
        title: form.title.trim(),
        ctaLabel: form.linkedTo.trim(),
        ctaUrl: form.linkedTo.trim(),
        ctaType: "external_url",
        imageUrl: form.imageUrl || null,
        priorityRank,
        isActive: currentBanner?.isActive ?? true,
        startAt: form.startDate ? `${form.startDate}T00:00:00.000Z` : null,
        endAt: form.endDate ? `${form.endDate}T23:59:59.999Z` : null,
        targetCityCodes: form.targetCityCodes,
        targetVendorIds: form.targetVendorIds,
        targetUserSegments: form.targetUserSegments,
      };

      if (editingId) {
        const updated = normalizeBanner(await adminContentApi.updateBanner(editingId, payload));
        setBannerList((prev) => prev.map((banner) => (banner.id === editingId ? updated : banner)));
        toast.success("Banner updated");
      } else {
        const created = normalizeBanner(await adminContentApi.createBanner(payload));
        setBannerList((prev) => [created, ...prev]);
        toast.success("Banner created");
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save banner", error);
      toast.error("Could not save banner changes");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminContentApi.deleteBanner(id);
      setBannerList((prev) => prev.filter((banner) => banner.id !== id));
      toast.success("Banner deleted");
    } catch (error) {
      console.error("Failed to delete banner", error);
      toast.error("Delete failed");
      loadBanners();
    }
  };

  const updateFormArray = (field: keyof Pick<BannerForm, "targetCityCodes" | "targetVendorIds" | "targetUserSegments">, value: string) => {
    setForm((prev) => ({ ...prev, [field]: toggleValue(prev[field], value) }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">Banners</h1>
          <p className="text-slate-500 mt-1">Manage home screen promotional banners</p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading banners...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {bannerList.map((banner) => (
            <div key={banner.id} className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab shrink-0" />
                <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border">
                  {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-400 text-[10px] text-center p-2">No Image</div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-black truncate">{banner.title}</h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs">
                    Priority {banner.priorityRank || 0}
                  </Badge>
                  {!banner.isActive && (
                    <Badge className="bg-slate-100 text-slate-600 border-none text-xs">Inactive</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {banner.ctaLabel || "No Link"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {banner.startAt ? formatDisplayDate(banner.startAt) : "Any time"} to {banner.endAt ? formatDisplayDate(banner.endAt) : "No expiry"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {banner.targetCityCodes.length ? `${banner.targetCityCodes.length} cities` : "All cities"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {banner.targetVendorIds.length ? `${banner.targetVendorIds.length} vendors` : "All vendors"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {banner.targetUserSegments.length ? banner.targetUserSegments.join(", ") : "All users"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-auto">
                <Switch checked={banner.isActive} onCheckedChange={() => toggleBanner(banner.id, banner.isActive)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700" onClick={() => openEdit(banner)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {bannerList.length === 0 && (
            <div className="text-center p-8 text-slate-500">No banners configured</div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Banner Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Recommended size: 1080x540 pixels (2:1 ratio)</li>
          <li>Use city, vendor, and user-segment targeting only when the banner should not be global</li>
          <li>Higher priority banners appear first in the app</li>
        </ul>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "Add New Banner"}</DialogTitle>
            <DialogDescription>
              Provide the details, schedule, priority, and targeting rules for this home banner.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Banner Title</Label>
                <Input
                  placeholder="e.g., Summer Sale"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Link To</Label>
                <Input
                  placeholder="e.g., Dry Clean Service"
                  value={form.linkedTo}
                  onChange={(e) => setForm({ ...form, linkedTo: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 scheme-light"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 scheme-light"
                />
              </div>
              <div>
                <Label>Priority Rank</Label>
                <Select
                  value={form.priorityRank}
                  onValueChange={(value) => setForm({ ...form, priorityRank: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select rank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (High)</SelectItem>
                    <SelectItem value="2">2 (Medium)</SelectItem>
                    <SelectItem value="3">3 (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Targeting</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>City-based targeting</Label>
                  <div className="mt-2 grid gap-3 md:grid-cols-[220px_1fr]">
                    <Select value={selectedStateCode || undefined} onValueChange={setSelectedStateCode}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex flex-col gap-2">
                      <Select
                        onValueChange={(value) => {
                          if (value && !form.targetCityCodes.includes(value)) {
                            updateFormArray("targetCityCodes", value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={cityOptions.length ? "Add city..." : "No cities available"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cityOptions.length ? (
                            cityOptions.map((city) => (
                              <SelectItem key={city.cityCode} value={city.cityCode}>
                                <div className="flex items-center gap-2">
                                  {city.cityName}
                                  <span className="text-[10px] uppercase text-slate-400">({city.cityCode})</span>
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <div className="p-2 text-sm text-slate-500 text-center">No cities found for this state.</div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedCityLabels.length ? (
                      form.targetCityCodes.map((code, index) => (
                        <Badge key={code} variant="outline" className="gap-1">
                          {selectedCityLabels[index]}
                          <button type="button" onClick={() => updateFormArray("targetCityCodes", code)} aria-label={`Remove ${selectedCityLabels[index]}`}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500">No city selected. Banner will target all cities.</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Vendor-specific targeting</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Select
                      onValueChange={(value) => {
                        if (value && !form.targetVendorIds.includes(value)) {
                          updateFormArray("targetVendorIds", value);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={vendors.length ? "Add vendor..." : "No vendors available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.length ? (
                          vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.label}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-slate-500 text-center">No vendors available.</div>
                        )}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex flex-wrap gap-2">
                      {selectedVendorLabels.length ? (
                        form.targetVendorIds.map((id, index) => (
                          <Badge key={id} variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-100">
                            {selectedVendorLabels[index]}
                            <button type="button" onClick={() => updateFormArray("targetVendorIds", id)} aria-label={`Remove ${selectedVendorLabels[index]}`}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No vendor selected. Banner will target all vendors.</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>User-segment targeting</Label>
                  <div className="mt-2 flex flex-col gap-2">
                    <Select
                      value={form.targetUserSegments.length === 0 ? "all" : (form.targetUserSegments.length === 1 ? form.targetUserSegments[0] : "all")}
                      onValueChange={(value) => {
                        if (value === "all") {
                          setForm(prev => ({ ...prev, targetUserSegments: [] }));
                        } else {
                          setForm(prev => ({ ...prev, targetUserSegments: [value] }));
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select user segment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {USER_SEGMENTS.map((segment) => (
                          <SelectItem key={segment.value} value={segment.value}>
                            {segment.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div
                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="h-28 w-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-slate-400" />
                    <span className="text-xs text-slate-500 text-center">Click to upload 1080x540 image</span>
                  </>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" onClick={handleSaveBanner}>
              {editingId ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
