/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Budget` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Budget_code_key" ON "Budget"("code");
