"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Play,
  Trash2,
  Edit,
  Upload,
  Video as VideoIcon,
  GripVertical,
  Save,
  ArrowLeft,
} from "lucide-react";
import { adminContentApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Video = {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationSeconds?: number;
  views?: number;
  isActive: boolean;
  thumbnailUrl?: string;
};

export default function VideosPage() {
  const [videoList, setVideoList] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewThumb, setPreviewThumb] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", duration: "", description: "", thumbUrl: "", videoUrl: "" });

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

  useEffect(() => {
    loadVideos();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ title: "", duration: "", description: "", thumbUrl: "", videoUrl: "" });
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
      videoUrl: video.videoUrl || ""
    });
    setPreviewThumb(video.thumbnailUrl || null);
    setIsDialogOpen(true);
  };

  const parseDuration = (str: string) => {
    const [m, s] = str.split(":").map(Number);
    return (m || 0) * 60 + (s || 0);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum size is 50MB" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setVideoPreview(base64);
        setForm(prev => ({ ...prev, videoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreviewThumb(base64);
        setForm(prev => ({ ...prev, thumbUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!form.videoUrl && !editingId) {
      toast.error("Video file is required", {
        description: "Please upload a video file before saving.",
      });
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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-3 w-fit gap-2">
            <Link href="/app">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl text-black font-bold tracking-tight">Videos</h1>
          <p className="text-slate-500 mt-1">Manage explainer videos and thumbnails</p>
        </div>
        <Button className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{videoList.length}</p>
          <p className="text-sm text-slate-500">Total Videos</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{videoList.filter((v) => v.isActive).length}</p>
          <p className="text-sm text-slate-500">Active</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {videoList.reduce((sum, v) => sum + (v.views || 0), 0).toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">Total Views</p>
        </div>
      </div>

      {loading ? (
          <div className="text-center p-12 text-slate-500">Loading videos...</div>
      ) : (
        <>
          {/* Video List */}
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {videoList.map((video) => (
              <div
                key={video.id}
                className={`p-4 flex items-center gap-4 ${!video.isActive ? "opacity-60" : ""}`}
              >
                <GripVertical className="h-5 w-5 text-slate-300 cursor-grab shrink-0" />

                {/* Thumbnail */}
                <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer shrink-0">
                    {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                        <VideoIcon className="h-8 w-8 text-slate-400" />
                    )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                      <Play className="h-5 w-5 text-slate-900 ml-0.5" />
                    </div>
                  </div>
                  <Badge className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] border-none">
                    {Math.floor((video.durationSeconds || 0) / 60)}:{String((video.durationSeconds || 0) % 60).padStart(2, "0")}
                  </Badge>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-black">{video.title}</h3>
                    {!video.isActive && (
                      <Badge className="bg-slate-100 text-slate-600 border-none text-xs">Hidden</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{(video.views || 0).toLocaleString()} views</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Switch checked={video.isActive} onCheckedChange={() => toggleVideo(video.id, video.isActive)} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700"
                    onClick={() => openEdit(video)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDelete(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {videoList.length === 0 && (
              <div className="p-12 text-center text-slate-500">No videos configured</div>
            )}
          </div>
        </>
      )}

      {/* Upload Placeholder */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-white cursor-pointer hover:bg-slate-50" onClick={openAdd}>
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Upload className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-700">Add New Video Record</p>
            <p className="text-sm text-slate-500">Enter title, duration and thumbnail for display</p>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Video" : "Add New Video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Video Title</Label>
              <Input
                placeholder="e.g., How to use the app"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Brief description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Duration (M:SS)</Label>
              <Input
                placeholder="e.g., 2:30"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Thumbnail Image</Label>
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewThumb ? (
                    <img src={previewThumb} alt="Preview" className="h-20 w-full object-cover rounded" />
                ) : (
                    <>
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="text-xs text-slate-500">Click to upload thumbnail</span>
                    </>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>
            <div>
              <Label>Video File</Label>
              <div 
                className="mt-1 border-2 border-dashed rounded-lg p-3 flex flex-col items-center gap-2 cursor-pointer hover:bg-slate-50 min-h-25 justify-center"
                onClick={() => videoFileInputRef.current?.click()}
              >
                {videoPreview || form.videoUrl ? (
                    <div className="w-full flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-medium">
                            <VideoIcon className="h-3 w-3" />
                            Video Selected
                        </div>
                        {videoPreview && (
                            <div className="w-full h-24 bg-black rounded overflow-hidden">
                                <video src={videoPreview} className="w-full h-full object-contain" />
                            </div>
                        )}
                        <span className="text-[10px] text-slate-500 underline">Change video</span>
                    </div>
                ) : (
                    <>
                        <Upload className="h-5 w-5 text-slate-400" />
                        <span className="text-xs text-slate-500">Click to upload video file</span>
                        <span className="text-[10px] text-slate-400">Max size: 50MB</span>
                    </>
                )}
                <input type="file" ref={videoFileInputRef} className="hidden" accept="video/*" onChange={handleVideoChange} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3E8940] hover:bg-[#3E8940]/90 gap-2" onClick={handleSubmit}>
              {editingId ? <><Save className="h-4 w-4" />Save Changes</> : <><Plus className="h-4 w-4" />Add Video</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
