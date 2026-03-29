"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/modifier", label: "Modifier" },
  { href: "/ats", label: "ATS Check" },
  { href: "/resumes", label: "My Resumes" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, setShowAuthModal } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.trim().split(" ").map(w => w[0]).slice(0, 2).join("");
    }
    return email[0] || "U";
  };

  return (
    <nav className={`navbar glass ${user ? "logged-in" : ""}`}>
      <Link href="/" className="logo">
        ARTIUS LAB
      </Link>
      <div className="nav-links">
        {NAV_LINKS.filter(link => {
          // If logged in, hide links that are already in the dropdown
          if (user && (link.href === "/resumes" || link.href === "/settings")) {
            return false;
          }
          return true;
        }).map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={pathname === link.href ? { color: "var(--accent-light)" } : {}}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth section */}
      <div className="nav-user-section" ref={dropdownRef}>
        {user ? (
          <>
            <div
              className="nav-user-avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={user.full_name || user.email}
            >
              {getInitials(user.full_name, user.email)}
            </div>

            {dropdownOpen && (
              <div className="nav-user-dropdown">
                <div className="nav-user-dropdown-info">
                  <div className="nav-user-dropdown-name">
                    {user.full_name || "User"}
                  </div>
                  <div className="nav-user-dropdown-email">{user.email}</div>
                </div>
                <Link
                  href="/resumes"
                  className="nav-user-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  My Resumes
                </Link>
                <Link
                  href="/settings"
                  className="nav-user-dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </Link>
                <button
                  className="nav-user-dropdown-item danger"
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            className="nav-login-btn"
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
