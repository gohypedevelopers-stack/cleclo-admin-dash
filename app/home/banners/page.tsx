"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Trash2,
  Edit,
  Calendar,
  ArrowLeft,
  Link as LinkIcon,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminContentApi } from "@/lib/admin-api";
import { toast } from "sonner";
import { useRef } from "react";

export default function BannersPage() {
  const [bannerList, setBannerList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newBanner, setNewBanner] = useState({
    title: "",
    linkedTo: "",
    expiryDate: "",
    imageUrl: ""
  });

  const toDateInputValue = (value?: string) => {
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

  const formatDisplayDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  };

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await adminContentApi.getBanners();
      setBannerList(data);
    } catch (error) {
      console.error("Failed to load banners", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const toggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic UI update
      setBannerList((prev) =>
        prev.map((b) => (b.id === id ? { ...b, isActive: !currentStatus } : b))
      );
      await adminContentApi.updateBanner(id, { isActive: !currentStatus });
    } catch (error) {
      console.error("Failed to toggle banner", error);
      loadBanners(); // revert back on failure
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setNewBanner({ title: "", linkedTo: "", expiryDate: "", imageUrl: "" });
    setPreviewImage(null);
    setIsDialogOpen(true);
  };

  const openEdit = (banner: any) => {
    setEditingId(banner.id);
    setNewBanner({
      title: banner.title || "",
      linkedTo: banner.ctaUrl || banner.ctaLabel || "",
      expiryDate: toDateInputValue(banner.endAt),
      imageUrl: banner.imageUrl || ""
    });
    setPreviewImage(banner.imageUrl || null);
    setIsDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreviewImage(base64String);
        setNewBanner(prev => ({ ...prev, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = async () => {
    if (!newBanner.title || !newBanner.linkedTo) {
        toast.error("Required Fields", { description: "Title and Link are required" });
        return;
    }

    try {
      const payload = {
        title: newBanner.title,
        ctaLabel: newBanner.linkedTo,
        ctaUrl: newBanner.linkedTo,
        ctaType: "external_url",
        imageUrl: newBanner.imageUrl,
        priorityRank: bannerList.length + 1,
        isActive: true,
        endAt: null as string | null
      };

      if (newBanner.expiryDate) {
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(newBanner.expiryDate);
        if (!isValidDate) {
          toast.error("Invalid Date", { description: "Please select a valid expiry date" });
          return;
        }
        // Persist as a UTC date so it stays stable across different local time zones.
        payload.endAt = `${newBanner.expiryDate}T00:00:00.000Z`;
      }

      if (editingId) {
        const updated = await adminContentApi.updateBanner(editingId, payload);
        setBannerList((prev) => prev.map(b => b.id === editingId ? updated : b));
        toast.success("Banner Updated Successfully");
      } else {
        const created = await adminContentApi.createBanner(payload);
        setBannerList((prev) => [created, ...prev]);
        toast.success("Banner Created Successfully");
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save banner", error);
      toast.error("Operation Failed", { description: "Could not save banner changes" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminContentApi.deleteBanner(id);
      setBannerList((prev) => prev.filter((b) => b.id !== id));
      toast.success("Banner Deleted");
    } catch (error) {
      console.error("Failed to delete banner", error);
      toast.error("Delete Failed");
      loadBanners(); // Revert
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Banners
          </h1>
          <p className="text-slate-500 mt-1">
            Manage home screen promotional banners
          </p>
        </div>
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4" />
          Add Banner
        </Button>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading Banners...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border divide-y">
          {bannerList.map((banner) => (
            <div key={banner.id} className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

              {/* Image Preview */}
              <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 border">
                {banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-slate-400 text-[10px] text-center p-2">
                        No Image
                    </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-black truncate">
                    {banner.title}
                  </h3>
                  {!banner.isActive && (
                    <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <LinkIcon className="h-3.5 w-3.5" />
                    {banner.ctaLabel || 'No Link'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Expires: {banner.endAt ? formatDisplayDate(banner.endAt) : 'No Expiry'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={banner.isActive}
                  onCheckedChange={() => toggleBanner(banner.id, banner.isActive)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-slate-700"
                  onClick={() => openEdit(banner)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {bannerList.length === 0 && (
              <div className="text-center p-8 text-slate-500">No Banners Configured</div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Banner Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Recommended size: 1080x540 pixels (2:1 ratio)</li>
          <li>• Use high-contrast text for better visibility</li>
          <li>• Drag banners to reorder them in the app</li>
        </ul>
      </div>

      {/* Add Banner Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Banner" : "Add New Banner"}</DialogTitle>
            <DialogDescription>
              Provide the details for the promotional banner to be displayed on the home screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Banner Title
              </label>
              <Input
                placeholder="e.g., Summer Sale"
                value={newBanner.title}
                onChange={(e) =>
                  setNewBanner({ ...newBanner, title: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Link To (Service/Category)
              </label>
              <Input
                placeholder="e.g., Dry Clean Service"
                value={newBanner.linkedTo}
                onChange={(e) =>
                  setNewBanner({ ...newBanner, linkedTo: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">
                Expiry Date
              </label>
              <div className="relative mt-1">
                <Input
                  type="date"
                  value={newBanner.expiryDate}
                  onChange={(e) =>
                    setNewBanner({ ...newBanner, expiryDate: e.target.value })
                  }
                  className="scheme-light"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Banner Image
              </label>
              <div 
                className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                    <img src={previewImage} alt="Preview" className="h-24 w-full object-cover rounded-lg" />
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-slate-400" />
                        <span className="text-xs text-slate-500 text-center">Click to upload 1080x540 image</span>
                    </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleSaveBanner}
            >
              {editingId ? "Save Changes" : "Create Banner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
