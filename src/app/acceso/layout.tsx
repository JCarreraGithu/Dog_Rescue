import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceso del personal | DOG rescue Guatemala",
  robots: { index: false, follow: false },
};

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
