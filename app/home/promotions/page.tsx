"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Edit,
  GripVertical,
  Calendar,
  Save,
  ArrowLeft,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
} from "lucide-react";
import { adminContentApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Campaign = {
  id: string;
  title: string;
  description: string;
  campaignType: string;
  discountType: string;
  discountValue: number;
  endAt: string | null;
  isActive: boolean;
};

type PromoForm = {
  title: string;
  description: string;
  discount: string;
  type: string;
  validUntil: string;
};

const CAMPAIGN_TYPES = [
  {
    value: "coupon",
    label: "Coupon-based Campaigns",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "vendor_sponsored",
    label: "Vendor-sponsored Offers",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "platform_funded",
    label: "Platform-Funded Offers",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "free_pickup",
    label: "Free Pickup Campaign",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "express_upsell",
    label: "Express Delivery Upsell",
    color: "bg-orange-100 text-orange-700",
  },
] as const;

const emptyForm: PromoForm = {
  title: "",
  description: "",
  discount: "",
  type: "coupon",
  validUntil: "",
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

const normalizeCampaignType = (type: string) => {
  if (!type) return "coupon";
  const byValue = CAMPAIGN_TYPES.find((item) => item.value === type);
  if (byValue) return byValue.value;
  const byLabel = CAMPAIGN_TYPES.find((item) => item.label === type);
  if (byLabel) return byLabel.value;
  return "coupon";
};

const getCampaignTypeMeta = (type: string) => {
  const normalized = normalizeCampaignType(type);
  return CAMPAIGN_TYPES.find((item) => item.value === normalized) || CAMPAIGN_TYPES[0];
};

const parseCampaign = (raw: any): Campaign => ({
  id: String(raw?.id || ""),
  title: String(raw?.title || ""),
  description: String(raw?.description || ""),
  campaignType: normalizeCampaignType(String(raw?.campaignType || "coupon")),
  discountType: String(raw?.discountType || "percentage"),
  discountValue: Number(raw?.discountValue ?? 0),
  endAt: raw?.endAt || null,
  isActive: Boolean(raw?.isActive),
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const applyInlineMarkdown = (value: string) =>
  value
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

const formatDescriptionToHtml = (value: string) => {
  const normalized = (value || "").trim();
  if (!normalized) return "<p>No description</p>";

  const escaped = escapeHtml(value);
  const lines = escaped.split("\n");
  const output: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      output.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      output.push("</ol>");
      inOl = false;
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      return;
    }

    if (trimmed.startsWith("## ")) {
      closeLists();
      output.push(`<h4>${applyInlineMarkdown(trimmed.slice(3))}</h4>`);
      return;
    }

    if (trimmed.startsWith("> ")) {
      closeLists();
      output.push(`<blockquote>${applyInlineMarkdown(trimmed.slice(2))}</blockquote>`);
      return;
    }

    if (trimmed.startsWith("- ")) {
      if (!inUl) {
        closeLists();
        output.push("<ul>");
        inUl = true;
      }
      output.push(`<li>${applyInlineMarkdown(trimmed.slice(2))}</li>`);
      return;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (!inOl) {
        closeLists();
        output.push("<ol>");
        inOl = true;
      }
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const applyWrap = (prefix: string, suffix = prefix, fallbackText = "text") => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = form.description.slice(start, end) || fallbackText;
    const before = form.description.slice(0, start);
    const after = form.description.slice(end);
    const nextValue = `${before}${prefix}${selected}${suffix}${after}`;

    setForm((prev) => ({ ...prev, description: nextValue }));

    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + selected.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const applyLinePrefix = (prefix: string) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.description;
    const blockStart = current.lastIndexOf("\n", start - 1) + 1;
    let blockEnd = current.indexOf("\n", end);
    if (blockEnd === -1) blockEnd = current.length;

    const block = current.slice(blockStart, blockEnd);
    const lines = block.split("\n");
    const prefixed = lines.map((line) => (line.trim() ? `${prefix}${line}` : prefix.trimEnd())).join("\n");
    const nextValue = `${current.slice(0, blockStart)}${prefixed}${current.slice(blockEnd)}`;

    setForm((prev) => ({ ...prev, description: nextValue }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(blockStart, blockStart + prefixed.length);
    });
  };

  const applyOrderedList = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.description;
    const blockStart = current.lastIndexOf("\n", start - 1) + 1;
    let blockEnd = current.indexOf("\n", end);
    if (blockEnd === -1) blockEnd = current.length;

    const block = current.slice(blockStart, blockEnd);
    const lines = block.split("\n");
    const ordered = lines
      .map((line, index) => {
        const cleaned = line.replace(/^\d+\.\s+/, "").trim();
        return `${index + 1}. ${cleaned || "item"}`;
      })
      .join("\n");

    const nextValue = `${current.slice(0, blockStart)}${ordered}${current.slice(blockEnd)}`;
    setForm((prev) => ({ ...prev, description: nextValue }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(blockStart, blockStart + ordered.length);
    });
  };

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const data = await adminContentApi.getCampaigns();
      const normalized = Array.isArray(data) ? data.map(parseCampaign) : [];
      setCampaignList(normalized);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title,
      description: campaign.description,
      discount: String(campaign.discountValue || ""),
      type: campaign.campaignType,
      validUntil: toDateInputValue(campaign.endAt),
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const parsedDiscount = Number(form.discount);
    if (!Number.isFinite(parsedDiscount) || parsedDiscount < 0) {
      toast.error("Enter a valid discount value");
      return;
    }

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        campaignType: normalizeCampaignType(form.type),
        discountType: "percentage",
        discountValue: parsedDiscount,
        endAt: form.validUntil ? `${form.validUntil}T00:00:00.000Z` : null,
      };

      if (editingId) {
        const updated = await adminContentApi.updateCampaign(editingId, payload);
        const normalized = parseCampaign(updated);
        setCampaignList((prev) => prev.map((item) => (item.id === editingId ? normalized : item)));
        toast.success("Promotion updated");
      } else {
        const created = await adminContentApi.createCampaign({
          ...payload,
          isActive: true,
          priorityRank: campaignList.length + 1,
        });
        setCampaignList((prev) => [parseCampaign(created), ...prev]);
        toast.success("Promotion added");
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save promotion");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminContentApi.deleteCampaign(id);
      setCampaignList((prev) => prev.filter((item) => item.id !== id));
      toast.success("Promotion removed");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  const togglePromo = async (id: string, current: boolean) => {
    try {
      setCampaignList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isActive: !current } : item))
      );
      await adminContentApi.updateCampaign(id, { isActive: !current });
    } catch (error) {
      console.error(error);
      toast.error("Toggle failed");
      loadCampaigns();
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
          <h1 className="text-3xl text-black font-bold tracking-tight">Campaign Manager</h1>
          <p className="text-slate-500 mt-1">
            Create and monitor coupons, vendor offers, and marketing campaigns
          </p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Promotion
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{campaignList.filter((item) => item.isActive).length}</p>
          <p className="text-sm text-slate-500">Active Promotions</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{campaignList.filter((item) => !item.isActive).length}</p>
          <p className="text-sm text-slate-500">Inactive</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{campaignList.length}</p>
          <p className="text-sm text-slate-500">Total</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-12 text-slate-500">Loading campaigns...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {campaignList.map((campaign) => {
            const typeMeta = getCampaignTypeMeta(campaign.campaignType);
            const discountText = campaign.discountType === "percentage"
              ? `${campaign.discountValue}%`
              : `₹${campaign.discountValue}`;

            return (
              <div
                key={campaign.id}
                className={`p-4 flex items-center gap-4 ${!campaign.isActive ? "opacity-60" : ""}`}
              >
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab shrink-0" />

                <div className="w-20 h-16 bg-linear-to-br from-[#3E8940] to-[#5FAD61] rounded-lg flex items-center justify-center text-white font-bold text-sm text-center px-1 shrink-0">
                  {discountText}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-black">{campaign.title}</h3>
                    <Badge className={`${typeMeta.color} border-none text-xs`}>
                      {typeMeta.label}
                    </Badge>
                    {!campaign.isActive && (
                      <Badge className="bg-slate-100 text-slate-600 border-none text-xs">Inactive</Badge>
                    )}
                  </div>
                  <div
                    className="mb-1 text-sm text-slate-500 leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h4]:font-semibold [&_h4]:text-slate-700 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html: formatDescriptionToHtml(campaign.description),
                    }}
                  />
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Calendar className="h-3 w-3" />
                    Valid Until: {formatDisplayDate(campaign.endAt)}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={campaign.isActive}
                    onCheckedChange={() => togglePromo(campaign.id, campaign.isActive)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => openEdit(campaign)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {campaignList.length === 0 && (
            <div className="p-12 text-center text-slate-500">No promotions configured</div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Promotion" : "Add New Promotion"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Title / Coupon Code</Label>
              <Input
                placeholder="e.g., WINTER20"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description (Article Format)</Label>
              <div className="mt-1 flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => applyLinePrefix("## ")}
                  title="Heading"
                >
                  <Heading1 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => applyWrap("**", "**", "bold text")}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => applyWrap("*", "*", "italic text")}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => applyLinePrefix("- ")}
                  title="Bulleted list"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={applyOrderedList}
                  title="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() => applyLinePrefix("> ")}
                  title="Quote"
                >
                  <Quote className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                ref={descriptionRef}
                placeholder="Write a complete campaign article.\n\nExample:\nThis campaign gives 10% off on all winter-care services.\nOffer valid for selected cities only."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-2 min-h-40 resize-y"
              />
              <p className="mt-1 text-xs text-slate-500">
                Basic tools are available: heading, bold, italic, bullets, numbered list, and quote.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Selected text will be formatted using markdown-style syntax and displayed as an article.
              </p>
              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-600">Preview</p>
                <div
                  className="text-sm text-slate-700 leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300 [&_blockquote]:pl-3 [&_h4]:mb-1 [&_h4]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{
                    __html: formatDescriptionToHtml(form.description),
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (%)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 10"
                  value={form.discount}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <div className="relative mt-1">
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    className="scheme-light"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Promotion Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 gap-2" onClick={handleSubmit}>
              {editingId ? <><Save className="h-4 w-4" />Save Changes</> : <><Plus className="h-4 w-4" />Add Promotion</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
