import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso del personal | DOG Rescue Guatemala",
  robots: { index: false, follow: false },
};

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
