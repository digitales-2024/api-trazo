/*
  Warnings:

  - You are about to drop the column `executionProjectId` on the `Budget` table. All the data in the column will be lost.
  - Made the column `budgetId` on table `ExecutionProject` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Budget" DROP CONSTRAINT "Budget_executionProjectId_fkey";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "executionProjectId";

-- AlterTable
ALTER TABLE "ExecutionProject" ALTER COLUMN "budgetId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ExecutionProject" ADD CONSTRAINT "ExecutionProject_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
