/*
  Warnings:

  - A unique constraint covering the columns `[rucDni]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Client_rucDni_key" ON "Client"("rucDni");
