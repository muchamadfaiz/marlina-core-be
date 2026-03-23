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
  @ApiProperty({ description: 'Work location ID' })
  @IsUUID('4')
  workLocationId: string;

  @ApiProperty({ description: 'Kegiatan', example: 'Normalisasi Vegetasi Anak Sungai' })
  @IsString()
  @IsNotEmpty()
  kegiatan: string;

  @ApiProperty({ description: 'Panjang (meter)', example: 57 })
  @IsNumber()
  @Min(0)
  panjang: number;

  @ApiProperty({ description: 'Lebar (meter)', example: 4 })
  @IsNumber()
  @Min(0)
  lebar: number;
}

export class CreateReportDto {
  @ApiProperty({ description: 'Report title', example: 'Laporan Kinerja TIM OP BUSET' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Report content (HTML)', example: '<p>Isi laporan...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Report status',
    enum: ['draft', 'submitted'],
    default: 'draft',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ description: 'Report date (YYYY-MM-DD)', example: '2026-03-15' })
  @IsDateString()
  reportDate: string;

  @ApiPropertyOptional({
    description: 'Array of uploaded file IDs (max 8)',
    example: ['uuid-1', 'uuid-2'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUUID('4', { each: true })
  photoFileIds?: string[];

  @ApiPropertyOptional({ description: 'Photo labels', example: ['Progress 0%', 'Progress 0%'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photoLabels?: string[];

  // --- New fields for Laporan Kinerja OP ---

  @ApiPropertyOptional({ description: 'Minggu ke' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  weekNumber?: number;

  @ApiPropertyOptional({ description: 'Deskripsi kegiatan' })
  @IsOptional()
  @IsString()
  deskripsiKegiatan?: string;

  @ApiPropertyOptional({ description: 'Kondisi cuaca', example: 'Cuaca Cerah' })
  @IsOptional()
  @IsString()
  kondisiCuaca?: string;

  @ApiPropertyOptional({ description: 'Waktu mulai', example: '08:00' })
  @IsOptional()
  @IsString()
  waktuMulai?: string;

  @ApiPropertyOptional({ description: 'Waktu selesai', example: '15:00' })
  @IsOptional()
  @IsString()
  waktuSelesai?: string;

  // Peralatan
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanCangkul?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanParang?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanPes?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanLori?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanCatut?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanPalu?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) peralatanGarpu?: number;

  // Tenaga kerja
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) tenagaPengawas?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) tenagaPekerja?: number;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Type(() => Number) tenagaKorlap?: number;

  // Lokasi
  @ApiPropertyOptional({ description: 'Array of lokasi entries', type: [ReportLokasiDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportLokasiDto)
  lokasi?: ReportLokasiDto[];
}
