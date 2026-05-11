"use client";

import { cn } from "@/lib/utils";
import React from "react";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-stroke bg-white px-2 py-2 shadow-sm dark:border-dark-3 dark:bg-gray-dark",
        className
      )}
    >
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="flex h-8 items-center justify-center rounded bg-[#F4F7FF] px-3 text-sm font-medium text-dark transition hover:bg-gray-200 disabled:opacity-50 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
      >
        Trước
      </button>

      {pages.map((p, index, array) => (
        <React.Fragment key={p}>
          {index > 0 && p - array[index - 1] > 1 && (
            <span className="flex h-8 items-end justify-center px-1 text-gray-400">...</span>
          )}
          <button
            onClick={() => onPageChange(p)}
            className={cn(
              "flex size-8 items-center justify-center rounded text-sm font-medium transition",
              currentPage === p
                ? "bg-primary text-white"
                : "text-dark hover:bg-[#F4F7FF] dark:text-white dark:hover:bg-dark-3"
            )}
          >
            {p}
          </button>
        </React.Fragment>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="flex h-8 items-center justify-center rounded bg-[#F4F7FF] px-3 text-sm font-medium text-dark transition hover:bg-gray-200 disabled:opacity-50 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-2"
      >
        Sau
      </button>
    </div>
  );
}
