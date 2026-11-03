-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "targetTab" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeSettings" (
    "id" TEXT NOT NULL,
    "badgeText" TEXT NOT NULL,
    "mottoPart1" TEXT NOT NULL,
    "mottoHighlight" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "button1Text" TEXT NOT NULL,
    "button2Text" TEXT NOT NULL,
    "fontFamily" TEXT NOT NULL,
    "fontWeight" TEXT NOT NULL,
    "fontStyle" TEXT NOT NULL,
    "textTransform" TEXT NOT NULL,
    "fontSize" TEXT NOT NULL,
    "highlightColor" TEXT NOT NULL,
    "textAlignment" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HomeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_createdAt_id_idx" ON "Notification"("createdAt", "id");
