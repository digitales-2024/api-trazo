/*
  Warnings:

  - Changed the type of `status` on the `Quotation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "QuotationStatusType" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "status",
ADD COLUMN     "status" "QuotationStatusType" NOT NULL;

-- DropEnum
DROP TYPE "QuotationStatus";
