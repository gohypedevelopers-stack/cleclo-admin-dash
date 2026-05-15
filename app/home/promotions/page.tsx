"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bold,
  Building2,
  Calendar,
  Check,
  Edit,
  GripVertical,
  Heading1,
  Italic,
  List,
  ListOrdered,
  MapPin,
  Plus,
  Quote,
  Save,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { adminContentApi, adminLocationApi, adminVendorApi } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Campaign = {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  discountType: string;
  discountValue: number;
  startAt: string | null;
  endAt: string | null;
  isActive: boolean;
  priorityRank?: number;
  targetCityCodes?: string[];
  targetVendorIds?: string[];
  targetUserSegments?: string[];
};

type PromoForm = {
  title: string;
  description: string;
  discount: string;
  type: string;
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

const CAMPAIGN_TYPES = [
  { value: "coupon", label: "Coupon-based Campaigns", color: "bg-blue-100 text-blue-700" },
  { value: "vendor_sponsored", label: "Vendor-sponsored Offers", color: "bg-purple-100 text-purple-700" },
  { value: "platform_funded", label: "Platform-Funded Offers", color: "bg-amber-100 text-amber-700" },
  { value: "free_pickup", label: "Free Pickup Campaign", color: "bg-emerald-100 text-emerald-700" },
  { value: "express_upsell", label: "Express Delivery Upsell", color: "bg-orange-100 text-orange-700" },
] as const;

const USER_SEGMENTS = [
  { value: "new_users", label: "New users" },
  { value: "repeat_users", label: "Repeat users" },
];

const emptyForm: PromoForm = {
  title: "",
  description: "",
  discount: "",
  type: "coupon",
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
  if (!value) return "Ongoing";
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

const escapeHtml = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
const applyInlineMarkdown = (v: string) => v.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");

const formatDescriptionToHtml = (value: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return "<p>No description</p>";
  const escaped = escapeHtml(value);
  const lines = escaped.split("\n");
  const output: string[] = [];
  let inUl = false, inOl = false;

  const closeLists = () => {
    if (inUl) { output.push("</ul>"); inUl = false; }
    if (inOl) { output.push("</ol>"); inOl = false; }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) { closeLists(); return; }
    if (trimmed.startsWith("## ")) { closeLists(); output.push(`<h4>${applyInlineMarkdown(trimmed.slice(3))}</h4>`); return; }
    if (trimmed.startsWith("> ")) { closeLists(); output.push(`<blockquote>${applyInlineMarkdown(trimmed.slice(2))}</blockquote>`); return; }
    if (trimmed.startsWith("- ")) {
      if (!inUl) { closeLists(); output.push("<ul>"); inUl = true; }
      output.push(`<li>${applyInlineMarkdown(trimmed.slice(2))}</li>`);
      return;
    }
    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (!inOl) { closeLists(); output.push("<ol>"); inOl = true; }
      output.push(`<li>${applyInlineMarkdown(orderedMatch[1])}</li>`);
      return;
    }
    closeLists();
    output.push(`<p>${applyInlineMarkdown(trimmed)}</p>`);
  });
  closeLists();
  return output.join("");
};

