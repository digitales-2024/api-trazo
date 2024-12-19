/*
  Warnings:

  - You are about to drop the `RequirementResource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `resourceId` to the `RequirementsDetail` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "RequirementResource" DROP CONSTRAINT "RequirementResource_requirementDetailId_fkey";

-- DropForeignKey
ALTER TABLE "RequirementResource" DROP CONSTRAINT "RequirementResource_resourceId_fkey";

-- AlterTable
ALTER TABLE "RequirementsDetail" ADD COLUMN     "resourceId" TEXT NOT NULL;

-- DropTable
DROP TABLE "RequirementResource";

-- AddForeignKey
ALTER TABLE "RequirementsDetail" ADD CONSTRAINT "RequirementsDetail_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
