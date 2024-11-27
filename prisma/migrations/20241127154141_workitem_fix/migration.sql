/*
  Warnings:

  - Added the required column `unitCost` to the `SubWorkItem` table without a default value. This is not possible if the table is not empty.
  - Made the column `unit` on table `SubWorkItem` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SubWorkItem" ADD COLUMN     "unitCost" DOUBLE PRECISION NOT NULL,
ALTER COLUMN "unit" SET NOT NULL;
