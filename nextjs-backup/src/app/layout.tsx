// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: " DIGITAL HUB| Computers, Electronics & Repair Services",
  description: "Shop premium laptops, assembled gaming & office desktops, storage SSDs, networking equipment, printers, keyboards, mice, and computer accessories at  DIGITAL HUB. Standard GST invoices, Cash on Delivery, and premium service support.",
  keywords: ["Laptops", "Desktops", "Printers", "Monitors", "SSDs", "Keyboards", "Mice", " DIGITAL HUB", "Kakinada Electronics", "Computer Repair"],
  authors: [{ name: " DIGITAL HUB" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-slate-50 text-slate-900 transition-colors duration-200`}
      >
        <LanguageProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
