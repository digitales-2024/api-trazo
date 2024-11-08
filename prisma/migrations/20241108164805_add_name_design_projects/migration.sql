/*
  Warnings:

  - Added the required column `name` to the `DesignProject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DesignProject" ADD COLUMN     "name" TEXT NOT NULL;
