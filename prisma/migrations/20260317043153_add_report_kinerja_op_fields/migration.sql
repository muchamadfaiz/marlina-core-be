-- AlterTable
ALTER TABLE "report_photos" ADD COLUMN     "label" TEXT;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "deskripsiKegiatan" TEXT,
ADD COLUMN     "kondisiCuaca" TEXT,
ADD COLUMN     "peralatanCangkul" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanCatut" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanGarpu" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanLori" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanPalu" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanParang" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "peralatanPes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenagaKorlap" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenagaPekerja" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tenagaPengawas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "waktuMulai" TEXT,
ADD COLUMN     "waktuSelesai" TEXT,
ADD COLUMN     "weekNumber" INTEGER;

-- CreateTable
CREATE TABLE "report_lokasi" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "workLocationId" TEXT NOT NULL,
    "kegiatan" TEXT NOT NULL,
    "panjang" DOUBLE PRECISION NOT NULL,
    "lebar" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_lokasi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "report_lokasi" ADD CONSTRAINT "report_lokasi_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_lokasi" ADD CONSTRAINT "report_lokasi_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "work_locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
