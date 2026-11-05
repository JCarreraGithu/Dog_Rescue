import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayúdanos comprando | DOG rescue Guatemala",
  description: "Camisas, tazas y más para apoyar a los perritos rescatados por DOG rescue Guatemala.",
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
