import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthProvider } from "@/components/auth/AuthContext";

export const metadata: Metadata = {
  title: "StreetWatch — Civic Action & AI Prioritization Platform",
  description:
    "Autonomous civic issue reporting, community verification, explainable AI prioritization, and multi-step resolution platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-canvas text-slate-900 antialiased font-sans">
        <a href="#main-content" className="skip-to-content focus:outline-none">
          Skip to main operational content
        </a>
        <AuthProvider>
          <Navbar />
          <main id="main-content">
            <PageTransition>{children}</PageTransition>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
