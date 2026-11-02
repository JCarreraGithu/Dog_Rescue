import type { AdoptionView, MedicalRecordView } from "@/lib/view-types";

export type DemoDog = {
  id: string;
  name: string;
  breed: string;
  ageCategory: string;
  ageYears: number;
  gender: string;
  size: string;
  temperament: string;
  status: string;
  rescueHistory: string;
  healthNotes: string;
  photoUrl: string;
  isSterilized: boolean;
  medicalRecords: MedicalRecordView[];
  applications?: AdoptionView[];
};

export const DEFAULT_DOGS: DemoDog[] = [
  {
    id: "demo-dog-1",
    name: "Rocky",
    breed: "Mestizo",
    ageCategory: "Joven",
    ageYears: 1.5,
    gender: "Macho",
    size: "Mediano",
    temperament: "Juguetón y Cariñoso",
    status: "En Adopción",
    rescueHistory: "Rescatado en Amatitlán. Recuperado con amor y listo para una familia responsable.",
    healthNotes: "Vacunado, desparasitado y esterilizado.",
    photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
    isSterilized: true,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-2",
    name: "Luna",
    breed: "Mestizo",
    ageCategory: "Adulto",
    ageYears: 2.0,
    gender: "Hembra",
    size: "Mediano",
    temperament: "Tranquila y Noble",
    status: "En Adopción",
    rescueHistory: "Encontrada desnutrida en el mercado central. Ya en peso ideal y muy sociable.",
    healthNotes: "Salud al 100%, vacunas al día.",
    photoUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800",
    isSterilized: true,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-3",
    name: "Max",
    breed: "Mestizo",
    ageCategory: "Cachorro",
    ageYears: 0.8,
    gender: "Macho",
    size: "Pequeño",
    temperament: "Curioso y Muy Amigable",
    status: "En Adopción",
    rescueHistory: "Nacido de una camada rescatada de la lluvia. Listo para su primer hogar definitivo.",
    healthNotes: "Esquema de vacunas completado.",
    photoUrl: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=800",
    isSterilized: false,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-4",
    name: "Canela",
    breed: "Mestizo",
    ageCategory: "Joven",
    ageYears: 1.2,
    gender: "Hembra",
    size: "Mediano",
    temperament: "Sociable y Cariñosa",
    status: "En Adopción",
    rescueHistory: "Rescatada en la carretera hacia Amatitlán. Superó una desnutrición severa y hoy es la más agradecida y cariñosa.",
    healthNotes: "Esterilizada, vacunas al día, desparasitada.",
    photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800",
    isSterilized: true,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-5",
    name: "Oso",
    breed: "Mestizo",
    ageCategory: "Adulto",
    ageYears: 3.0,
    gender: "Macho",
    size: "Grande",
    temperament: "Tranquilo y Protector",
    status: "En Adopción",
    rescueHistory: "Vagaba desorientado cerca de un taller mecánico. Es un gigante noble que ama los paseos tranquilos y convive bien con otros perros.",
    healthNotes: "Vacunado, chequeo general impecable, esterilizado.",
    photoUrl: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?auto=format&fit=crop&q=80&w=800",
    isSterilized: true,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-6",
    name: "Milo",
    breed: "Mestizo",
    ageCategory: "Cachorro",
    ageYears: 0.5,
    gender: "Macho",
    size: "Pequeño",
    temperament: "Juguetón y Curioso",
    status: "En Adopción",
    rescueHistory: "Encontrado dentro de una caja junto a sus hermanitos en época de lluvia. Es alegre, despierto y adora jugar con pelotas.",
    healthNotes: "Primera y segunda vacuna séxtuple puestas. Desparasitado.",
    photoUrl: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800",
    isSterilized: false,
    medicalRecords: [],
    applications: [],
  },
  {
    id: "demo-dog-7",
    name: "Toby",
    breed: "Mestizo",
    ageCategory: "Senior",
    ageYears: 7.0,
    gender: "Macho",
    size: "Mediano",
    temperament: "Tranquilo y Muy Fiel",
    status: "En Adopción",
    rescueHistory: "Su dueño falleció y quedó a su suerte en la calle. Es un abuelito tierno, educado y muy agradecido que busca un hogar donde descansar con amor.",
    healthNotes: "Tratamiento preventivo articular, vacunas vigentes, esterilizado.",
    photoUrl: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=800",
    isSterilized: true,
    medicalRecords: [],
    applications: [],
  },
];
