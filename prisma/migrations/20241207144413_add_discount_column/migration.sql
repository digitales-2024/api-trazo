/*
  Warnings:

  - Added the required column `discount` to the `BudgetDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BudgetDetail" ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL;
