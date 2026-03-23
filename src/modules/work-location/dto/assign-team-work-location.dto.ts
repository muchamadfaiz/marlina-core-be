import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTeamWorkLocationDto {
  @ApiProperty({ example: 'uuid-team-id' })
  @IsUUID()
  @IsNotEmpty()
  teamId: string;

  @ApiProperty({ example: 'uuid-work-location-id' })
  @IsUUID()
  @IsNotEmpty()
  workLocationId: string;

  @ApiProperty({ example: '2026-03-17', description: 'Assigned date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  assignedDate: string;
}
