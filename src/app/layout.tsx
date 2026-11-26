import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/ui/Navbar";
import { PageTransition } from "@/components/layout/PageTransition";
import { AuthProvider } from "@/components/auth/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeContext";

const THEME_INIT_SCRIPT = `(function(){try{var k="streetwatch-theme";var m=localStorage.getItem(k);if(m!=="light"&&m!=="dark"&&m!=="system"){m="light";}var r=m==="system"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):m;var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(r);d.dataset.theme=r;d.dataset.themeMode=m;d.style.colorScheme=r;}catch(e){}})();`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
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
      <body className="min-h-screen bg-canvas text-slate-900 dark:bg-[#070B14] dark:text-slate-100 antialiased font-sans">
        <a href="#main-content" className="skip-to-content focus:outline-none">
          Skip to main operational content
        </a>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main id="main-content">
              <PageTransition>{children}</PageTransition>
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
