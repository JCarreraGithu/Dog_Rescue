"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export default function PublicShell({ children, loginPath }: { children: React.ReactNode; loginPath: string }) {
  const pathname = usePathname();
  const isInternalRoute =
    pathname === "/admin" ||
    pathname?.startsWith("/admin/") ||
    pathname === "/acceso" ||
    pathname === loginPath ||
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
