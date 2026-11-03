import { NextRequest, NextResponse } from "next/server";
import { getNotifications, markNotificationsRead, deleteNotifications } from "@/lib/notifications";
import { checkContentAccess } from "@/lib/content-auth";
import { NotificationNotFoundError } from "@/lib/content-validation";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
function failure(error: unknown) {
  if (error instanceof NotificationNotFoundError) return NextResponse.json({ error: error.message }, { status: 404, headers });
  return NextResponse.json({ error: "No se pudieron guardar o consultar las notificaciones." }, { status: 503, headers });
}
export async function GET(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/notifications");
    if (denied) return denied;
    return NextResponse.json(await getNotifications(), { headers });
  } catch (error) { return failure(error); }
}
export async function PUT(request: NextRequest) {
  try {
    const denied = await checkContentAccess(request, "/api/notifications");
    if (denied) return denied;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || !(body.markAllRead === true || (typeof body.id === "string" && body.id.trim()))) {
      return NextResponse.json({ error: "Indica una notificación o markAllRead." }, { status: 400, headers });
    }
    return NextResponse.json(await markNotificationsRead(body.markAllRead === true ? undefined : body.id), { headers });
  } catch (error) { return failure(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    const denied = await checkContentAccess(request, "/api/notifications");
    if (denied) return denied;
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (params.has("id") && !id?.trim()) return NextResponse.json({ error: "ID de notificación no válido." }, { status: 400, headers });
    return NextResponse.json(await deleteNotifications(id ?? undefined), { headers });
  } catch (error) { return failure(error); }
}
