/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Supplier` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Supplier" ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_email_key" ON "Supplier"("email");
