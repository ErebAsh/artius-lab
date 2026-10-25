import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import dynamic from "next/dynamic";

import "./globals.css";
import AuthProvider from "./components/AuthProvider";
import ConditionalLayout from "./components/ConditionalLayout";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ThemeProvider from "./components/ThemeProvider";

// Lazy-load non-critical interactive components to drastically reduce initial bundle size
const AuthModal = dynamic(() => import("./components/AuthModal"));
const Chatbot = dynamic(() => import("./components/Chatbot"));

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
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
          {/* Service Worker Cleanup Script */}
          <Script id="cache-cleanup" strategy="afterInteractive">
            {`
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  for (let registration of registrations) {
                    registration.unregister();
                  }
                });
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
