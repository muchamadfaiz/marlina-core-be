-- AlterTable
ALTER TABLE "report_lokasi" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "namaTim" TEXT;
