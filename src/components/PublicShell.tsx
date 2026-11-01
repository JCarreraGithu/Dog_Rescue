"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInternalHost, setIsInternalHost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname.toLowerCase();
      if (h.startsWith("interno.")) {
        setIsInternalHost(true);
      }
    }
  }, []);

  const isInternalRoute =
    isInternalHost ||
    pathname === "/admin" ||
    pathname?.startsWith("/admin/") ||
    pathname === "/acceso" ||
    pathname?.startsWith("/acceso-");

  if (isInternalRoute) {
    return <main className="flex-grow min-h-screen bg-slate-100">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
