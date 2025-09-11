"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Upload, 
  ExternalLink, 
  CheckCircle, 
  Clock,
  MessageSquare,
  User
} from "lucide-react";
import { uploadWorkoutVideo } from "@/actions/client-workout/upload-workout-video.action";
import { toast } from "sonner";
import { format } from "date-fns";

interface WorkoutVideoUploadProps {
  workoutDayId: string;
  existingVideo?: {
    id: string;
    videoUrl: string;
    videoTitle: string | null;
    uploadedAt: Date;
    reviewedAt: Date | null;
    trainerNotes: string | null;
  };
  onVideoUploaded?: () => void;
}

export function WorkoutVideoUpload({ 
  workoutDayId, 
  existingVideo, 
  onVideoUploaded 
}: WorkoutVideoUploadProps) {
  const [videoUrl, setVideoUrl] = useState(existingVideo?.videoUrl || "");
  const [videoTitle, setVideoTitle] = useState(existingVideo?.videoTitle || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!existingVideo);

  const handleUpload = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadWorkoutVideo({
        workoutDayId,
        videoUrl: videoUrl.trim(),
        videoTitle: videoTitle.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.data?.message || "Video uploaded successfully");
        onVideoUploaded?.();
        setIsExpanded(false);
      }
    } catch (error) {
      toast.error("Failed to upload video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!videoUrl.trim()) {
      toast.error("Please enter a video URL");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadWorkoutVideo({
        workoutDayId,
        videoUrl: videoUrl.trim(),
        videoTitle: videoTitle.trim() || undefined,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.data?.message || "Video updated successfully");
        onVideoUploaded?.();
      }
    } catch (error) {
      toast.error("Failed to update video. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-strentor-red" />
            <span className="font-medium">Workout Video</span>
            {existingVideo && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                Uploaded
              </Badge>
            )}
          </div>
          {existingVideo && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Collapse" : "Edit"}
            </Button>
          )}
        </div>

        {existingVideo && !isExpanded && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              Uploaded: {format(new Date(existingVideo.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
            </div>
            
            {existingVideo.videoTitle && (
              <div className="text-sm font-medium">{existingVideo.videoTitle}</div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(existingVideo.videoUrl, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Video
              </Button>
            </div>

            {existingVideo.reviewedAt && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Trainer Review</span>
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Reviewed
                  </Badge>
                </div>
                <div className="text-sm text-blue-700">
                  {existingVideo.trainerNotes || "No specific feedback provided."}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Reviewed: {format(new Date(existingVideo.reviewedAt), "MMM d, yyyy 'at' h:mm a")}
                </div>
              </div>
            )}
          </div>
        )}

        {isExpanded && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                placeholder="https://drive.google.com/file/d/..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Paste your Google Drive, Dropbox, or other cloud storage link
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="videoTitle">Video Title (Optional)</Label>
              <Input
                id="videoTitle"
                placeholder="e.g., Back Day Workout"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                disabled={isUploading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={existingVideo ? handleUpdate : handleUpload}
                disabled={isUploading || !videoUrl.trim()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : existingVideo ? "Update Video" : "Upload Video"}
              </Button>
              
              {existingVideo && (
                <Button
                  variant="outline"
                  onClick={() => setIsExpanded(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}