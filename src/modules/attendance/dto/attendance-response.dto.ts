import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  userEmail?: string;

  @ApiProperty({ enum: ['CHECK_IN', 'CHECK_OUT'] })
  type: string;

  @ApiProperty()
  selfieFileId: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  latitude?: number;

  @ApiPropertyOptional()
  longitude?: number;

  @ApiPropertyOptional()
  workLocationId?: string;

  @ApiPropertyOptional()
  workLocationName?: string;

  @ApiPropertyOptional({ enum: ['on_time', 'late', 'early_leave', 'unknown'] })
  status?: string;

  @ApiProperty()
  submittedById: string;

  @ApiProperty()
  createdAt: Date;
}
