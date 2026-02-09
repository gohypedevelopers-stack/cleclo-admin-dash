"use client";

import { useState } from "react";
import {
  Plus,
  Play,
  Trash2,
  Edit,
  Upload,
  Video,
  GripVertical,
} from "lucide-react";
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

const videos = [
  {
    id: 1,
    title: "How CLECLO Works",
    thumbnail: "/videos/how-it-works.jpg",
    duration: "1:30",
    views: 12450,
    active: true,
  },
  {
    id: 2,
    title: "Easy Pickup & Delivery",
    thumbnail: "/videos/pickup.jpg",
    duration: "0:45",
    views: 8920,
    active: true,
  },
  {
    id: 3,
    title: "Our Quality Promise",
    thumbnail: "/videos/quality.jpg",
    duration: "2:15",
    views: 5680,
    active: false,
  },
];

export default function VideosPage() {
  const [videoList, setVideoList] = useState(videos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newVideo, setNewVideo] = useState({
    title: "",
    duration: "",
  });

  const toggleVideo = (id: number) => {
    setVideoList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, active: !v.active } : v)),
    );
  };

  const handleAddVideo = () => {
    if (!newVideo.title) return;

    const newId = Math.max(...videoList.map((v) => v.id)) + 1;
    setVideoList((prev) => [
      ...prev,
      {
        id: newId,
        title: newVideo.title,
        thumbnail: "/videos/placeholder.jpg",
        duration: newVideo.duration || "0:00",
        views: 0,
        active: true,
      },
    ]);
    setNewVideo({ title: "", duration: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl text-black font-bold tracking-tight">
            Videos
          </h1>
          <p className="text-slate-500 mt-1">
            Manage explainer videos and thumbnails
          </p>
        </div>
        <Button
          className="gap-2 bg-[#3E8940] hover:bg-[#3E8940]/80"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Video
        </Button>
      </div>

      {/* Video List */}
      <div className="bg-white rounded-xl shadow-sm border divide-y">
        {videoList.map((video) => (
          <div key={video.id} className="p-4 flex items-center gap-4">
            <GripVertical className="h-5 w-5 text-slate-300 cursor-grab" />

            {/* Thumbnail */}
            <div className="w-32 h-20 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
              <Video className="h-8 w-8 text-slate-400" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                  <Play className="h-5 w-5 text-slate-900 ml-0.5" />
                </div>
              </div>
              <Badge className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] border-none">
                {video.duration}
              </Badge>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-black">{video.title}</h3>
                {!video.active && (
                  <Badge className="bg-slate-100 text-slate-600 border-none text-xs">
                    Hidden
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {video.views.toLocaleString()} views
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Switch
                checked={video.active}
                onCheckedChange={() => toggleVideo(video.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-slate-700"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload New */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
            <Upload className="h-6 w-6 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-700">Upload New Video</p>
            <p className="text-sm text-slate-500">
              MP4, WebM up to 50MB or paste YouTube link
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Choose File
          </Button>
        </div>
      </div>

      {/* Add Video Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Video</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Video Title</Label>
              <Input
                placeholder="e.g., How to use the app"
                value={newVideo.title}
                onChange={(e) =>
                  setNewVideo({ ...newVideo, title: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                placeholder="e.g., 2:30"
                value={newVideo.duration}
                onChange={(e) =>
                  setNewVideo({ ...newVideo, duration: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Video upload is disabled in demo mode
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#3E8940] hover:bg-[#3E8940]/90"
              onClick={handleAddVideo}
            >
              Add Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
