-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Dog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL DEFAULT 'Mestizo',
    "ageCategory" TEXT NOT NULL,
    "ageYears" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "gender" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "temperament" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En Adopción',
    "rescueHistory" TEXT NOT NULL,
    "healthNotes" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "isSterilized" BOOLEAN NOT NULL DEFAULT false,
    "rescueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "dogId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vetName" TEXT NOT NULL DEFAULT 'Dr. Veterinario Amatitlán',
    "nextDueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Completado',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdoptionApplication" (
    "id" TEXT NOT NULL,
    "dogId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantAge" INTEGER,
    "applicantPhone" TEXT NOT NULL,
    "petsAllowed" BOOLEAN,
    "safeHome" BOOLEAN,
    "enoughSpace" BOOLEAN,
    "petAccess" TEXT,
    "knowsFiveFreedoms" BOOLEAN,
    "commitsToWelfare" BOOLEAN,
    "commitsToSterilize" BOOLEAN,
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "evaluatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "applicantEmail" TEXT NOT NULL DEFAULT '',
    "applicantAddress" TEXT NOT NULL DEFAULT '',
    "homeType" TEXT NOT NULL DEFAULT 'Casa',
    "hasYard" BOOLEAN NOT NULL DEFAULT false,
    "hasOtherPets" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AdoptionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "minThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Volunteer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "age" INTEGER,
    "municipality" TEXT,
    "availableDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "commitmentDuration" TEXT,
    "interestAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "animalExperience" TEXT,
    "motivation" TEXT,
    "acceptsSafetyRules" BOOLEAN,
    "authorizesDataUse" BOOLEAN,
    "saturdayDate" TEXT NOT NULL DEFAULT '',
    "assignedTask" TEXT NOT NULL DEFAULT 'Cuidado General',
    "status" TEXT NOT NULL DEFAULT 'En Evaluación',
    "evaluatorNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Volunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseReport" (
    "id" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "reporterPhone" TEXT NOT NULL,
    "locationAddress" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrl" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'Media',
    "status" TEXT NOT NULL DEFAULT 'Recibido',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransparencyStat" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransparencyStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TransparencyStat_key_key" ON "TransparencyStat"("key");

-- AddForeignKey
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionApplication" ADD CONSTRAINT "AdoptionApplication_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
