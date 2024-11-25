-- AlterTable
ALTER TABLE "WorkItem" ADD COLUMN     "subtotal" DOUBLE PRECISION,
ALTER COLUMN "unit" DROP NOT NULL,
ALTER COLUMN "unitCost" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkItemBudget" ALTER COLUMN "quantity" DROP NOT NULL,
ALTER COLUMN "unitCost" DROP NOT NULL,
ALTER COLUMN "subtotal" DROP NOT NULL;

-- CreateTable
CREATE TABLE "subWorkItemBudget" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "subWorkItemId" TEXT NOT NULL,
    "workItemBudgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subWorkItemBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubWorkItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "unitCost" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "workItemId" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubWorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subWorkItemBudget_id_key" ON "subWorkItemBudget"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SubWorkItem_id_key" ON "SubWorkItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SubWorkItem_name_key" ON "SubWorkItem"("name");

-- AddForeignKey
ALTER TABLE "subWorkItemBudget" ADD CONSTRAINT "subWorkItemBudget_workItemBudgetId_fkey" FOREIGN KEY ("workItemBudgetId") REFERENCES "WorkItemBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubWorkItem" ADD CONSTRAINT "SubWorkItem_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
