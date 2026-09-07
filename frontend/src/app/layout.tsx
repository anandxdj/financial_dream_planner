import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, Kalam, Manrope } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/providers/query-provider";
import { AppThemeProvider } from "@/providers/theme-provider";
import { RouterGuard } from "@/providers/router-guard";
import "./globals.css";

const manrope = Manrope({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Financial Dream Planner — See the trade-offs before you decide",
  description:
    "India-first financial planning with deterministic calculations, what-if scenarios, and a living view of your goals and money.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${dmSerifDisplay.variable} ${kalam.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans bg-canvas text-foreground selection:bg-purple/20">
        <RouterGuard>
          <AppThemeProvider>
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </AppThemeProvider>
        </RouterGuard>
      </body>
    </html>
  );
}
