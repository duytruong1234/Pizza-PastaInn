import type { Metadata } from "next";
import "./checkout.css";

export const metadata: Metadata = {
  title: "Thanh toán - Pizza & Pasta Inn",
  description: "Thanh toán đơn hàng Pizza & Pasta Inn",
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
