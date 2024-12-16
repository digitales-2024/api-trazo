/*
  Warnings:

  - The values [APPROVED] on the enum `ExecutionProjectStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExecutionProjectStatus_new" AS ENUM ('STARTED', 'CANCELLED', 'EXECUTION', 'COMPLETED');
ALTER TABLE "ExecutionProject" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ExecutionProject" ALTER COLUMN "status" TYPE "ExecutionProjectStatus_new" USING ("status"::text::"ExecutionProjectStatus_new");
ALTER TYPE "ExecutionProjectStatus" RENAME TO "ExecutionProjectStatus_old";
ALTER TYPE "ExecutionProjectStatus_new" RENAME TO "ExecutionProjectStatus";
DROP TYPE "ExecutionProjectStatus_old";
ALTER TABLE "ExecutionProject" ALTER COLUMN "status" SET DEFAULT 'STARTED';
COMMIT;

-- AlterTable
ALTER TABLE "ExecutionProject" ALTER COLUMN "status" SET DEFAULT 'STARTED';
