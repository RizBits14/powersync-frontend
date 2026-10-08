import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/providers/query-provider";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PowerSync | Power Outage Management",
  description: "PowerSync is an intelligent load shedding and power outage management platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${geistSans.className} h-full antialiased`}
    >
      <body>
        <TooltipProvider>
          <QueryProvider>{children}</QueryProvider>
        </TooltipProvider>

        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
