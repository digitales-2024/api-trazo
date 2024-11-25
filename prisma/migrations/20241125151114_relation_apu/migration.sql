/*
  Warnings:

  - Added the required column `workItemId` to the `Apu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcategoryId` to the `WorkItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Apu" ADD COLUMN     "isTemplate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "subcategoryId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apu" ADD CONSTRAINT "Apu_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
