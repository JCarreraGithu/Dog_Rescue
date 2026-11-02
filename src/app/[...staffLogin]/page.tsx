import { notFound } from "next/navigation";
import { getLoginPath } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

// Renderiza únicamente el alias configurado. Las demás rutas desconocidas siguen en 404.
export default async function StaffLoginPage({ params }: { params: Promise<{ staffLogin: string[] }> }) {
  const { staffLogin } = await params;
  if (`/${staffLogin.join("/")}` !== getLoginPath()) notFound();
  return <LoginForm />;
}
