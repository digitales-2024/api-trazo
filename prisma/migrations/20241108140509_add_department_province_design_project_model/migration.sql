/*
  Warnings:

  - Added the required column `department` to the `DesignProject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province` to the `DesignProject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DesignProject" ADD COLUMN     "department" TEXT NOT NULL,
ADD COLUMN     "province" TEXT NOT NULL;
