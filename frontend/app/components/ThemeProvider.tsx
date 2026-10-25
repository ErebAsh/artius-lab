"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthProvider";

// Relative path /api/... routed securely via server proxy (no NEXT_PUBLIC_ exposure)
const API_BASE = "";


const defaultSettings = {
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
};

export type ThemeSettings = typeof defaultSettings;

interface ThemeContextType {
  settings: ThemeSettings;
  updateSettings: (newSettings: Partial<ThemeSettings>) => void;
  resetToDefaults: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: defaultSettings,
  updateSettings: () => {},
  resetToDefaults: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaultSettings);
  const { user, token } = useAuth();

  // Load from LocalStorage first (for instant feedback)
  useEffect(() => {
    const saved = localStorage.getItem("artius_settings");
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        // Ignore invalid JSON in localStorage
      }
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
        .catch((err) => console.error("Failed to fetch UI settings:", err));
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

  const updateSettings = useCallback((newSettings: Partial<ThemeSettings>) => {
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


  const resetToDefaults = useCallback(() => {
    const defaults = {
      theme: "creamy",
      accentColor: "#10b981",
      backgroundColor: "",
      surfaceColor: "",
      showBackgroundOrbs: true,
      renderMode: "html",
      selectedCategory: "All",
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
    };
    
    setSettings(defaults);
    localStorage.setItem("artius_settings", JSON.stringify(defaults));

    if (user && token) {
      fetch(`${API_BASE}/api/user/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(defaults),
      }).catch((err) => console.error("Failed to reset UI settings:", err));
    }
  }, [user, token]);

  return (
    <ThemeContext.Provider value={{ settings, updateSettings, resetToDefaults }}>
      {children}
    </ThemeContext.Provider>
  );
}

