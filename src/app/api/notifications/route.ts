import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  saveNotifications,
} from "@/lib/notifications";

export async function GET() {
  try {
    const list = await getNotifications();
    return NextResponse.json(list, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const list = await getNotifications();

    if (body.markAllRead) {
      const updated = list.map((n) => ({ ...n, read: true }));
      await saveNotifications(updated);
      return NextResponse.json(updated);
    }

    if (typeof body.id === "string") {
      const updated = list.map((n) =>
        n.id === body.id ? { ...n, read: true } : n
      );
      await saveNotifications(updated);
      return NextResponse.json(updated);
    }

    return NextResponse.json(list);
  } catch (error) {
    console.error("Error al actualizar notificaciones:", error);
    return NextResponse.json(
      { error: "No se pudieron actualizar las notificaciones" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const list = await getNotifications();

    if (id) {
      const filtered = list.filter((n) => n.id !== id);
      await saveNotifications(filtered);
      return NextResponse.json(filtered);
    }

    await saveNotifications([]);
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error al eliminar notificaciones:", error);
    return NextResponse.json(
      { error: "No se pudieron eliminar las notificaciones" },
      { status: 500 }
    );
  }
}
