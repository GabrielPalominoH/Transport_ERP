"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number; // Optional for display text
  totalItems?: number; // Optional for display text
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationControlsProps) {
  const startItem = itemsPerPage && totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = itemsPerPage && totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  if (totalPages <= 0 && totalItems === 0) {
     return <p className="py-4 text-sm text-muted-foreground">No entries found.</p>;
  }
   if (totalPages <= 1 && totalItems !== undefined && totalItems <= (itemsPerPage ?? 10) ) {
     return <p className="py-4 text-sm text-muted-foreground">Showing {totalItems} {totalItems === 1 ? "entry" : "entries"}.</p>;
  }


  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      {itemsPerPage && totalItems !== undefined && totalItems > 0 && (
         <p className="text-sm text-muted-foreground">
           Showing {startItem} to {endItem} of {totalItems} entries
         </p>
      )}
       {itemsPerPage && totalItems === 0 && (
         <p className="text-sm text-muted-foreground">No entries found.</p>
       )}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          <span className="text-sm tabular-nums">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
