"use client";
import { useState, useMemo, useCallback, useRef, ReactNode } from "react";
import { BodyPart } from "@prisma/client";

import { useExerciseList } from "@/hooks/use-exercise-list";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ExerciseCardProps {
  id: string;
  name: string;
  youtube_link: string | null;
  type: BodyPart;
  is_reps_based: boolean; // NEW: Indicates if exercise is reps-based
  onPick: (payload: {
    name: string;
    bodyPart: BodyPart;
    listExerciseId: string;
    thumbnail: string | null;
    instructions: string;
    isRepsBased: boolean; // NEW: Include reps-based flag
  }) => void;
}

/**
 * Extract the 11-character YouTube video ID from a URL.
 */
function getYoutubeId(url: string): string | undefined {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/
  );
  return match ? match[1] : undefined;
}

function ExerciseCard({ id, name, youtube_link, type, is_reps_based, onPick }: ExerciseCardProps) {
  const videoId = youtube_link ? getYoutubeId(youtube_link) : undefined;
  const thumbnail = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : undefined;

  return (
    <Card
      key={id}
      className="flex items-center gap-4 p-3 hover:shadow-sm transition-shadow"
    >
      {/* Thumbnail */}
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt={name}
          className="h-14 w-24 rounded object-cover"
        />
      ) : (
        <div className="h-14 w-24 rounded bg-muted" />
      )}
      {/* Details */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {name}
        </p>
        <div className="flex gap-1">
          <Badge variant="secondary" className="w-fit text-[10px]">
            {type}
          </Badge>
          {is_reps_based && (
            <Badge variant="outline" className="w-fit text-[10px] bg-blue-50 text-blue-700 border-blue-200">
              🏃 Reps-based
            </Badge>
          )}
        </div>
      </div>
      <SheetClose asChild>
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8 p-0 text-strentor-blue"
          onClick={(e) => {
            e.stopPropagation();
            onPick({
              name,
              bodyPart: type,
              listExerciseId: id,
              thumbnail: thumbnail ?? null,
              instructions: "",
              isRepsBased: is_reps_based, // NEW: Include reps-based flag
            });
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </SheetClose>
    </Card>
  );
}

interface ExerciseDrawerProps {
  /**
   * Optional custom element that acts as the opener. Useful when you want the
   * trigger to live inside another card instead of the fixed top-right button.
   */
  trigger?: ReactNode;
  onPick: (payload: {
    name: string;
    bodyPart: BodyPart;
    listExerciseId: string;
    thumbnail: string | null;
    instructions: string;
    isRepsBased: boolean; // NEW: Include reps-based flag
  }) => void;
}

export function ExerciseDrawer({ trigger, onPick }: ExerciseDrawerProps) {
  const { options, isLoading } = useExerciseList();

  /* -------------------- Filter & Search State -------------------- */
  type FilterBodyPart = "ALL" | BodyPart;
  const [selectedPart, setSelectedPart] = useState<FilterBodyPart>("ALL");
  const [query, setQuery] = useState("");

  /* -------------------- Pagination / Infinite Scroll ------------- */
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);

  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, loadMore]
  );

  /* -------------------- Derived Exercises ------------------------ */
  const filtered = useMemo(() => {
    return options.filter((ex) => {
      const matchesPart =
        selectedPart === "ALL" || ex.type === selectedPart;
      const matchesQuery = ex.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesPart && matchesQuery;
    });
  }, [options, selectedPart, query]);

  const visibleExercises = filtered.slice(0, visibleCount);

  /* -------------------- Render ----------------------------------- */
  const bodyPartValues: FilterBodyPart[] = [
    "ALL",
    ...(Object.values(BodyPart) as BodyPart[]),
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="outline"
            className="fixed top-16 right-16 z-50"
          >
            Browse Exercises
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-4 w-[420px]">
        <SheetHeader>
          <SheetTitle>Exercise Library</SheetTitle>
          <SheetDescription>Select and add exercises to your plan.</SheetDescription>
        </SheetHeader>

        {/* Filter + Search */}
        <div className="flex items-center gap-2">
          <Select
            value={selectedPart}
            onValueChange={(val) => {
              setSelectedPart(val as FilterBodyPart);
              setVisibleCount(PAGE_SIZE); // reset pagination when filter changes
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ALL" />
            </SelectTrigger>
            <SelectContent>
              {bodyPartValues.map((part) => (
                <SelectItem key={part} value={part} className="capitalize">
                  {part === "ALL" ? "All" : part.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search exercise name"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            className="flex-1"
          />
        </div>

        {/* Exercise List */}
        <div
          className={cn(
            "flex-1 overflow-y-auto space-y-3 pr-1",
            isLoading && "animate-pulse"
          )}
        >
          {visibleExercises.map((ex, idx) => {
            const isLast = idx === visibleExercises.length - 1;
            return (
              <div
                key={ex.id}
                ref={isLast ? lastItemRef : undefined}
                className="first:mt-0"
              >
                <ExerciseCard {...ex} onPick={onPick} />
              </div>
            );
          })}
          {/* Empty state */}
          {!isLoading && visibleExercises.length === 0 && (
            <p className="text-center text-sm text-muted-foreground mt-10">
              No exercises found.
            </p>
          )}
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
