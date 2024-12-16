-- CreateEnum
CREATE TYPE "RequirementDetailStatus" AS ENUM ('REQUIRED', 'PURCHASE', 'COMPLETED');

-- CreateTable
CREATE TABLE "Requirements" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "residentId" TEXT NOT NULL,
    "executionProyectId" TEXT NOT NULL,

    CONSTRAINT "Requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementsDetail" (
    "id" TEXT NOT NULL,
    "status" "RequirementDetailStatus" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "date" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "deliveryDate" TEXT NOT NULL,
    "deliveryQuantity" DOUBLE PRECISION NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requirementsId" TEXT NOT NULL,

    CONSTRAINT "RequirementsDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequirementResource" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requirementDetailId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,

    CONSTRAINT "RequirementResource_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Requirements_id_key" ON "Requirements"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementsDetail_id_key" ON "RequirementsDetail"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RequirementResource_id_key" ON "RequirementResource"("id");

-- AddForeignKey
ALTER TABLE "Requirements" ADD CONSTRAINT "Requirements_residentId_fkey" FOREIGN KEY ("residentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirements" ADD CONSTRAINT "Requirements_executionProyectId_fkey" FOREIGN KEY ("executionProyectId") REFERENCES "ExecutionProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementsDetail" ADD CONSTRAINT "RequirementsDetail_requirementsId_fkey" FOREIGN KEY ("requirementsId") REFERENCES "Requirements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementResource" ADD CONSTRAINT "RequirementResource_requirementDetailId_fkey" FOREIGN KEY ("requirementDetailId") REFERENCES "RequirementsDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequirementResource" ADD CONSTRAINT "RequirementResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
