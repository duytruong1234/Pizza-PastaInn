import type { Metadata } from "next";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Checkout - Pizza & Pasta Inn",
  description: "Checkout your Pizza & Pasta Inn order",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
