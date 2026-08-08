import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { brand, toCssVariables } from "../../config/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${brand.businessName} | Dashboard`,
  description: `${brand.businessName} — ${brand.tagline}`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Brand palette, single source of truth: config/brand.ts */}
        <style>{`:root {\n  ${toCssVariables(brand.colors.light)}\n}`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
