import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({ example: 'Tim Lapangan A' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Tim untuk wilayah utara' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'uuid-of-leader-user' })
  @IsUUID()
  @IsNotEmpty()
  leaderId: string;

  @ApiPropertyOptional({ example: 'uuid-of-pengawas-user', description: 'Pengawas (supervisor) user ID' })
  @IsUUID()
  @IsOptional()
  pengawasId?: string;

  @ApiPropertyOptional({
    example: ['uuid-member-1', 'uuid-member-2'],
    description: 'Array of user IDs to add as members',
  })
  @IsOptional()
  memberIds?: string[];

  @ApiPropertyOptional({ example: 'uuid-of-division', description: 'Division ID' })
  @IsUUID()
  @IsOptional()
  divisionId?: string;

  @ApiPropertyOptional({ example: '07:00', description: 'Team start time (HH:mm)' })
  @IsString()
  @IsOptional()
  jamMasuk?: string;

  @ApiPropertyOptional({ example: '15:00', description: 'Team end time (HH:mm)' })
  @IsString()
  @IsOptional()
  jamPulang?: string;

  @ApiPropertyOptional({ example: '07:15', description: 'Late threshold (HH:mm)' })
  @IsString()
  @IsOptional()
  batasTelat?: string;

  @ApiPropertyOptional({ example: '14:30', description: 'Early leave threshold (HH:mm)' })
  @IsString()
  @IsOptional()
  batasPulangCepat?: string;
}
