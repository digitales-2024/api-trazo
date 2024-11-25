/*
  Warnings:

  - You are about to drop the column `workItemId` on the `Apu` table. All the data in the column will be lost.
  - You are about to drop the column `apuId` on the `WorkItemBudget` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Apu" DROP CONSTRAINT "Apu_workItemId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryBudget" DROP CONSTRAINT "CategoryBudget_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "SubcategoryBudget" DROP CONSTRAINT "SubcategoryBudget_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "WorkItemBudget" DROP CONSTRAINT "WorkItemBudget_apuId_fkey";

-- AlterTable
ALTER TABLE "Apu" DROP COLUMN "workItemId";

-- AlterTable
ALTER TABLE "WorkItemBudget" DROP COLUMN "apuId";
