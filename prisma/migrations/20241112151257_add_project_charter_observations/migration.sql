/*
  Warnings:

  - You are about to drop the column `date` on the `ProjectCharter` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `ProjectCharter` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DesignProject" ADD COLUMN     "startProjectDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ProjectCharter" DROP COLUMN "date",
DROP COLUMN "observations";

-- CreateTable
CREATE TABLE "ProjectCharterObservation" (
    "id" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "projectCharterId" TEXT NOT NULL,
    "designProjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCharterObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCharterObservation_id_key" ON "ProjectCharterObservation"("id");

-- AddForeignKey
ALTER TABLE "ProjectCharterObservation" ADD CONSTRAINT "ProjectCharterObservation_projectCharterId_fkey" FOREIGN KEY ("projectCharterId") REFERENCES "ProjectCharter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectCharterObservation" ADD CONSTRAINT "ProjectCharterObservation_designProjectId_fkey" FOREIGN KEY ("designProjectId") REFERENCES "DesignProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
