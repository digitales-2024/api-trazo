-- DropForeignKey
ALTER TABLE "Movements" DROP CONSTRAINT "Movements_purchaseId_fkey";

-- AlterTable
ALTER TABLE "Movements" ALTER COLUMN "purchaseId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Movements" ADD CONSTRAINT "Movements_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
