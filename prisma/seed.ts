import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando sembrado de datos para Refugio DOG Rescue Guatemala...");

  // 1. Estadísticas de Transparencia
  await prisma.transparencyStat.upsert({
    where: { key: "rescues_count" },
    update: { value: 184 },
    create: { key: "rescues_count", value: 184, label: "Perros Rescatados" },
  });

  await prisma.transparencyStat.upsert({
    where: { key: "adoptions_count" },
    update: { value: 146 },
    create: { key: "adoptions_count", value: 146, label: "Adopciones Logradas" },
  });

  await prisma.transparencyStat.upsert({
    where: { key: "sterilizations_count" },
    update: { value: 310 },
    create: { key: "sterilizations_count", value: 310, label: "Esterilizaciones Realizadas" },
  });

  // 2. Perritos
  const firulais = await prisma.dog.create({
    data: {
      name: "Rocky",
      breed: "Mestizo / Labrador Mix",
      ageCategory: "Adulto",
      ageYears: 2.5,
      gender: "Macho",
      size: "Mediano",
      temperament: "Sociable, Activo y Juguetón",
      status: "En Adopción",
      rescueHistory: "Rescatado cerca del Lago de Amatitlán en situación de desnutrición severa. Ha recuperado su peso ideal y energía.",
      healthNotes: "Totalmente recuperado, esterilizado, vacunas al día.",
      photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=800",
      isSterilized: true,
      medicalRecords: {
        create: [
          {
            type: "Vacuna",
            title: "Multiple Canina (Quíntuple)",
            description: "Refuerzo anual de parvovirus, moquillo y adenovirus.",
            date: new Date("2026-07-15"),
            vetName: "Dra. María Morales (Clínica Amatitlán)",
            status: "Completado",
          },
          {
            type: "Esterilizaciones",
            title: "Cirugía de Orquiectomía",
            description: "Esterilización exitosa sin complicaciones.",
            date: new Date("2026-08-01"),
            vetName: "Dr. Roberto Giro",
            status: "Completado",
          },
        ],
      },
    },
  });

  const luna = await prisma.dog.create({
    data: {
      name: "Luna",
      breed: "Mestizo",
      ageCategory: "Cachorro",
      ageYears: 0.6,
      gender: "Hembra",
      size: "Pequeño",
      temperament: "Tranquilo, Caracter Dulce",
      status: "En Adopción",
      rescueHistory: "Encontrada junto a sus hermanitos en una caja en el sector de la 9a calle Amatitlán.",
      healthNotes: "Desparasitada, esquema inicial de vacunación.",
      photoUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=800",
      isSterilized: false,
      medicalRecords: {
        create: [
          {
            type: "Desparasitación",
            title: "Desparasitación Interna y Externa",
            description: "Dosis de Nexgard y Drontal Puppy.",
            date: new Date("2026-08-10"),
            vetName: "Dra. María Morales",
            status: "Completado",
          },
          {
            type: "Esterilización",
            title: "Jornada de Esterilización Programada",
            description: "Fecha programada al cumplir 8 meses.",
            date: new Date("2026-10-15"),
            nextDueDate: new Date("2026-10-15"),
            vetName: "Dra. María Morales",
            status: "Programado",
          },
        ],
      },
    },
  });

  const max = await prisma.dog.create({
    data: {
      name: "Max",
      breed: "Pastor Mix",
      ageCategory: "Senior",
      ageYears: 7.0,
      gender: "Macho",
      size: "Grande",
      temperament: "Tranquilo, Protector y Leal",
      status: "En Adopción",
      rescueHistory: "Abandonado por sus antiguos dueños al enfermarse. Recibió tratamiento contra erliquia y ahora goza de excelente salud.",
      healthNotes: "Tratamiento de erliquiosis completado. Necesita alimento de adulto mayor.",
      photoUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=800",
      isSterilized: true,
      medicalRecords: {
        create: [
          {
            type: "Consulta",
            title: "Examen de Sangre de Control",
            description: "Plaquetas en rango normal tras tratamiento de erliquia.",
            date: new Date("2026-08-20"),
            vetName: "Dr. Carlos Fuentes",
            status: "Completado",
          },
        ],
      },
    },
  });

  const canela = await prisma.dog.create({
    data: {
      name: "Canela",
      breed: "Mestizo Golden",
      ageCategory: "Adulto",
      ageYears: 3.0,
      gender: "Hembra",
      size: "Mediano",
      temperament: "Sociable y Cariñosa con niños",
      status: "En Tratamiento",
      rescueHistory: "Rescatada tras ser atropellada cerca de la entrada principal de Amatitlán. Presentaba fractura menor en pata trasera.",
      healthNotes: "En recuperación post-cirugía ortopédica. Evolución muy favorable.",
      photoUrl: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&q=80&w=800",
      isSterilized: true,
      medicalRecords: {
        create: [
          {
            type: "Tratamiento",
            title: "Revisión Ortopédica y Radiografía",
            description: "Consolidación ósea al 85%. Radiografía de control.",
            date: new Date("2026-09-02"),
            nextDueDate: new Date("2026-09-18"),
            vetName: "Dr. Carlos Fuentes",
            status: "Programado",
          },
        ],
      },
    },
  });

  // 3. Inventario
  await prisma.inventoryItem.createMany({
    data: [
      {
        category: "Concentrado",
        name: "Alimento Perro Adulto (Costales 25kg)",
        quantity: 2.0, // Bajo stock a propósito
        unit: "costales",
        minThreshold: 5.0,
      },
      {
        category: "Concentrado",
        name: "Alimento Cachorro (Costales 15kg)",
        quantity: 6.0,
        unit: "costales",
        minThreshold: 3.0,
      },
      {
        category: "Medicamento",
        name: "Doxiciclina 100mg (Tratamiento Erliquia)",
        quantity: 4.0,
        unit: "cajas",
        minThreshold: 2.0,
      },
      {
        category: "Medicamento",
        name: "Nexgard Spectras (Desparasitante)",
        quantity: 1.0, // Bajo stock
        unit: "cajas",
        minThreshold: 4.0,
      },
      {
        category: "Insumo de Limpieza",
        name: "Desinfectante Amonio Cuaternario (Galón)",
        quantity: 8.0,
        unit: "galones",
        minThreshold: 3.0,
      },
      {
        category: "Insumo de Limpieza",
        name: "Detergente Multiuso (Bolsas 5kg)",
        quantity: 12.0,
        unit: "bolsas",
        minThreshold: 4.0,
      },
    ],
  });

  // 4. Voluntarios para este Sábado
  await prisma.volunteer.createMany({
    data: [
      {
        name: "Ana Lucía Gómez",
        email: "ana.gomez@gmail.com",
        phone: "5544-3322",
        saturdayDate: "2026-09-12",
        assignedTask: "Paseo y Socialización",
        status: "Confirmado",
      },
      {
        name: "José Manuel Estrada",
        email: "jose.estrada@outlook.com",
        phone: "4122-8899",
        saturdayDate: "2026-09-12",
        assignedTask: "Baño y Cepillado",
        status: "Confirmado",
      },
      {
        name: "Sofía Reyes",
        email: "sreyess@gmail.com",
        phone: "3011-2244",
        saturdayDate: "2026-09-12",
        assignedTask: "Limpieza de Caniles",
        status: "Confirmado",
      },
    ],
  });

  // 5. Solicitud de adopción de prueba
  await prisma.adoptionApplication.create({
    data: {
      dogId: firulais.id,
      applicantName: "Carlos Eduardo Méndez",
      applicantEmail: "carlos.mendez@example.com",
      applicantPhone: "5012-9988",
      applicantAddress: "Colonia Las Ninfas, Amatitlán",
      homeType: "Casa",
      hasYard: true,
      hasOtherPets: true,
      status: "En Evaluación",
      evaluatorNotes: "Candidato con experiencia previa en perritos rescatados. Pendiente visita domiciliaria.",
    },
  });

  // 6. Reportes de Caso de la comunidad
  await prisma.caseReport.create({
    data: {
      reporterName: "Mariela Cabrera",
      reporterPhone: "5988-1122",
      locationAddress: "Barrio San Antonio, 4ta avenida cerca del mercado, Amatitlán",
      description: "Perrita mestiza color café desorientada y con una lastimadura en la pata delantera derecha.",
      urgencyLevel: "Alta",
      status: "En Revisión",
    },
  });

  console.log("✅ Datos de prueba sembrados exitosamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
