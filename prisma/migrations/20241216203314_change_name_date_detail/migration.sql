/*
  Warnings:

  - You are about to drop the column `date` on the `RequirementsDetail` table. All the data in the column will be lost.
  - Added the required column `dateDetail` to the `RequirementsDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequirementsDetail" DROP COLUMN "date",
ADD COLUMN     "dateDetail" TEXT NOT NULL;
