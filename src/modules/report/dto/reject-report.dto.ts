import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectReportDto {
  @ApiProperty({ description: 'Alasan penolakan', example: 'Foto tidak lengkap' })
  @IsString()
  @IsNotEmpty({ message: 'Alasan penolakan wajib diisi' })
  rejectionNote: string;
}
