"use client";
import { usePathname } from "next/navigation";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Hide global navigation and footer on the dedicated builder page
  const hideLayout = pathname === "/builder";

  if (hideLayout) return null;
  return <>{children}</>;
}
