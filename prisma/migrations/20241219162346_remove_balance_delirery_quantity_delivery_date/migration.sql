/*
  Warnings:

  - You are about to drop the column `balance` on the `RequirementsDetail` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `RequirementsDetail` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryQuantity` on the `RequirementsDetail` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RequirementsDetail" DROP COLUMN "balance",
DROP COLUMN "deliveryDate",
DROP COLUMN "deliveryQuantity";
