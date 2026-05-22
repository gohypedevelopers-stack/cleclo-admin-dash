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
  MapPin,
  Play,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  Upload,
  Users,
  Video as VideoIcon,
  X,
} from "lucide-react";
import { adminContentApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type Video = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  isActive: boolean;
  thumbnailUrl?: string;
  priorityRank?: number;
  startAt?: string | null;
  endAt?: string | null;
  targetCityCodes?: string[];
  targetVendorIds?: string[];
  targetUserSegments?: string[];
};

type VideoForm = {
  title: string;
  description: string;
  duration: string;
  thumbUrl: string;
  videoUrl: string;
  startDate: string;
  endDate: string;
  priorityRank: string;
  targetCityCodes: string[];
  targetVendorIds: string[];
  targetUserSegments: string[];
};

type StateOption = {
  code: string;
  name: string;
};

type CityOption = {
  cityCode: string;
  cityName: string;
};

type VendorOption = {
  id: string;
  label: string;
};

const USER_SEGMENTS = [
  { value: "new_users", label: "New users" },
  { value: "repeat_users", label: "Repeat users" },
];

const emptyForm: VideoForm = {
  title: "",
  description: "",
  duration: "",
  thumbUrl: "",
  videoUrl: "",
  startDate: "",
  endDate: "",
  priorityRank: "1",
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
  return parsed.toISOString().slice(0, 10);
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

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function VideosPage() {
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [form, setForm] = useState<VideoForm>(emptyForm);
  const [states, setStates] = useState<StateOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLabelByCode, setCityLabelByCode] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const vendorLabelById = useMemo(
    () => Object.fromEntries(vendors.map((v) => [v.id, v.label])),
    [vendors]
  );

  const selectedCityLabels = form.targetCityCodes.map((code) => cityLabelByCode[code] || code);
  const selectedVendorLabels = form.targetVendorIds.map((id) => vendorLabelById[id] || id);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await adminContentApi.getVideos();
      setVideoList(data);
    } catch (e) {
      console.error("Failed to load videos", e);
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
      setStates(stateData);
      setVendors(
        vendorData.vendors.map((v: any) => ({
          id: v.id,
          label: v.vendorProfile?.businessName || v.name || v.phone,
        }))
      );
    } catch (error) {
      console.error("Failed to load targeting options", error);
    }
  };

  const loadCitiesForState = async (stateCode: string) => {
    if (!stateCode) return;
    try {
      const data = await adminLocationApi.getCitiesByState(stateCode);
      setCityOptions(data);
      setCityLabelByCode((prev) => ({
        ...prev,
        ...Object.fromEntries(data.map((city: any) => [city.cityCode, city.cityName])),
      }));
    } catch (error) {
      console.error("Failed to load cities", error);
    }
  };

  useEffect(() => {
    loadVideos();
    loadTargetingOptions();
  }, []);

  useEffect(() => {
    loadCitiesForState(selectedStateCode);
  }, [selectedStateCode]);

  const parseDuration = (str: string) => {
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return Number(str) || 0;
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, priorityRank: String(videoList.length + 1) });
    setPreviewThumb(null);
    setVideoPreview(null);
    setIsDialogOpen(true);
  };

  const openEdit = (video: Video) => {
    const mins = Math.floor((video.durationSeconds || 0) / 60);
    const secs = (video.durationSeconds || 0) % 60;
    
    setEditingId(video.id);
    setForm({ 
      title: video.title, 
      duration: `${mins}:${secs.toString().padStart(2, '0')}`,
      description: video.description || "",
      thumbUrl: video.thumbnailUrl || "",
      videoUrl: video.videoUrl || "",
      startDate: toDateInputValue(video.startAt),
      endDate: toDateInputValue(video.endAt),
      priorityRank: String(video.priorityRank || 1),
      targetCityCodes: video.targetCityCodes || [],
      targetVendorIds: video.targetVendorIds || [],
      targetUserSegments: video.targetUserSegments || [],
    });
    setPreviewThumb(video.thumbnailUrl || null);
    setVideoPreview(video.videoUrl || null);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        durationSeconds: parseDuration(form.duration),
        thumbnailUrl: form.thumbUrl,
        videoUrl: form.videoUrl,
        isActive: true,
        priorityRank: Number(form.priorityRank),
        startAt: form.startDate ? `${form.startDate}T00:00:00.000Z` : null,
        endAt: form.endDate ? `${form.endDate}T23:59:59.999Z` : null,
        targetCityCodes: form.targetCityCodes,
        targetVendorIds: form.targetVendorIds,
        targetUserSegments: form.targetUserSegments,
      };

      if (editingId) {
        const updated = await adminContentApi.updateVideo(editingId, payload);
        setVideoList(prev => prev.map(v => v.id === editingId ? updated : v));
        toast.success("Video updated");
      } else {
        const created = await adminContentApi.createVideo(payload);
        setVideoList(prev => [created, ...prev]);
        toast.success("Video added");
      }
      setIsDialogOpen(false);
    } catch (e) {
      toast.error("Failed to save video");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await adminContentApi.deleteVideo(id);
      setVideoList((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video removed");
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const toggleVideo = async (id: string, current: boolean) => {
    try {
      setVideoList((prev) =>
        prev.map((v) => (v.id === id ? { ...v, isActive: !current } : v))
      );
      await adminContentApi.updateVideo(id, { isActive: !current });
    } catch (e) {
      toast.error("Toggle failed");
      loadVideos();
    }
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
          <h1 className="text-3xl text-black font-bold tracking-tight">Videos</h1>
          <p className="text-slate-500 mt-1">Manage explainer videos with intelligence layer targeting</p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[#3E8940]">{videoList.length}</p>
          <p className="text-sm text-slate-500">Total Videos</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{videoList.filter((v) => v.isActive).length}</p>
          <p className="text-sm text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {videoList.length}
          </p>
          <p className="text-sm text-slate-500">Targeted Records</p>
        </div>
      </div>

      {loading ? (
          <div className="text-center p-12 text-slate-500">Loading videos...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {videoList.sort((a,b) => (a.priorityRank||0) - (b.priorityRank||0)).map((video) => (
            <div key={video.id} className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab shrink-0" />
                <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0 border">
                  {video.thumbnailUrl ? (
                    <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                  ) : (
                    <VideoIcon className="h-8 w-8 text-slate-400" />
                  )}
                  <Badge className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] border-none">
                    {Math.floor((video.durationSeconds || 0) / 60)}:{String((video.durationSeconds || 0) % 60).padStart(2, "0")}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-black truncate">{video.title}</h3>
                  <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs">
                    Rank {video.priorityRank || 0}
                  </Badge>
                  {!video.isActive && (
                    <Badge className="bg-slate-100 text-slate-600 border-none text-xs">Hidden</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {video.startAt ? formatDisplayDate(video.startAt) : "Any time"} to {video.endAt ? formatDisplayDate(video.endAt) : "No expiry"}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {video.targetCityCodes?.length ? `${video.targetCityCodes.length} cities` : "All cities"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {video.targetUserSegments?.length ? video.targetUserSegments.join(", ") : "All users"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end lg:self-auto">
                <Switch checked={video.isActive} onCheckedChange={() => toggleVideo(video.id, video.isActive)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700" onClick={() => openEdit(video)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700" onClick={() => handleDelete(video.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {videoList.length === 0 && <div className="p-12 text-center text-slate-500">No videos configured</div>}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Video" : "Add New Video"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Video Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Duration (M:SS)</Label>
                <Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="mt-1" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="mt-1 scheme-light" />
              </div>
              <div>
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="mt-1 scheme-light" />
              </div>
              <div>
                <Label>Priority Rank</Label>
                <Select value={form.priorityRank} onValueChange={(v) => setForm({ ...form, priorityRank: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
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
                  <Label>City Targeting</Label>
                  <div className="mt-2 flex gap-2">
                    <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>{states.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(v) => v && setForm(f => ({ ...f, targetCityCodes: toggleValue(f.targetCityCodes, v) }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Add city..." /></SelectTrigger>
                      <SelectContent>{cityOptions.map(c => <SelectItem key={c.cityCode} value={c.cityCode}>{c.cityName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.targetCityCodes.map(code => (
                      <Badge key={code} variant="outline" className="gap-1">
                        {cityLabelByCode[code] || code}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, targetCityCodes: f.targetCityCodes.filter(c => c !== code) }))} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Vendor Targeting</Label>
                  <div className="mt-2 flex gap-2">
                    <Select onValueChange={(v) => v && setForm(f => ({ ...f, targetVendorIds: toggleValue(f.targetVendorIds, v) }))}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Add vendor..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map(v => (
                          <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.targetVendorIds.map(id => (
                      <Badge key={id} variant="secondary" className="gap-1">
                        <Building2 className="h-3 w-3" />
                        {vendorLabelById[id] || id}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, targetVendorIds: f.targetVendorIds.filter(v => v !== id) }))} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>User Segments</Label>
                  <div className="mt-2 flex gap-2">
                    {USER_SEGMENTS.map(s => (
                      <Badge 
                        key={s.value} 
                        variant={form.targetUserSegments.includes(s.value) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setForm(f => ({ ...f, targetUserSegments: toggleValue(f.targetUserSegments, s.value) }))}
                      >
                        {s.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div 
                  className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewThumb ? <img src={previewThumb} className="h-full w-full object-contain" /> : <Upload className="h-6 w-6 text-slate-300" />}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => { setPreviewThumb(r.result as string); setForm(prev => ({ ...prev, thumbUrl: r.result as string })); };
                      r.readAsDataURL(f);
                    }
                  }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Video File</Label>
                <div 
                  className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center h-24 cursor-pointer hover:bg-slate-50"
                  onClick={() => videoFileInputRef.current?.click()}
                >
                  {videoPreview ? <div className="text-[10px] text-green-600 font-bold">VIDEO READY</div> : <Upload className="h-6 w-6 text-slate-300" />}
                  <input type="file" ref={videoFileInputRef} className="hidden" accept="video/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onloadend = () => { setVideoPreview(r.result as string); setForm(prev => ({ ...prev, videoUrl: r.result as string })); };
                      r.readAsDataURL(f);
                    }
                  }} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" onClick={handleSave}>Save Video</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
