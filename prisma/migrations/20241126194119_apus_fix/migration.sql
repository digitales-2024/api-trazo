/*
  Warnings:

  - You are about to drop the column `unitCost` on the `SubWorkItem` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `WorkItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubWorkItem" DROP COLUMN "unitCost";

-- AlterTable
ALTER TABLE "WorkItem" DROP COLUMN "subtotal";
