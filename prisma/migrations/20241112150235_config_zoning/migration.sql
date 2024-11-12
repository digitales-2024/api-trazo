/*
  Warnings:

  - You are about to drop the column `buildable_area` on the `Zoning` table. All the data in the column will be lost.
  - You are about to drop the column `open_area` on the `Zoning` table. All the data in the column will be lost.
  - You are about to drop the column `zone_code` on the `Zoning` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[zoneCode]` on the table `Zoning` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `buildableArea` to the `Zoning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openArea` to the `Zoning` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zoneCode` to the `Zoning` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Zoning_zone_code_key";

-- AlterTable
ALTER TABLE "Zoning" DROP COLUMN "buildable_area",
DROP COLUMN "open_area",
DROP COLUMN "zone_code",
ADD COLUMN     "buildableArea" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "openArea" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "zoneCode" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Zoning_zoneCode_key" ON "Zoning"("zoneCode");
