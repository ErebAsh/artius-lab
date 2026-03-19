"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar glass">
      <Link href="/" className="logo">
        ARTIUS LAB
      </Link>
      <div className="nav-links">
        <Link
          href="/"
          style={pathname === "/" ? { color: "var(--accent-light)" } : {}}
        >
          Home
        </Link>
        <Link
          href="/templates"
          style={
            pathname === "/templates" ? { color: "var(--accent-light)" } : {}
          }
        >
          Templates
        </Link>
        <Link
          href="/ats"
          style={pathname === "/ats" ? { color: "var(--accent-light)" } : {}}
        >
          ATS Check
        </Link>
        <Link
          href="/settings"
          style={pathname === "/settings" ? { color: "var(--accent-light)" } : {}}
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}
