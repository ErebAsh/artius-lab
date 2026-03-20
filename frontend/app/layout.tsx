import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

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

import ThemeProvider from "./components/ThemeProvider";
import ConditionalLayout from "./components/ConditionalLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <ThemeProvider>
          {/* Background Orbs */}
          <div className="bg-orb bg-orb-1" />
          <div className="bg-orb bg-orb-2" />

          <ConditionalLayout>
            <Navbar />
          </ConditionalLayout>

          <main style={{ position: "relative", zIndex: 1, flex: 1 }}>{children}</main>

          <ConditionalLayout>
            <Footer />
          </ConditionalLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
