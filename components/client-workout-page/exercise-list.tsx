import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { ExerciseDetail } from "@/actions/client-workout/client-full-workout.action";
import YouTubeModal from "./youtube-modal";
import { useState } from "react";

interface ExerciseListProps {
  exercises: ExerciseDetail[];
}

export default function ExerciseList({ exercises }: ExerciseListProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    videoUrl: string | null;
    exerciseName: string;
  }>({
    isOpen: false,
    videoUrl: null,
    exerciseName: "",
  });

  const openVideoModal = (videoUrl: string, exerciseName: string) => {
    setModalState({
      isOpen: true,
      videoUrl,
      exerciseName,
    });
  };

  const closeVideoModal = () => {
    setModalState({
      isOpen: false,
      videoUrl: null,
      exerciseName: "",
    });
  };

  if (exercises.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No exercises scheduled for this day
      </div>
    );
  }

  // Calculate total volume for an exercise (sum of weight × reps for all sets)
  const calculateTotalVolume = (exercise: ExerciseDetail): number => {
    return exercise.sets.reduce((total, set) => {
      const weight = parseFloat(set.weight) || 0;
      const reps = parseFloat(set.reps) || 0;
      return total + (weight * reps);
    }, 0);
  };

  // Extract YouTube video ID from URL
  const getYoutubeId = (url: string): string | undefined => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/
    );
    return match ? match[1] : undefined;
  };

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {exercises.map((exercise, index) => {
          const totalVolume = calculateTotalVolume(exercise);
          const totalSets = exercise.sets.length;
          const youtubeId = exercise.youtubeLink ? getYoutubeId(exercise.youtubeLink) : undefined;
          const youtubeThumbnail = youtubeId 
            ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` 
            : null;

          return (
            <AccordionItem key={exercise.listExerciseId} value={`exercise-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-left">
                      {exercise.name}
                    </span>
                    {/* You can add PR badge here if needed in future */}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{totalSets} sets</span>
                    <span>{totalVolume.toFixed(0)} kg total volume</span>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent>
                <div className="space-y-4 pt-4">
                  {/* Sets Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Set</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Reps</TableHead>
                        {/* <TableHead className="w-16">RPE</TableHead> */}
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {exercise.sets.map((set) => (
                        <TableRow key={set.setNumber}>
                          <TableCell className="font-medium">
                            {set.setNumber}
                          </TableCell>
                          <TableCell>
                            {set.weight ? `${set.weight} kg` : '-'}
                          </TableCell>
                          <TableCell>
                            {set.reps || '-'}
                          </TableCell>
                          {/* <TableCell> */}
                            {/* RPE can be calculated from notes or separate field */}
                            {/* - */}
                          {/* </TableCell> */}
                          <TableCell className="text-muted-foreground">
                            {set.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Exercise Instructions with YouTube Thumbnail */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                        <p className="text-sm text-muted-foreground">
                          {exercise.instructions || "No instructions for this exercise"}
                        </p>
                      </div>
                      
                      {/* YouTube Thumbnail */}
                      {youtubeThumbnail && exercise.youtubeLink && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => openVideoModal(exercise.youtubeLink!, exercise.name)}
                            className="block hover:opacity-80 transition-opacity group focus:outline-none focus:ring-2 focus:ring-strentor-orange focus:ring-offset-2 rounded-md"
                          >
                            <div className="relative">
                              <img
                                src={youtubeThumbnail}
                                alt={`${exercise.name} video tutorial`}
                                className="w-20 h-15 sm:w-24 sm:h-18 md:w-28 md:h-21 lg:w-32 lg:h-24 rounded-md object-cover border border-border"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-md group-hover:bg-black/30 transition-colors">
                                <Play className="w-4 h-4 text-white fill-white" />
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* YouTube Modal */}
      <YouTubeModal
        isOpen={modalState.isOpen}
        onClose={closeVideoModal}
        videoUrl={modalState.videoUrl}
        exerciseName={modalState.exerciseName}
      />
    </div>
  );
}