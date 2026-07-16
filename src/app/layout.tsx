import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Fraunces, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const displayFace = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-face",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Bid for Beauty: Beauty jobs, bid on by pros",
    template: "%s · Bid for Beauty",
  },
  description:
    "Post a beauty job, compare bids from vetted hair, nail, makeup and skincare professionals, and book the right fit for your budget.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${displayFace.variable}`}>
      <body className="bg-paper text-ink antialiased">
        {children}
        <Providers />
      </body>
    </html>
  );
}
