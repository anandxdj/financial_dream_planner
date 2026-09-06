import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Manrope, Kalam } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AppThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const manrope = Manrope({
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Financial Dream Planner — See the trade-offs before you decide",
  description:
    "India-first living financial plan: canonical money data, deterministic financial mathematics, what-if scenarios, and living plan drift.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${manrope.variable} ${kalam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-[#FFF9F0] text-[#344054] selection:bg-[#E6B46A]/30">
        <AppThemeProvider>
          <QueryProvider>
            {children}
            <Toaster />
          </QueryProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