export default function PromotionsPage() {
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyForm);
  const [states, setStates] = useState<StateOption[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [cityLabelByCode, setCityLabelByCode] = useState<Record<string, string>>({});
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const vendorLabelById = useMemo(() => Object.fromEntries(vendors.map(v => [v.id, v.label])), [vendors]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await adminContentApi.getCampaigns();
      setCampaignList(data);
    } catch (error) {
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const loadTargetingOptions = async () => {
    try {
      const [stateData, vendorData] = await Promise.all([adminLocationApi.getStates(), adminVendorApi.getVendors()]);
      setStates(stateData);
      setVendors(vendorData.vendors.map((v: any) => ({ id: v.id, label: v.vendorProfile?.businessName || v.name || v.phone })));
    } catch (error) { console.error(error); }
  };

  useEffect(() => { loadCampaigns(); loadTargetingOptions(); }, []);
  useEffect(() => { if (selectedStateCode) { adminLocationApi.getCitiesByState(selectedStateCode).then(data => {
    setCityOptions(data);
    setCityLabelByCode(prev => ({ ...prev, ...Object.fromEntries(data.map((c: any) => [c.cityCode, c.cityName])) }));
  }); } }, [selectedStateCode]);

  const applyWrap = (prefix: string, suffix = prefix, fallbackText = "text") => {
    const t = descriptionRef.current; if (!t) return;
    const s = t.selectionStart, e = t.selectionEnd;
    const sel = form.description.slice(s, e) || fallbackText;
    const nextValue = `${form.description.slice(0, s)}${prefix}${sel}${suffix}${form.description.slice(e)}`;
    setForm(p => ({ ...p, description: nextValue }));
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + prefix.length, s + prefix.length + sel.length); });
  };

  const openAdd = () => { setEditingId(null); setForm({ ...emptyForm, priorityRank: String(campaignList.length + 1) }); setIsDialogOpen(true); };
  const openEdit = (c: Campaign) => {
    setEditingId(c.id);
    setForm({
      title: c.title,
      description: c.description,
      discount: String(c.discountValue || ""),
      type: c.campaignType,
      startDate: toDateInputValue(c.startAt),
      endDate: toDateInputValue(c.endAt),
      priorityRank: String(c.priorityRank || 1),
      targetCityCodes: c.targetCityCodes || [],
      targetVendorIds: c.targetVendorIds || [],
      targetUserSegments: c.targetUserSegments || [],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        campaignType: form.type,
        discountType: "percentage",
        discountValue: Number(form.discount),
        startAt: form.startDate ? `${form.startDate}T00:00:00.000Z` : null,
        endAt: form.endDate ? `${form.endDate}T23:59:59.999Z` : null,
        priorityRank: Number(form.priorityRank),
        targetCityCodes: form.targetCityCodes,
        targetVendorIds: form.targetVendorIds,
        targetUserSegments: form.targetUserSegments,
      };
      if (editingId) {
        const res = await adminContentApi.updateCampaign(editingId, payload);
        setCampaignList(prev => prev.map(item => item.id === editingId ? res : item));
        toast.success("Promotion updated");
      } else {
        const res = await adminContentApi.createCampaign({ ...payload, isActive: true });
        setCampaignList(prev => [res, ...prev]);
        toast.success("Promotion added");
      }
      setIsDialogOpen(false);
    } catch (e) { toast.error("Failed to save promotion"); }
  };

  const togglePromo = async (id: string, current: boolean) => {
    try {
      setCampaignList(p => p.map(i => i.id === id ? { ...i, isActive: !current } : i));
      await adminContentApi.updateCampaign(id, { isActive: !current });
    } catch (e) { toast.error("Toggle failed"); loadCampaigns(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion?")) return;
    try {
      await adminContentApi.deleteCampaign(id);
      setCampaignList(p => p.filter(i => i.id !== id));
      toast.success("Promotion removed");
    } catch (e) { toast.error("Delete failed"); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/app"><ArrowLeft className="h-4 w-4" />Back</Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">Campaign Manager</h1>
          <p className="text-slate-500 mt-1">Targeted coupons and marketing offers</p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={openAdd}>
          <Plus className="h-4 w-4" />Add Promotion
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{campaignList.filter(i => i.isActive).length}</p>
          <p className="text-sm text-slate-500">Active Promotions</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{campaignList.filter(i => !i.isActive).length}</p>
          <p className="text-sm text-slate-500">Inactive</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-[#3E8940]">{campaignList.length}</p>
          <p className="text-sm text-slate-500">Total Records</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading campaigns...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {campaignList.sort((a,b) => (a.priorityRank||0) - (b.priorityRank||0)).map((campaign) => {
            const typeMeta = CAMPAIGN_TYPES.find(t => t.value === campaign.campaignType) || CAMPAIGN_TYPES[0];
            return (
              <div key={campaign.id} className={`p-4 flex flex-col gap-4 lg:flex-row lg:items-center ${!campaign.isActive ? "opacity-60" : ""}`}>
                <GripVertical className="h-5 w-5 text-slate-300 shrink-0" />
                <div className="w-20 h-16 bg-linear-to-br from-[#3E8940] to-[#5FAD61] rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {campaign.discountValue}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-black">{campaign.title}</h3>
                    <Badge className={`${typeMeta.color} border-none text-xs`}>{typeMeta.label}</Badge>
                    <Badge variant="outline" className="text-xs">Rank {campaign.priorityRank || 0}</Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDisplayDate(campaign.startAt)} - {formatDisplayDate(campaign.endAt)}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{campaign.targetCityCodes?.length || "All"} Cities</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{campaign.targetUserSegments?.length || "All"} Segments</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={campaign.isActive} onCheckedChange={() => togglePromo(campaign.id, campaign.isActive)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(campaign)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDelete(campaign.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit Promotion" : "Add New Promotion"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Coupon Code / Title</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="mt-1" /></div>
              <div><Label>Discount (%)</Label><Input type="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} className="mt-1" /></div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Campaign Type</Label>
                <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority Rank</Label>
                <Select value={form.priorityRank} onValueChange={v => setForm({...form, priorityRank: v})}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 (Highest)</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5 (Lowest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="mt-1" /></div>
              <div><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="mt-1" /></div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold"><SlidersHorizontal className="h-4 w-4" />Targeting</div>
              <div className="space-y-4">
                <div>
                  <Label>Cities</Label>
                  <div className="mt-2 flex gap-2">
                    <Select value={selectedStateCode} onValueChange={setSelectedStateCode}>
                      <SelectTrigger className="w-40"><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>{states.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={v => v && setForm(f => ({ ...f, targetCityCodes: toggleValue(f.targetCityCodes, v) }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Add City..." /></SelectTrigger>
                      <SelectContent>{cityOptions.map(c => <SelectItem key={c.cityCode} value={c.cityCode}>{c.cityName}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.targetCityCodes.map(c => <Badge key={c} variant="secondary" className="gap-1">{cityLabelByCode[c] || c}<X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, targetCityCodes: f.targetCityCodes.filter(x => x !== c) }))} /></Badge>)}
                  </div>
                </div>
                <div>
                  <Label>Vendors</Label>
                  <div className="mt-2 flex gap-2">
                    <Select onValueChange={v => v && setForm(f => ({ ...f, targetVendorIds: toggleValue(f.targetVendorIds, v) }))}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Add Vendor..." /></SelectTrigger>
                      <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {form.targetVendorIds.map(v => <Badge key={v} variant="secondary" className="gap-1"><Building2 className="h-3 w-3" />{vendorLabelById[v] || v}<X className="h-3 w-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, targetVendorIds: f.targetVendorIds.filter(x => x !== v) }))} /></Badge>)}
                  </div>
                </div>
                <div>
                  <Label>Segments</Label>
                  <div className="mt-2 flex gap-2">
                    {USER_SEGMENTS.map(s => <Badge key={s.value} variant={form.targetUserSegments.includes(s.value) ? "default" : "outline"} className="cursor-pointer" onClick={() => setForm(f => ({ ...f, targetUserSegments: toggleValue(f.targetUserSegments, s.value) }))}>{s.label}</Badge>)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea ref={descriptionRef} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="mt-1 min-h-32" />
              <div className="mt-2 flex gap-1">
                <Button variant="outline" size="sm" onClick={() => applyWrap("**", "**", "bold")}>Bold</Button>
                <Button variant="outline" size="sm" onClick={() => applyWrap("*", "*", "italic")}>Italic</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90" onClick={handleSubmit}>Save Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
