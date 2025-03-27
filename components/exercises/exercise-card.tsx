"use client";

import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tables } from "@/utils/supabase/types";

interface ExerciseCardProps {
  exercise: Tables<"exercise">;
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="p-6">
        <h3 className="text-lg font-bold mb-3">{exercise.name}</h3>
        
        {exercise.youtube_link ? (
          <a 
            href={exercise.youtube_link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-red-600 hover:underline text-sm flex items-center gap-1 mb-3"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Watch tutorial
          </a>
        ) : (
          <span className="text-muted-foreground text-sm block mb-3">No tutorial available</span>
        )}
        
        <div className="text-muted-foreground text-xs">
          Added on {new Date(exercise.created_at || "").toLocaleDateString()}
        </div>
      </div>
      
      <div className="border-t p-3 flex justify-end">
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </div>
    </div>
  );
} 