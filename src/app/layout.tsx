import type { Metadata } from "next";
import { Montserrat, Bodoni_Moda } from "next/font/google";
import { brand, toCssVariables } from "../../config/brand";
import "./globals.css";

// Body font, per brand board.
const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
});

// Heading font. Stand-in for Bodoni FLF — see the comment in config/brand.ts.
const bodoniModa = Bodoni_Moda({
  variable: "--font-heading",
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
      className={`${montserrat.variable} ${bodoniModa.variable} h-full antialiased`}
    >
      <head>
        {/* Brand palette, single source of truth: config/brand.ts */}
        <style>{`:root {\n  ${toCssVariables(brand.colors.light)}\n}`}</style>
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
