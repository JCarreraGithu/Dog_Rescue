-- CreateTable
CREATE TABLE "SponsorshipRequest" (
    "id" TEXT NOT NULL,
    "dogId" TEXT,
    "dogSnapshot" JSONB,
    "sponsorName" TEXT NOT NULL,
    "sponsorPhone" TEXT NOT NULL,
    "sponsorEmail" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Pendiente',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SponsorshipRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SponsorshipRequest_createdAt_id_idx" ON "SponsorshipRequest"("createdAt", "id");

-- AddForeignKey
ALTER TABLE "SponsorshipRequest" ADD CONSTRAINT "SponsorshipRequest_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
