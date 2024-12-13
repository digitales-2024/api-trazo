/*
  Warnings:

  - You are about to drop the column `apuId` on the `WorkItemBudget` table. All the data in the column will be lost.
  - You are about to drop the column `apuId` on the `subWorkItemBudget` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkItemBudget" DROP COLUMN "apuId",
ADD COLUMN     "apuBudgetId" TEXT;

-- AlterTable
ALTER TABLE "subWorkItemBudget" DROP COLUMN "apuId",
ADD COLUMN     "apuBudgetId" TEXT;
