-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedById" TEXT,
ADD COLUMN     "rejectionNote" TEXT;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
