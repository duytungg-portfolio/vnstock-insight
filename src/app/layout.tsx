import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Navbar } from "@/components/layout/Navbar";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  title: "VNStock Insight — AI-Powered Stock Analysis",
  description:
    "AI-powered fintech dashboard for Vietnamese stock market investors. Smart dashboards, meeting analysis, and sector insights powered by Gemini.",
  openGraph: {
    title: "VNStock Insight — AI-Powered Stock Analysis",
    description:
      "Smart dashboards, meeting analysis, and sector insights for Vietnamese stock market investors.",
    type: "website",
    locale: "vi_VN",
    siteName: "VNStock Insight",
  },
  twitter: {
    card: "summary_large_image",
    title: "VNStock Insight — AI-Powered Stock Analysis",
    description:
      "AI-powered fintech dashboard for Vietnamese stock market investors.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <OfflineBanner />
            <Navbar />
            <main className="flex-1">
              <ErrorBoundary section="Page">{children}</ErrorBoundary>
            </main>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
