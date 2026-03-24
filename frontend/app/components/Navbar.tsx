"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <nav className="navbar glass">
      <Link href="/" className="logo">
        ARTIUS LAB
      </Link>
      <div className="nav-links">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={pathname === link.href ? { color: "var(--accent-light)" } : {}}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
