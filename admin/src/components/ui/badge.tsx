"use client";

import { cn } from "@/lib/utils";
import React from "react";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "dark" | "gray" | "light" | "warning" | "danger" | "success" | "info";
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
  };

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium text-center",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
