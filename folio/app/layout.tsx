import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Folio — AI Finance Controller",
  description:
    "Folio ingests, categorizes, reconciles, and flags your books before close.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink">{children}</body>
    </html>
  );
}
