"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Video, 
  ExternalLink, 
  MessageSquare, 
  Clock, 
  User,
  CheckCircle,
  Eye,
  Send
} from "lucide-react";
import { getWorkoutVideos } from "@/actions/client-workout/get-workout-videos.action";
import { reviewWorkoutVideo } from "@/actions/trainer-clients/review-workout-video.action";
import { toast } from "sonner";
import { format } from "date-fns";

interface RecentWorkoutVideosProps {
  limit?: number;
}

interface VideoData {
  id: string;
  workoutDayId: string;
  clientId: string;
  videoUrl: string;
  videoTitle: string | null;
  uploadedAt: Date;
  reviewedAt: Date | null;
  trainerNotes: string | null;
  workoutDay: {
    id: string;
    title: string;
    dayDate: Date;
    weekNumber: number;
    dayNumber: number;
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
}

export function RecentWorkoutVideos({ limit = 5 }: RecentWorkoutVideosProps) {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    fetchRecentVideos();
  }, []);

  const fetchRecentVideos = async () => {
    try {
      setLoading(true);
      const result = await getWorkoutVideos({});
      
      if (result.error) {
        setError(result.error);
      } else {
        // Sort by upload date (most recent first) and limit
        const sortedVideos = result.data?.videos
          .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
          .slice(0, limit) || [];
        
        setVideos(sortedVideos);
      }
    } catch (err) {
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewVideo = async () => {
    if (!selectedVideo) return;

    setIsReviewing(true);
    try {
      const result = await reviewWorkoutVideo({
        videoId: selectedVideo.id,
        trainerNotes: reviewNotes.trim() || undefined,
        markAsReviewed: true,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Video reviewed successfully");
        setSelectedVideo(null);
        setReviewNotes("");
        fetchRecentVideos(); // Refresh the list
      }
    } catch (err) {
      toast.error("Failed to review video");
    } finally {
      setIsReviewing(false);
    }
  };

  const openVideoModal = (video: VideoData) => {
    setSelectedVideo(video);
    setReviewNotes(video.trainerNotes || "");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-strentor-red" />
            Recent Workout Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-strentor-red"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-strentor-red" />
            Recent Workout Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 py-8">
            Error: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-strentor-red" />
            Recent Workout Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No workout videos uploaded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-strentor-red" />
            Recent Workout Videos ({videos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{video.client.name}</span>
                    <Badge variant="outline">
                      Week {video.workoutDay.weekNumber} - Day {video.workoutDay.dayNumber}
                    </Badge>
                    {video.reviewedAt ? (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reviewed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-1">
                    {video.videoTitle || "Untitled Video"}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Uploaded: {format(new Date(video.uploadedAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(video.videoUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openVideoModal(video)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Review Workout Video</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVideo(null)}
                >
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedVideo.client.name}</span>
                  <Badge variant="outline">
                    Week {selectedVideo.workoutDay.weekNumber} - Day {selectedVideo.workoutDay.dayNumber}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedVideo.videoTitle || "Untitled Video"}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedVideo.videoUrl, '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Video
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reviewNotes">Trainer Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    placeholder="Add feedback, form corrections, or encouragement..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleReviewVideo}
                    disabled={isReviewing}
                    className="flex-1"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isReviewing ? "Reviewing..." : "Submit Review"}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setSelectedVideo(null)}
                    disabled={isReviewing}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}