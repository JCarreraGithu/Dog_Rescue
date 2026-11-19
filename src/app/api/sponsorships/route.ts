import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addNotification } from "@/lib/notifications";
import { checkContentAccess } from "@/lib/content-auth";
import { sponsorshipRequestInclude, sponsorshipView, getSponsorshipRequests } from "@/lib/intake-store";
import { body, choice, id, text, IntakeError } from "@/lib/intake-validation";
import { intakeFailure, intakeHeaders as headers } from "@/lib/intake-response";

export const dynamic = "force-dynamic";
const SPONSORSHIP_STATUSES = ["Pendiente", "Contactado", "En seguimiento", "Concretado", "Cerrado"] as const;

export async function GET(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/sponsorships");
    if (denied) return denied;
    return NextResponse.json(await getSponsorshipRequests(), { headers });
  } catch (error) {
    return intakeFailure(error);
  }
}

export async function POST(request: Request) {
  try {
    const data = await body(request);
    const dogId = id(data.dogId);
    const sponsorName = text(data.sponsorName);
    const sponsorPhone = text(data.sponsorPhone);
    const sponsorEmail = text(data.sponsorEmail);
    const message = text(data.message);

    if (sponsorName.length < 2 || sponsorName.length > 150 || sponsorPhone.length < 7 || sponsorPhone.length > 30) {
      throw new IntakeError("Escribe tu nombre y un número de teléfono válido.");
    }
    if (sponsorEmail.length > 254 || (sponsorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail))) {
      throw new IntakeError("Escribe un correo electrónico válido.");
    }
    if (message.length > 500) throw new IntakeError("El mensaje no puede tener más de 500 caracteres.");

    const result = await prisma.$transaction(async (tx) => {
      const dog = await tx.dog.findFirst({ where: { id: dogId, isDeleted: false, isArchived: false, status: "En Adopción" } });
      if (!dog) throw new IntakeError("Este perrito ya no está disponible en el catálogo.", 404);
      const row = await tx.sponsorshipRequest.create({
        data: {
          dogId: dog.id,
          dogSnapshot: { id: dog.id, name: dog.name, photoUrl: dog.photoUrl },
          sponsorName,
          sponsorPhone,
          sponsorEmail,
          message,
        },
        include: sponsorshipRequestInclude,
      });
      await addNotification({
        type: "sponsorship",
        title: "Quieren apadrinar a " + dog.name,
        message: sponsorName + " quiere apadrinar a " + dog.name + ". Teléfono: " + sponsorPhone + (sponsorEmail ? " • Correo: " + sponsorEmail : ""),
        targetTab: "sponsorships",
        metadata: { sponsorshipRequestId: row.id, dogId: dog.id, dogName: dog.name, sponsorName, sponsorPhone },
      }, tx);
      return sponsorshipView(row);
    });
    return NextResponse.json(result, { status: 201, headers });
  } catch (error) {
    return intakeFailure(error);
  }
}

export async function PUT(request: Request) {
  try {
    const denied = await checkContentAccess(request, "/api/sponsorships");
    if (denied) return denied;
    const data = await body(request);
    const requestId = id(data.id);
    const status = choice(data.status, SPONSORSHIP_STATUSES);
    const row = await prisma.sponsorshipRequest.update({ where: { id: requestId }, data: { status }, include: sponsorshipRequestInclude });
    return NextResponse.json(sponsorshipView(row), { headers });
  } catch (error) {
    return intakeFailure(error);
  }
}
