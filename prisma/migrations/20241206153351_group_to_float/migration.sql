/*
  Warnings:

  - The `group` column on the `ApuOnResourceBudget` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ApuOnResourceBudget" DROP COLUMN "group",
ADD COLUMN     "group" DOUBLE PRECISION;
