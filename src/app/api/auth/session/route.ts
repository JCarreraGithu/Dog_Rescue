import { staffUnavailable } from "@/lib/staff-response";
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/staff-store";

// Le dice al navegador si hay sesión del personal (para mostrar "Panel" solo a ellos)
// y con qué rol (para ocultar lo que no puede usar). No expone ningún dato sensible.
async function handleGET(request: Request) {
  const user = await getUserFromRequest(request);
  const response = NextResponse.json(
    user
      ? {
          admin: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
          },
        }
      : { admin: false, user: null }
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: Request) {
  try { return await handleGET(request); }
  catch { return staffUnavailable(); }
}
