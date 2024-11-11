/*
  Warnings:

  - A unique constraint covering the columns `[quotationId]` on the table `DesignProject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DesignProject_quotationId_key" ON "DesignProject"("quotationId");
