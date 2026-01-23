-- CreateTable
CREATE TABLE "picking_seasons" (
    "id" TEXT NOT NULL,
    "season_number" INTEGER NOT NULL,
    "available_picker_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "used_picker_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "current_picker_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "picking_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "picking_seasons_season_number_key" ON "picking_seasons"("season_number");

-- CreateIndex
CREATE INDEX "picking_seasons_is_active_idx" ON "picking_seasons"("is_active");
