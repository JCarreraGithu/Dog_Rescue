import fs from "fs/promises";
import path from "path";
import { DEFAULT_DOGS, DemoDog } from "@/data/default-dogs";
import { getApplications, getVolunteers, getReports, getOrders } from "@/lib/intake-store";

const DATA_DIR = path.join(process.cwd(), "src", "data");

export type DogRehabAttachment = {
  id: string;
  title: string;
  type: "Receta" | "Examen" | "Certificado" | "Foto Recuperación";
  url: string;
  date: string;
};

export type DogAdoptionFollowUp = {
  id: string;
  period: "Mes 1" | "Mes 3" | "Mes 6" | "Anual";
  date: string;
  status: "Pendiente" | "Verificado Óptimo" | "Requiere Visita";
  notes: string;
  photoUrl?: string;
};

export type DogDocumentation = {
  arrival: {
    intakeDate: string;
    rescueLocation: string;
    rescuedBy: string;
    linkedCaseReportId?: string;
    initialCondition:
      | "Estable"
      | "Desnutrición"
      | "Herido / Politraumatismo"
      | "Abandono"
      | "Crítico";
    initialWeightKg: string;
    triageNotes: string;
    beforePhotos: string[];
    intakeCompleted: boolean;
  };
  rehabilitation: {
    dewormed: boolean;
    vaccinatedSextuple: boolean;
    vaccinatedRabies: boolean;
    sterilized: boolean;
    sterilizationDate: string;
    vetResponsible: string;
    behavioralAssessment: string;
    medicalAttachments: DogRehabAttachment[];
    rehabCompleted: boolean;
  };
  adoption: {
    adoptionApplicationId?: string;
    adopterName: string;
    adopterPhone: string;
    adopterIdNumber: string;
    deliveryDate: string;
    signedContractAccepted: boolean;
    contractPhotoUrl: string;
    deliveryPhotoUrl: string;
    followUps: DogAdoptionFollowUp[];
    adoptionCompleted: boolean;
  };
  updatedAt?: string;
};

export type LocalDog = DemoDog & {
  isDeleted?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  documentation?: DogDocumentation;
};

export function buildDefaultDogDocumentation(dog: Partial<LocalDog>): DogDocumentation {
  const isAdopted = dog.status === "Adoptado";
  const isSterilized = Boolean(dog.isSterilized);
  const intakeDate = dog.createdAt
    ? dog.createdAt.slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  return {
    arrival: {
      intakeDate,
      rescueLocation: "Amatitlán, Guatemala",
      rescuedBy: "Brigada DOG rescue",
      linkedCaseReportId: "",
      initialCondition: "Abandono",
      initialWeightKg: dog.size === "Pequeño" ? "6.5" : dog.size === "Grande" ? "22.0" : "13.5",
      triageNotes: dog.rescueHistory || "Evaluación física de ingreso realizada en sede.",
      beforePhotos: dog.photoUrl ? [dog.photoUrl] : [],
      intakeCompleted: Boolean(dog.rescueHistory),
    },
    rehabilitation: {
      dewormed: true,
      vaccinatedSextuple: true,
      vaccinatedRabies: isSterilized,
      sterilized: isSterilized,
      sterilizationDate: isSterilized ? intakeDate : "",
      vetResponsible: "Dra. María Morales",
      behavioralAssessment:
        dog.temperament
          ? `Temperamento evaluado: ${dog.temperament}. Apto para convivencia familiar.`
          : "En observación conductual positiva.",
      medicalAttachments: [],
      rehabCompleted: dog.status === "En Adopción" || isAdopted,
    },
    adoption: {
      adoptionApplicationId: "",
      adopterName: "",
      adopterPhone: "",
      adopterIdNumber: "",
      deliveryDate: "",
      signedContractAccepted: isAdopted,
      contractPhotoUrl: "",
      deliveryPhotoUrl: "",
      followUps: [],
      adoptionCompleted: isAdopted,
    },
    updatedAt: new Date().toISOString(),
  };
}

export async function getLocalDogs(): Promise<LocalDog[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, "dogs.json"), "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((d: LocalDog) => ({
        ...d,
        documentation: d.documentation || buildDefaultDogDocumentation(d),
      }));
    }
  } catch {
    // Si aún no existe dogs.json, inicializar con DEFAULT_DOGS
  }
  const initial: LocalDog[] = DEFAULT_DOGS.map((d) => ({
    ...d,
    isDeleted: false,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    documentation: buildDefaultDogDocumentation(d),
  }));
  await saveLocalDogs(initial);
  return initial;
}

export async function saveLocalDogs(list: LocalDog[]): Promise<void> {
  await writeJsonArray("dogs.json", list);
}

async function writeJsonArray<T>(fileName: string, data: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, fileName), JSON.stringify(data, null, 2), "utf-8");
}

// 1. SOLICITUDES DE ADOPCIÓN
export type LocalAdoptionApplication = {
  id: string;
  dogId: string;
  dog?: {
    id: string;
    name: string;
    photoUrl: string;
  };
  applicantName: string;
  applicantAge: number;
  applicantPhone: string;
  petsAllowed: boolean;
  safeHome: boolean;
  enoughSpace: boolean;
  petAccess: string;
  knowsFiveFreedoms: boolean;
  commitsToWelfare: boolean;
  commitsToSterilize: boolean;
  status: string;
  evaluatorNotes?: string;
  createdAt: string;
};

// Alias histórico para consumidores de expedientes: ahora consulta PostgreSQL.
export const getLocalApplications = getApplications;

// 2. PEDIDOS DE LA TIENDA SOLIDARIA
export type StoreOrderItem = {
  id: string;
  name: string;
  size?: string;
  price: number;
  qty: number;
};

export type DeliveryMethod = "Recoger en Sede" | "Cargo Expreso";
export type PaymentMethod =
  | "Transferencia / Depósito"
  | "Efectivo Contra Entrega";
export type OrderStatus =
  | "Pendiente"
  | "En Preparación"
  | "Enviado (Cargo Expreso)"
  | "Listo para Recoger"
  | "Entregado"
  | "Cancelado";
export type PaymentStatus = "Pendiente" | "Verificado";

export type StoreOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryMethod: DeliveryMethod;
  department?: string;
  shippingAddress?: string;
  shippingFee: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  paymentStatus: PaymentStatus;
  trackingNumber?: string; // Número de guía de Cargo Expreso
  adminNotes?: string;
  note?: string;
  items: StoreOrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

// Alias de lectura conservados para otros módulos. No hay fallback ni escritura JSON.
export const getStoreOrders = getOrders;
export const getLocalVolunteers = getVolunteers;
export const getLocalCaseReports = getReports;
