/*
  Warnings:

  - You are about to drop the column `isTemplate` on the `Apu` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `SubcategoryBudget` table. All the data in the column will be lost.
  - You are about to drop the column `unitCost` on the `SubcategoryBudget` table. All the data in the column will be lost.
  - You are about to drop the column `performance` on the `WorkItem` table. All the data in the column will be lost.
  - Added the required column `performance` to the `Apu` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workHours` to the `Apu` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Apu" DROP COLUMN "isTemplate",
ADD COLUMN     "performance" INTEGER NOT NULL,
ADD COLUMN     "workHours" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ApuOnResource" ADD COLUMN     "group" TEXT;

-- AlterTable
ALTER TABLE "SubcategoryBudget" DROP COLUMN "quantity",
DROP COLUMN "unitCost";

-- AlterTable
ALTER TABLE "WorkItem" DROP COLUMN "performance";

-- CreateTable
CREATE TABLE "ApuBudget" (
    "id" TEXT NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "performance" INTEGER NOT NULL,
    "workHours" INTEGER NOT NULL DEFAULT 8,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApuBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApuOnResourceBudget" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "group" TEXT,
    "resourceId" TEXT NOT NULL,
    "apuId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApuOnResourceBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApuBudget_id_key" ON "ApuBudget"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ApuOnResourceBudget_id_key" ON "ApuOnResourceBudget"("id");

-- AddForeignKey
ALTER TABLE "ApuOnResourceBudget" ADD CONSTRAINT "ApuOnResourceBudget_apuId_fkey" FOREIGN KEY ("apuId") REFERENCES "ApuBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
