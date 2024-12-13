-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "executionProjectId" TEXT;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_executionProjectId_fkey" FOREIGN KEY ("executionProjectId") REFERENCES "ExecutionProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
