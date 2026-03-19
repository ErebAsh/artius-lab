"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext({
  settings: {
    theme: "dark",
    accentColor: "#6366f1",
    backgroundColor: "",
    surfaceColor: "",
    showBackgroundOrbs: true,
  },
  updateSettings: (newSettings: any) => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState({
    theme: "dark",
    accentColor: "#6366f1",
    backgroundColor: "",
    surfaceColor: "",
    showBackgroundOrbs: true,
  });

  useEffect(() => {
    const saved = localStorage.getItem("artius_settings");
    if (saved) {
      try {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    
    if (settings.accentColor) {
      root.style.setProperty("--accent", settings.accentColor);
      root.style.setProperty("--accent-light", `${settings.accentColor}dd`);
      root.style.setProperty("--accent-dark", `${settings.accentColor}aa`);
      root.style.setProperty("--glow", `${settings.accentColor}44`);
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

  const updateSettings = (newSettings: any) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("artius_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <ThemeContext.Provider value={{ settings, updateSettings }}>
      {children}
    </ThemeContext.Provider>
  );
}
