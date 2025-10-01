import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AIProvider } from "@/contexts/ai-context";
import { ThemeProvider } from "@/contexts/theme-context";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Controlled Application",
  description: "A fully AI-controlled web application built with Next.js and Gemini AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AIProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <div className="min-h-screen">
                <main>
                  {children}
                </main>
              </div>
            </ErrorBoundary>
          </ThemeProvider>
        </AIProvider>
      </body>
    </html>
  );
}
