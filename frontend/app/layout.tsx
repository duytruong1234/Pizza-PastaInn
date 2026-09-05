import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PizzaGenie",
  description: "Delicious Pizza & Pasta - PizzaGenie",
};

import { UIProvider } from "@/components/UIProvider";
import QuickDock from "@/components/QuickDock";
import ChatbotWidget from "@/components/ChatbotWidget";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <UIProvider>
          {children}
          <QuickDock />
          <ChatbotWidget />
        </UIProvider>
      </body>
    </html>
  );
}
