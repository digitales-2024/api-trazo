-- CreateEnum
CREATE TYPE "QuotationStatusType" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "status" "QuotationStatusType" NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryTime" INTEGER NOT NULL,
    "exchangeRate" DOUBLE PRECISION NOT NULL,
    "landArea" DOUBLE PRECISION NOT NULL,
    "paymentSchedule" JSONB NOT NULL,
    "integratedProjectDetails" JSONB NOT NULL,
    "architecturalCost" DOUBLE PRECISION NOT NULL,
    "structuralCost" DOUBLE PRECISION NOT NULL,
    "electricCost" DOUBLE PRECISION NOT NULL,
    "sanitaryCost" DOUBLE PRECISION NOT NULL,
    "metrado" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_id_key" ON "Quotation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_code_key" ON "Quotation"("code");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
