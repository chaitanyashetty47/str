"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

export function Pagination({ totalPages, currentPage }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };
  
  const goToPage = (pageNumber: number) => {
    router.push(createPageURL(pageNumber));
  };
  
  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Create page buttons */}
      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
        // For more than 5 pages, show first, last, current and surrounding pages
        let pageNumber: number;
        
        if (totalPages <= 5) {
          pageNumber = i + 1;
        } else {
          // Complex logic for when there are more than 5 pages
          const middlePoint = Math.min(
            Math.max(currentPage, 3),
            totalPages - 2
          );
          
          if (i === 0) pageNumber = 1;
          else if (i === 1) pageNumber = middlePoint - 1;
          else if (i === 2) pageNumber = middlePoint;
          else if (i === 3) pageNumber = middlePoint + 1;
          else pageNumber = totalPages;
          
          // Adjust for when current page is near start or end
          if (currentPage <= 2) pageNumber = i + 1;
          if (currentPage >= totalPages - 1) pageNumber = totalPages - 4 + i;
        }
        
        const isCurrentPage = pageNumber === currentPage;
        
        return (
          <Button
            key={pageNumber}
            variant={isCurrentPage ? "default" : "outline"}
            onClick={() => goToPage(pageNumber)}
          >
            {pageNumber}
          </Button>
        );
      })}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 