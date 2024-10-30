-- CreateTable
CREATE TABLE "LevelsOnSpaces" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "levelId" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LevelsOnSpaces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LevelsOnSpaces_id_key" ON "LevelsOnSpaces"("id");

-- AddForeignKey
ALTER TABLE "LevelsOnSpaces" ADD CONSTRAINT "LevelsOnSpaces_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LevelsOnSpaces" ADD CONSTRAINT "LevelsOnSpaces_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
