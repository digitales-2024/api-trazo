-- CreateEnum
CREATE TYPE "ExecutionProjectStatus" AS ENUM ('APPROVED', 'CANCELLED', 'STARTED', 'EXECUTION');

-- CreateTable
CREATE TABLE "ExecutionProject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExecutionProjectStatus" NOT NULL DEFAULT 'APPROVED',
    "ubicationProject" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "residentId" TEXT NOT NULL,
    "startProjectDate" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionProject_id_key" ON "ExecutionProject"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionProject_code_key" ON "ExecutionProject"("code");

-- AddForeignKey
ALTER TABLE "ExecutionProject" ADD CONSTRAINT "ExecutionProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionProject" ADD CONSTRAINT "ExecutionProject_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
