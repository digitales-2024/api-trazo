/*
  Warnings:

  - Changed the type of `name` on the `TypeMovement` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TypeMovementName" AS ENUM ('INPUT', 'OUTPUT');

-- DropIndex
DROP INDEX "TypeMovement_name_key";

-- AlterTable
ALTER TABLE "TypeMovement" DROP COLUMN "name",
ADD COLUMN     "name" "TypeMovementName" NOT NULL;
