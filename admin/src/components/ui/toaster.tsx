"use client";

import { Toaster as Sonner } from "sonner";
import React from "react";

const SuccessIcon = () => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#10B981] shadow-sm">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.8 11.3 2 22l10.7-3.79" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 3h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 8h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M15 2h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 20h.01" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.91 9 5.52 9 6.23V7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);

const ErrorIcon = () => (
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#EF4444] shadow-sm">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="white"/>
      <path d="M12 8v4" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="16" r="1.5" fill="#EF4444"/>
    </svg>
  </div>
);

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      duration={4000}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group relative flex w-[400px] items-center gap-4 rounded-xl border p-4 shadow-lg !min-h-[80px]",
          title: "text-[16px] font-semibold text-[#1F2937] dark:text-white",
          description: "text-[14px] text-[#6B7280] dark:text-gray-400 mt-1",
          success:
            "border-[#E5E7EB] bg-white dark:border-[#374151] dark:bg-[#111827]",
          error:
            "border-[#FECACA] bg-[#FEF2F2] dark:border-[#7F1D1D] dark:bg-[#450A0A]",
          icon: "m-0 !w-auto !h-auto flex items-center justify-center !bg-transparent",
          content: "flex-1 flex flex-col justify-center",
          closeButton: "!static !order-last !transform-none !m-0 !ml-auto !bg-transparent !border !border-gray-300 hover:!bg-gray-100 dark:hover:!bg-gray-800 rounded-full !w-[26px] !h-[26px] flex items-center justify-center opacity-100 transition !text-gray-500 group-data-[type=error]:!border-red-400 group-data-[type=error]:hover:!bg-red-100 group-data-[type=error]:!text-red-500",
        },
      }}
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
        close: <CloseIcon />,
      }}
    />
  );
}
