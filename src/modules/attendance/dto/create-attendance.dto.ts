import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAttendanceDto {
  @ApiProperty({ example: 'CHECK_IN', enum: ['CHECK_IN', 'CHECK_OUT'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  type: string;

  @ApiProperty({ example: 'uuid-of-uploaded-selfie-file' })
  @IsUUID()
  @IsNotEmpty()
  selfieFileId: string;

  @ApiPropertyOptional({ example: 'Laporan harian: selesai meeting pagi' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: -2.976074, description: 'GPS latitude of the user' })
  @IsNumber()
  @IsNotEmpty()
  latitude: number;

  @ApiProperty({ example: 104.775429, description: 'GPS longitude of the user' })
  @IsNumber()
  @IsNotEmpty()
  longitude: number;

  @ApiPropertyOptional({
    example: 'uuid-of-work-location',
    description: 'Work location to validate radius against',
  })
  @IsUUID()
  @IsOptional()
  workLocationId?: string;
}
