import type { Metadata } from "next";
import "./globals.css";

import { AppDataProvider } from "@/lib/appData";
import { LanguageProvider } from "@/lib/i18n";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

import { BRAND } from "@/lib/config";

export const metadata: Metadata = {
  title: `${BRAND.name} — Leave your bags. Explore Uzbekistan.`,
  description:
    "Secure luggage storage near the places you want to visit in Samarkand. Book online in minutes, pay securely, and pick up with a QR code.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen flex flex-col bg-cream text-ink font-sans antialiased selection:bg-brand-500/20 selection:text-brand-900">
        <LanguageProvider>
          <AppDataProvider>
            <Navbar />

            <main className="flex-1 pb-20 sm:pb-0">
              {children}
            </main>

            <Footer />
            <MobileBottomNav />
          </AppDataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}