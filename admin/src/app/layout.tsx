import "@/css/satoshi.css";
import "@/css/style.css";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Pizza&PastaInn Admin",
    default: "Pizza&PastaInn Admin",
  },
  description:
    "Trang quản trị hệ thống Pizza&PastaInn — quản lý thực đơn, đơn hàng, khách hàng.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&subset=vietnamese&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          {children}

          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
