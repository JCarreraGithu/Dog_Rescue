import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import PublicShell from "@/components/PublicShell";
import { getLoginPath } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Refugio DOG rescue Guatemala | Amatitlán",
  description: "Organización sin fines de lucro en Amatitlán dedicada al rescate, rehabilitación y adopción responsable de perros.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        <CartProvider>
          <PublicShell loginPath={getLoginPath()}>{children}</PublicShell>
        </CartProvider>
      </body>
    </html>
  );
}
