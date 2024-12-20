/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Requirements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Requirements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Requirements" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Requirements_code_key" ON "Requirements"("code");
