import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayúdanos comprando | DOG Rescue Guatemala",
  description: "Camisas, tazas y más para apoyar a los perritos rescatados por DOG Rescue Guatemala.",
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
