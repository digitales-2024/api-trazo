/*
  Warnings:

  - Added the required column `executionTime` to the `ExecutionProject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ExecutionProject" ADD COLUMN     "executionTime" TEXT NOT NULL,
ADD COLUMN     "projectProgress" INTEGER NOT NULL DEFAULT 0;
