/*
  Warnings:

  - A unique constraint covering the columns `[budgetId]` on the table `ExecutionProject` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ExecutionProject_budgetId_key" ON "ExecutionProject"("budgetId");
