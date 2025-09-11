import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Exercise } from "./exercises-page";
import { BodyPart } from "@prisma/client";

interface ExercisesTableColumnsProps {
  onEditExercise: (exercise: Exercise) => void;
}

export function ExercisesTableColumns({ onEditExercise }: ExercisesTableColumnsProps) {
  const columns: ColumnDef<Exercise>[] = [
    {
      accessorKey: "name",
      header: "Exercise Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "type",
      header: "Body Part",
      cell: ({ row }) => {
        const bodyPart = row.getValue("type") as BodyPart;
        return (
          <Badge variant="secondary">
            {bodyPart.replace("_", " ").toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "is_reps_based",
      header: "Type",
      cell: ({ row }) => {
        const isRepsBased = row.getValue("is_reps_based") as boolean;
        return (
          <Badge variant={isRepsBased ? "default" : "outline"}>
            {isRepsBased ? "🏃 Reps-based" : "🏋️ Weight-based"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "youtube_link",
      header: "YouTube Link",
      cell: ({ row }) => {
        const youtubeLink = row.getValue("youtube_link") as string | null;
        return youtubeLink ? (
          <a 
            href={youtubeLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Video
          </a>
        ) : (
          <span className="text-muted-foreground">No video</span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("created_at") as Date;
        return (
          <div className="text-sm text-muted-foreground">
            {new Date(date).toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const exercise = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditExercise(exercise)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Exercise
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return columns;
}