/*
  Warnings:

  - The `group` column on the `ApuOnResource` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ApuOnResource" DROP COLUMN "group",
ADD COLUMN     "group" DOUBLE PRECISION;
