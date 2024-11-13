/*
  Warnings:

  - Added the required column `zoningId` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "zoningId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_zoningId_fkey" FOREIGN KEY ("zoningId") REFERENCES "Zoning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
