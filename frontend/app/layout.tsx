import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pizza & Pasta Inn — Thực đơn Pizza & Mì Ý chuẩn vị",
  description: "Đặt bánh Pizza nướng củi, Mì Ý, Gratin và Combo giao nhanh tận nơi tại Pizza & Pasta Inn.",
};

import { UIProvider } from "@/components/UIProvider";
import QuickDock from "@/components/QuickDock";
import SmartQuizModal from "@/components/SmartQuizModal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${inter.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans overflow-x-hidden">
        <UIProvider>
          {children}
          <QuickDock />
          <SmartQuizModal />
        </UIProvider>
      </body>
    </html>
  );
}
