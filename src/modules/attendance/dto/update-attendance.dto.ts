import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class UpdateAttendanceDto {
  @ApiPropertyOptional({ example: 'CHECK_IN', enum: ['CHECK_IN', 'CHECK_OUT'] })
  @IsString()
  @IsOptional()
  @IsIn(['CHECK_IN', 'CHECK_OUT'])
  type?: string;

  @ApiPropertyOptional({ example: 'Laporan harian: selesai meeting pagi' })
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

  @ApiPropertyOptional({ example: '2026-03-28T07:00:00.000Z', description: 'Override attendance timestamp' })
  @IsDateString()
  @IsOptional()
  createdAt?: string;
}
