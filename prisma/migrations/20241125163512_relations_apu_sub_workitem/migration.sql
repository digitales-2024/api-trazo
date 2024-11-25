-- AlterTable
ALTER TABLE "SubWorkItem" ADD COLUMN     "apuId" TEXT;

-- AlterTable
ALTER TABLE "WorkItem" ALTER COLUMN "apuId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkItemBudget" ALTER COLUMN "apuId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "subWorkItemBudget" ADD COLUMN     "apuId" TEXT;
