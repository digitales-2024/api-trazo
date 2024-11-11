-- CreateTable
CREATE TABLE "ProjectCharter" (
    "id" TEXT NOT NULL,
    "charterNumber" SERIAL NOT NULL,
    "observations" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "designProjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectCharter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCharter_id_key" ON "ProjectCharter"("id");

-- AddForeignKey
ALTER TABLE "ProjectCharter" ADD CONSTRAINT "ProjectCharter_designProjectId_fkey" FOREIGN KEY ("designProjectId") REFERENCES "DesignProject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
