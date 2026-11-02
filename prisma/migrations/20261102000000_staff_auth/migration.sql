-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('superadmin', 'editor', 'voluntario');

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StaffRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL,
    "sessionVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "lastLoginAt" TIMESTAMPTZ(3),

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "ip" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- CreateIndex
CREATE INDEX "LoginAttempt_resetAt_idx" ON "LoginAttempt"("resetAt");

-- Invariantes administrativas adicionales, sin alterar tablas existentes.
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_email_normalized"
  CHECK ("email" = lower(btrim("email")));
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_sessionVersion_nonnegative"
  CHECK ("sessionVersion" >= 0);
ALTER TABLE "StaffUser" ADD CONSTRAINT "StaffUser_scrypt_format"
  CHECK ("passwordHash" ~* '^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$');
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_count_positive"
  CHECK ("count" > 0);
