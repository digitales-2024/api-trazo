/*
  Warnings:

  - Added the required column `department` to the `Supplier` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Supplier" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL;
