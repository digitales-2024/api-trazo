/*
  Warnings:

  - You are about to drop the column `userId` on the `Quotation` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Quotation" DROP CONSTRAINT "Quotation_userId_fkey";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "userId";
