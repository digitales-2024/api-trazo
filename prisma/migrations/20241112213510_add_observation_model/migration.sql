/*
  Warnings:

  - You are about to drop the `ProjectCharterObservation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectCharterObservation" DROP CONSTRAINT "ProjectCharterObservation_projectCharterId_fkey";

-- DropTable
DROP TABLE "ProjectCharterObservation";

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    "projectCharterId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Observation_id_key" ON "Observation"("id");

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_projectCharterId_fkey" FOREIGN KEY ("projectCharterId") REFERENCES "ProjectCharter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
