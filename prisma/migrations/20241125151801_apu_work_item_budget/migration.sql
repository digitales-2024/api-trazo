/*
  Warnings:

  - Added the required column `apuId` to the `WorkItemBudget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WorkItemBudget" ADD COLUMN     "apuId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkItemBudget" ADD CONSTRAINT "WorkItemBudget_apuId_fkey" FOREIGN KEY ("apuId") REFERENCES "Apu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
