/*
  Warnings:

  - You are about to drop the column `sellerId` on the `Quotation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_sellerId_fkey";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "sellerId",
ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
