"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";


const ThemeContext = createContext({
  settings: {
    theme: "creamy",
    accentColor: "#10b981",
    backgroundColor: "",
    surfaceColor: "",
    showBackgroundOrbs: true,
    renderMode: "html",
    selectedCategory: "All",
    // Expanded settings from Settings page
    density: "comfortable",
    glassBlur: 20,
    glassOpacity: 0.7,
    fontFamily: "sans",
    language: "en",
    autoSave: true,
    aiEnabled: true,
    aiCreativity: "balanced",
    experimental: false,
    defaultTemplate: "modern",
    exportFormat: "pdf",
  },
  updateSettings: (newSettings: any) => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    theme: "creamy",
    accentColor: "#10b981",
    backgroundColor: "",
    surfaceColor: "",
    showBackgroundOrbs: true,
    renderMode: "html",
    selectedCategory: "All",
    // Expanded settings from Settings page
    density: "comfortable",
    glassBlur: 20,
    glassOpacity: 0.7,
    fontFamily: "sans",
    language: "en",
    autoSave: true,
    aiEnabled: true,
    aiCreativity: "balanced",
    experimental: false,
    defaultTemplate: "modern",
    exportFormat: "pdf",
  });

  const { user, token } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load from LocalStorage first (for instant feedback)
  useEffect(() => {
    const saved = localStorage.getItem("artius_settings");
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {}
    }
  }, []);

  // Fetch from Database when logged in
  useEffect(() => {
    if (user && token) {
      fetch(`${API_BASE}/api/user/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data && !data.detail) {
             setSettings(prev => {
               const updated = { ...prev, ...data };
               localStorage.setItem("artius_settings", JSON.stringify(updated));
               return updated;
             });
          }
        })
        .catch((err) => console.error("Failed to fetch UI settings:", err))
        .finally(() => setIsInitialLoad(false));
    } else {
      setIsInitialLoad(false);
    }
  }, [user, token]);


  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    
    if (settings.accentColor) {
      root.style.setProperty("--accent", settings.accentColor);
      root.style.setProperty("--accent-light", `${settings.accentColor}dd`);
      root.style.setProperty("--accent-dark", `${settings.accentColor}aa`);
      root.style.setProperty("--glow", `${settings.accentColor}10`);
    }

    if (settings.backgroundColor) {
      root.style.setProperty("--background", settings.backgroundColor);
    } else {
      root.style.removeProperty("--background");
    }

    if (settings.surfaceColor) {
      root.style.setProperty("--surface", settings.surfaceColor);
    } else {
      root.style.removeProperty("--surface");
    }

    // Toggle background orbs
    const orbs = document.querySelectorAll('.bg-orb');
    orbs.forEach(orb => {
      (orb as HTMLElement).style.display = settings.showBackgroundOrbs ? 'block' : 'none';
    });

  }, [settings]);

  const updateSettings = useCallback((newSettings: any) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      // Update LocalStorage
      localStorage.setItem("artius_settings", JSON.stringify(updated));

      // Update Database if logged in
      if (user && token) {
        fetch(`${API_BASE}/api/user/settings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updated),
        }).catch((err) => console.error("Failed to save UI settings:", err));
      }
      
      return updated;
    });
  }, [user, token]);


  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}
