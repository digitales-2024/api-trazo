/*
  Warnings:

  - You are about to drop the column `metrado` on the `Quotation` table. All the data in the column will be lost.
  - Added the required column `metering` to the `Quotation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quotation" RENAME COLUMN "metrado" TO "metering";
-- ALTER TABLE "Quotation" DROP COLUMN "metrado",
-- ADD COLUMN     "metering" DOUBLE PRECISION NOT NULL;
