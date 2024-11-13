/*
  Warnings:

  - You are about to drop the column `designProjectId` on the `ProjectCharterObservation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectCharterObservation" DROP CONSTRAINT "ProjectCharterObservation_designProjectId_fkey";

-- AlterTable
ALTER TABLE "ProjectCharterObservation" DROP COLUMN "designProjectId";
