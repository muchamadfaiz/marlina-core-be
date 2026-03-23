import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID, IsIn } from 'class-validator';

export class UpsertPdfSettingDto {
  @ApiProperty({
    description: 'Setting key',
    enum: ['logo', 'signature_1', 'signature_2', 'signature_3', 'signature_4'],
  })
  @IsString()
  @IsIn(['logo', 'signature_1', 'signature_2', 'signature_3', 'signature_4'])
  key: string;

  @ApiPropertyOptional({ description: 'Person name (for signatures)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Job title (for signatures)' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Uploaded file ID (logo or signature image)' })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

export class PdfSettingResponseDto {
  @ApiProperty() key: string;
  @ApiPropertyOptional() name?: string;
  @ApiPropertyOptional() title?: string;
  @ApiPropertyOptional() fileId?: string;
  @ApiPropertyOptional() fileUrl?: string;
}
