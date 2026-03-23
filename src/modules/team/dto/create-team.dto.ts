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
}
