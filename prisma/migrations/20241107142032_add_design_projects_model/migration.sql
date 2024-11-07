-- CreateEnum
CREATE TYPE "DesignProjectStatus" AS ENUM ('APPROVED', 'ENGINEERING', 'CONFIRMATION', 'PRESENTATION', 'COMPLETED');

-- CreateTable
CREATE TABLE "DesignProjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "status" "DesignProjectStatus" NOT NULL,
    "meetings" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignProjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignProjects_id_key" ON "DesignProjects"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DesignProjects_code_key" ON "DesignProjects"("code");

-- AddForeignKey
ALTER TABLE "DesignProjects" ADD CONSTRAINT "DesignProjects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProjects" ADD CONSTRAINT "DesignProjects_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProjects" ADD CONSTRAINT "DesignProjects_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
