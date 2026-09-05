// Providers — wraps AuthProvider + ThemeProvider + SidebarProvider
"use client";

import { AuthProvider } from "@/lib/auth-context";
import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { DialogProvider } from "@/components/ui/dialog-provider";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <AuthProvider>
        <SidebarProvider>
          <DialogProvider>{children}</DialogProvider>
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
