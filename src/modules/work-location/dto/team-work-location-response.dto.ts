import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamWorkLocationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty()
  workLocationId: string;

  @ApiProperty()
  workLocationName: string;

  @ApiPropertyOptional()
  workLocationAddress: string | null;

  @ApiProperty({ example: '2026-03-17' })
  assignedDate: string;

  @ApiProperty()
  createdAt: Date;
}
