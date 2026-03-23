import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDivisionDto {
  @ApiProperty({ example: 'Alat Berat' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Divisi pengelola alat berat', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
