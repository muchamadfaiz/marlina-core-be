import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class AdminCreateAttendanceDto {
  @ApiProperty({ example: 'uuid-of-target-user', description: 'User ID to create attendance for' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'CHECK_IN', enum: ['CHECK_IN', 'CHECK_OUT'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  type: string;

  @ApiPropertyOptional({ example: 'uuid-of-uploaded-selfie-file' })
  @IsUUID()
  @IsOptional()
  selfieFileId?: string;

  @ApiPropertyOptional({ example: 'Absensi manual oleh admin' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: -2.976074, description: 'GPS latitude' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 104.775429, description: 'GPS longitude' })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({
    example: 'uuid-of-work-location',
    description: 'Work location ID (no radius validation for admin)',
  })
  @IsUUID()
  @IsOptional()
  workLocationId?: string;

  @ApiPropertyOptional({
    example: '2026-03-28T07:00:00.000Z',
    description: 'Custom timestamp (defaults to now)',
  })
  @IsDateString()
  @IsOptional()
  createdAt?: string;
}
