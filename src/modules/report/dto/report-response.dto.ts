import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportPhotoDto {
  @ApiProperty() id: string;
  @ApiProperty() fileId: string;
  @ApiProperty() order: number;
  @ApiProperty() url: string;
  @ApiPropertyOptional() secureUrl?: string;
  @ApiPropertyOptional() label?: string;
}

export class ReportLokasiResponseDto {
  @ApiProperty() id: string;
  @ApiPropertyOptional() workLocationId?: string;
  @ApiPropertyOptional() workLocationName?: string;
  @ApiPropertyOptional() workLocationAddress?: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() alamatLengkap?: string;
  @ApiPropertyOptional() kegiatan?: string;
  @ApiPropertyOptional() panjang?: number;
  @ApiPropertyOptional() lebar?: number;
  @ApiPropertyOptional() lebarAtas?: number;
  @ApiPropertyOptional() lebarBawah?: number;
  @ApiPropertyOptional() kedalaman?: number;
  @ApiPropertyOptional() sedimen?: number;
  @ApiPropertyOptional() latitude?: number;
  @ApiPropertyOptional() longitude?: number;
  @ApiPropertyOptional() subDas?: string;
  @ApiPropertyOptional() kendala?: string;
  @ApiPropertyOptional() solusi?: string;
  @ApiPropertyOptional() jenisBangunan?: string;
  @ApiPropertyOptional() statusKegiatan?: string;
}

export class ReportResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiPropertyOptional() userName?: string;
  @ApiPropertyOptional() creatorTeam?: {
    id: string;
    name: string;
    leaderName?: string;
    qcName?: string;
    pengawasName?: string;
    korlapAsn?: string;
    nipAsn?: string;
  };
  @ApiPropertyOptional() divisionName?: string;
  @ApiProperty() title: string;
  @ApiProperty() content: string;
  @ApiProperty() status: string;
  @ApiProperty() reportDate: string;
  @ApiProperty({ type: [ReportPhotoDto] }) photos: ReportPhotoDto[];

  // New fields
  @ApiPropertyOptional() weekNumber?: number;
  @ApiPropertyOptional() deskripsiKegiatan?: string;
  @ApiPropertyOptional() kondisiCuaca?: string;
  @ApiPropertyOptional() waktuMulai?: string;
  @ApiPropertyOptional() waktuSelesai?: string;
  @ApiPropertyOptional() formatLaporan?: string;
  @ApiPropertyOptional() namaTim?: string;

  @ApiPropertyOptional() peralatanCangkul?: number;
  @ApiPropertyOptional() peralatanParang?: number;
  @ApiPropertyOptional() peralatanPes?: number;
  @ApiPropertyOptional() peralatanLori?: number;
  @ApiPropertyOptional() peralatanCatut?: number;
  @ApiPropertyOptional() peralatanPalu?: number;
  @ApiPropertyOptional() peralatanGarpu?: number;

  @ApiPropertyOptional() tenagaPengawas?: number;
  @ApiPropertyOptional() tenagaPekerja?: number;
  @ApiPropertyOptional() tenagaKorlap?: number;

  @ApiPropertyOptional({ type: [ReportLokasiResponseDto] }) lokasi?: ReportLokasiResponseDto[];

  @ApiPropertyOptional() signatory1Name?: string;
  @ApiPropertyOptional() signatory1Title?: string;
  @ApiPropertyOptional() signatory2Name?: string;
  @ApiPropertyOptional() signatory2Title?: string;
  @ApiPropertyOptional() signatory3Name?: string;
  @ApiPropertyOptional() signatory3Title?: string;
  @ApiPropertyOptional() signatory4Name?: string;
  @ApiPropertyOptional() signatory4Title?: string;

  @ApiPropertyOptional() approvedById?: string;
  @ApiPropertyOptional() approvedByName?: string;
  @ApiPropertyOptional() approvedAt?: Date;

  @ApiPropertyOptional() rejectedById?: string;
  @ApiPropertyOptional() rejectedByName?: string;
  @ApiPropertyOptional() rejectedAt?: Date;
  @ApiPropertyOptional() rejectionNote?: string;

  @ApiPropertyOptional({ description: 'Auto-fetched attendance photos for reportDate' })
  attendancePhotos?: {
    checkIn?: { fileId: string; url: string; secureUrl: string; createdAt: Date };
    checkOut?: { fileId: string; url: string; secureUrl: string; createdAt: Date };
  };

  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
