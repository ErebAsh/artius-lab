import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import AuthModal from "./components/AuthModal";
import AuthProvider from "./components/AuthProvider";
import Chatbot from "./components/Chatbot";
import ConditionalLayout from "./components/ConditionalLayout";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ThemeProvider from "./components/ThemeProvider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artius Lab — AI-Powered Resume Builder",
  description:
    "Craft stunning, ATS-optimized resumes with AI. Choose from premium templates, fill your details, and let AI refine your professional narrative.",
  keywords: ["resume builder", "AI resume", "professional resume", "ATS optimized"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ThemeProvider>
          <AuthProvider>
          {/* Service Worker Cache Purge Script */}
          <Script id="cache-buster" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for (let registration of registrations) {
                    console.log('Unregistering stale service worker:', registration);
                    registration.unregister();
                  }
                });
              }
              // Force clear storage if a version mismatch occurs
              const VERSION = "1.0.1"; 
              const savedVersion = localStorage.getItem("artius_app_version");
              if (savedVersion !== VERSION) {
                console.log("App version mismatch, clearing cache...");
                // localStorage.clear(); // Only if really necessary
                localStorage.setItem("artius_app_version", VERSION);
                window.location.reload();
              }
            `}
          </Script>
          {/* Background Orbs */}
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />

          <ConditionalLayout>
            <Navbar />
          </ConditionalLayout>

          <main style={{ position: "relative", flex: 1 }}>{children}</main>

          <ConditionalLayout>
            <Footer />
          </ConditionalLayout>

          {/* Global Auth Modal */}
          <AuthModal />
          
          {/* Global Support Chatbot */}
          <Chatbot />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
