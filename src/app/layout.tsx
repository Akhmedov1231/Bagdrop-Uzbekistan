import type { Metadata } from "next";
import "./globals.css";

import { AppDataProvider } from "@/lib/appData";
import { LanguageProvider } from "@/lib/i18n";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
    <html lang="en">
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
          href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body className="min-h-screen flex flex-col bg-cream text-ink font-sans antialiased">
        <LanguageProvider>
          <AppDataProvider>
            <Navbar />

            <main className="flex-1">
              {children}
            </main>

            <Footer />
          </AppDataProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}