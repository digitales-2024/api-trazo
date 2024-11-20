/*
  Warnings:

  - Added the required column `meetingDate` to the `Observation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Observation" ADD COLUMN     "meetingDate" TEXT NOT NULL;
