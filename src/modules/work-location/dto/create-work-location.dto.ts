import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateWorkLocationDto {
  @ApiProperty({ example: 'Kantor Dinas PUPR' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Jl. Merdeka No. 10, Palembang' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: -2.976074 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 104.775429 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 100, description: 'Geofence radius in meters' })
  @IsInt()
  @Min(10)
  @Max(5000)
  @IsOptional()
  radius?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
