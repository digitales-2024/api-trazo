/*
  Warnings:

  - You are about to drop the column `typeMovementId` on the `Movements` table. All the data in the column will be lost.
  - You are about to drop the `TypeMovement` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `Movements` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeMovements" AS ENUM ('INPUT', 'OUTPUT');

-- DropForeignKey
ALTER TABLE "Movements" DROP CONSTRAINT "Movements_typeMovementId_fkey";

-- AlterTable
ALTER TABLE "Movements" DROP COLUMN "typeMovementId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "type" "TypeMovements" NOT NULL;

-- DropTable
DROP TABLE "TypeMovement";

-- DropEnum
DROP TYPE "TypeMovementName";
