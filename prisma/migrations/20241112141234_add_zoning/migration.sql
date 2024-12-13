-- CreateTable
CREATE TABLE "Zoning" (
    "id" TEXT NOT NULL,
    "zone_code" TEXT NOT NULL,
    "description" TEXT,
    "buildable_area" DOUBLE PRECISION NOT NULL,
    "open_area" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zoning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zoning_id_key" ON "Zoning"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Zoning_zone_code_key" ON "Zoning"("zone_code");
