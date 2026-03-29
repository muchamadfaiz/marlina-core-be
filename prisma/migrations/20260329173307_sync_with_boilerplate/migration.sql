-- DropForeignKey
ALTER TABLE "report_lokasi" DROP CONSTRAINT "report_lokasi_workLocationId_fkey";

-- AlterTable
ALTER TABLE "report_lokasi" ADD COLUMN     "alamatLengkap" TEXT,
ADD COLUMN     "kedalaman" DOUBLE PRECISION,
ADD COLUMN     "lebarAtas" DOUBLE PRECISION,
ADD COLUMN     "lebarBawah" DOUBLE PRECISION,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "sedimen" DOUBLE PRECISION,
ALTER COLUMN "workLocationId" DROP NOT NULL,
ALTER COLUMN "kegiatan" DROP NOT NULL,
ALTER COLUMN "panjang" DROP NOT NULL,
ALTER COLUMN "lebar" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "alatBeratBahanBakar" TEXT,
ADD COLUMN     "alatBeratNama" TEXT,
ADD COLUMN     "formatLaporan" TEXT,
ADD COLUMN     "signatory1Name" TEXT,
ADD COLUMN     "signatory1Title" TEXT,
ADD COLUMN     "signatory2Name" TEXT,
ADD COLUMN     "signatory2Title" TEXT,
ADD COLUMN     "signatory3Name" TEXT,
ADD COLUMN     "signatory3Title" TEXT,
ADD COLUMN     "signatory4Name" TEXT,
ADD COLUMN     "signatory4Title" TEXT;

-- AlterTable
ALTER TABLE "work_locations" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "report_lokasi" ADD CONSTRAINT "report_lokasi_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "work_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
