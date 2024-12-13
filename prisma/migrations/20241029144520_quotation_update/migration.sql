-- DropIndex
DROP INDEX "Quotation_code_key";

-- AlterTable
ALTER TABLE "Quotation" ALTER COLUMN "name" SET DEFAULT 'SGC-P-04-F3',
ALTER COLUMN "status" SET DEFAULT 'PENDING';
