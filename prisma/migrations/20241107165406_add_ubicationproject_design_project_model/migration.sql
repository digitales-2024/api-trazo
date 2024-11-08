/*
  Warnings:

  - You are about to drop the `DesignProjects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DesignProjects" DROP CONSTRAINT "DesignProjects_clientId_fkey";

-- DropForeignKey
ALTER TABLE "DesignProjects" DROP CONSTRAINT "DesignProjects_designerId_fkey";

-- DropForeignKey
ALTER TABLE "DesignProjects" DROP CONSTRAINT "DesignProjects_quotationId_fkey";

-- DropTable
DROP TABLE "DesignProjects";

-- CreateTable
CREATE TABLE "DesignProject" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "DesignProjectStatus" NOT NULL,
    "meetings" JSONB NOT NULL,
    "ubicationProject" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignProject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignProject_id_key" ON "DesignProject"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DesignProject_code_key" ON "DesignProject"("code");

-- AddForeignKey
ALTER TABLE "DesignProject" ADD CONSTRAINT "DesignProject_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProject" ADD CONSTRAINT "DesignProject_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProject" ADD CONSTRAINT "DesignProject_designerId_fkey" FOREIGN KEY ("designerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
