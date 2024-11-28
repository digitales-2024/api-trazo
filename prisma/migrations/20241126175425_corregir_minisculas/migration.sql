/*
  Warnings:

  - You are about to drop the `subWorkItemBudget` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "subWorkItemBudget" DROP CONSTRAINT "subWorkItemBudget_workItemBudgetId_fkey";

-- DropTable
DROP TABLE "subWorkItemBudget";

-- CreateTable
CREATE TABLE "SubWorkItemBudget" (
    "id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "subWorkItemId" TEXT NOT NULL,
    "apuBudgetId" TEXT,
    "workItemBudgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubWorkItemBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubWorkItemBudget_id_key" ON "SubWorkItemBudget"("id");

-- AddForeignKey
ALTER TABLE "SubWorkItemBudget" ADD CONSTRAINT "SubWorkItemBudget_workItemBudgetId_fkey" FOREIGN KEY ("workItemBudgetId") REFERENCES "WorkItemBudget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
