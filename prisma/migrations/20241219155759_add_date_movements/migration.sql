/*
  Warnings:

  - Added the required column `dateMovement` to the `Movements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movements" ADD COLUMN     "dateMovement" TEXT NOT NULL;
