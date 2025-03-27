"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function ExerciseSearchForm({ defaultValue = "" }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      
      if (searchQuery) {
        params.set("query", searchQuery);
      } else {
        params.delete("query");
      }
      
      // Reset to page 1 when search changes
      params.delete("page");
      
      router.push(`?${params.toString()}`);
    });
  };
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search exercises..."
        className="pl-10 pr-12"
        name="query"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Button 
        type="submit" 
        size="sm" 
        variant="ghost" 
        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7"
        disabled={isPending}
      >
        Search
      </Button>
    </form>
  );
} 