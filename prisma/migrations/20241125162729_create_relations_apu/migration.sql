/*
  Warnings:

  - Added the required column `apuId` to the `WorkItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `apuId` to the `WorkItemBudget` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkItemBudget" DROP CONSTRAINT "WorkItemBudget_workItemId_fkey";

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "apuId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkItemBudget" ADD COLUMN     "apuId" TEXT NOT NULL;
