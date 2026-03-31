import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsDateString,
  ArrayMaxSize,
  IsUUID,
  IsInt,
  IsNumber,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReportLokasiDto {
  @ApiPropertyOptional({ description: 'Work location ID' })
  @IsOptional()
  @IsUUID('4')
  workLocationId?: string;

  @ApiPropertyOptional({ description: 'Manual location name (if workLocationId is null)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Alamat lengkap pekerjaan' })
  @IsOptional()
  @IsString()
  alamatLengkap?: string;

  @ApiPropertyOptional({ description: 'Kegiatan', example: 'Normalisasi Vegetasi Anak Sungai' })
  @IsOptional()
  @IsString()
  kegiatan?: string;

  @ApiPropertyOptional({ description: 'Panjang (meter)', example: 57 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  panjang?: number;

  @ApiPropertyOptional({ description: 'Lebar (meter)', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lebar?: number;

  @ApiPropertyOptional({ description: 'Lebar Atas (meter)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lebarAtas?: number;

  @ApiPropertyOptional({ description: 'Lebar Bawah (meter)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lebarBawah?: number;

  @ApiPropertyOptional({ description: 'Kedalaman (meter)', example: 1.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  kedalaman?: number;

  @ApiPropertyOptional({ description: 'Sedimen (meter)', example: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sedimen?: number;

  // Koordinat lokasi manual
  @ApiPropertyOptional({ description: 'Latitude', example: -2.991114 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: 104.770945 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;

  // Fields untuk format sosialisasi
  @ApiPropertyOptional({ description: 'Sub DAS', example: 'Seberang Ulu' })
  @IsOptional()
  @IsString()
  subDas?: string;

  @ApiPropertyOptional({ description: 'Kendala', example: 'Banjir' })
  @IsOptional()
  @IsString()
  kendala?: string;

  @ApiPropertyOptional({ description: 'Solusi', example: 'Mengajak wrg ikut gabung KMPS' })
  @IsOptional()
  @IsString()
  solusi?: string;

  @ApiPropertyOptional({ description: 'Jenis Bangunan yg Menghalangi', example: 'Lainnya' })
  @IsOptional()
  @IsString()
  jenisBangunan?: string;

  @ApiPropertyOptional({ description: 'Status Kegiatan', example: 'Sosialisasi' })
  @IsOptional()
  @IsString()
  statusKegiatan?: string;
}

export class CreateReportDto {
  @ApiProperty({ example: 'Laporan Harian 27-03-2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Detail kegiatan hari ini...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ enum: ['draft', 'submitted'], default: 'draft' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: '2026-03-27' })
  @IsString()
  @IsNotEmpty()
  reportDate: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoFileIds?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoLabels?: string[];

  // New fields for Laporan Kinerja OP
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  weekNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deskripsiKegiatan?: string;

  @ApiPropertyOptional({ example: 'Cuaca Cerah' })
  @IsOptional()
  @IsString()
  kondisiCuaca?: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  waktuMulai?: string;

  @ApiPropertyOptional({ example: '15:00' })
  @IsOptional()
  @IsString()
  waktuSelesai?: string;

  @ApiPropertyOptional({ example: 'sosialisasi' })
  @IsOptional()
  @IsString()
  formatLaporan?: string;

  @ApiPropertyOptional({ description: 'Nama Tim', example: 'SUCI dan VENNY' })
  @IsOptional()
  @IsString()
  namaTim?: string;

  // Alat Berat (for formatLaporan = 'alber')
  @ApiPropertyOptional({ example: 'PC 75' }) @IsOptional() @IsString() alatBeratNama?: string;
  @ApiPropertyOptional({ example: 'SOLAR INDUSTRI' }) @IsOptional() @IsString() alatBeratBahanBakar?: string;

  // Peralatan (optional)
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanCangkul?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanParang?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanPes?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanLori?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanCatut?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanPalu?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) peralatanGarpu?: number;

  // Tenaga kerja (optional)
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) tenagaPengawas?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) tenagaPekerja?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Type(() => Number) tenagaKorlap?: number;

  @ApiPropertyOptional({ type: [ReportLokasiDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportLokasiDto)
  lokasi?: ReportLokasiDto[];

  @ApiPropertyOptional() @IsOptional() @IsString() signatory1Name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory1Title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory2Name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory2Title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory3Name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory3Title?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory4Name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() signatory4Title?: string;
}
