-- CreateTable
CREATE TABLE "team_work_locations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "workLocationId" TEXT NOT NULL,
    "assignedDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_work_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_work_locations_teamId_workLocationId_assignedDate_key" ON "team_work_locations"("teamId", "workLocationId", "assignedDate");

-- AddForeignKey
ALTER TABLE "team_work_locations" ADD CONSTRAINT "team_work_locations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_work_locations" ADD CONSTRAINT "team_work_locations_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "work_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
