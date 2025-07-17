"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
  exerciseName: string;
}

export default function YouTubeModal({ 
  isOpen, 
  onClose, 
  videoUrl, 
  exerciseName 
}: YouTubeModalProps) {
  // Extract YouTube video ID from URL
  const getYoutubeId = (url: string): string | null => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  };

  const videoId = videoUrl ? getYoutubeId(videoUrl) : null;

  if (!videoId) return null;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg font-semibold pr-8">
            {exerciseName} - Video Tutorial
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full">
          {/* 16:9 Aspect Ratio Container */}
          <div className="relative w-full pb-[56.25%] h-0">
            <iframe
              src={embedUrl}
              title={`${exerciseName} video tutorial`}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          </div>
        </div>

        {/* Mobile-friendly close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors md:hidden"
          aria-label="Close video"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
