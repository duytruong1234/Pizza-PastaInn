"use client";

import { cn } from "@/lib/utils";
import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "dark" | "gray" | "light" | "warning" | "danger" | "success" | "info" | "outlinePrimary" | "outlineSecondary" | "outlineDark" | "outlineGray" | "outlineLight" | "outlineWarning" | "outlineDanger" | "outlineSuccess" | "outlineInfo";
  className?: string;
};

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const variants = {
    primary: "bg-primary text-white", // #5750F1
    secondary: "bg-[#13C296] text-white",
    dark: "bg-dark text-white dark:bg-white/10",
    gray: "bg-[#637381] text-white",
    light: "bg-[#F4F7FF] text-[#5A6A85] dark:bg-dark-3 dark:text-white",
    warning: "bg-[#F9C107] text-dark",
    danger: "bg-[#DC3545] text-white",
    success: "bg-[#219653] text-white",
    info: "bg-[#3BA2B8] text-white",
    outlinePrimary: "border border-primary text-primary bg-transparent",
    outlineSecondary: "border border-[#13C296] text-[#13C296] bg-transparent",
    outlineDark: "border border-dark text-dark dark:border-white/25 dark:text-white bg-transparent",
    outlineGray: "border border-[#637381] text-[#637381] bg-transparent",
    outlineLight: "border border-[#EFEFEF] text-[#212B36] dark:border-dark-3 dark:text-white bg-transparent",
    outlineWarning: "border border-[#F9C107] text-[#F9C107] bg-transparent",
    outlineDanger: "border border-[#DC3545] text-[#DC3545] bg-transparent",
    outlineSuccess: "border border-[#219653] text-[#219653] bg-transparent",
    outlineInfo: "border border-[#3BA2B8] text-[#3BA2B8] bg-transparent",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-center whitespace-nowrap",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
