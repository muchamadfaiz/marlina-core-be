import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TeamMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional()
  email: string;

  @ApiProperty()
  createdAt: Date;
}

export class TeamResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  leaderId: string;

  @ApiPropertyOptional()
  leaderName: string;

  @ApiPropertyOptional()
  pengawasId: string | null;

  @ApiPropertyOptional()
  pengawasName: string | null;

  @ApiPropertyOptional()
  qcName: string | null;

  @ApiPropertyOptional()
  korlapAsn: string | null;

  @ApiPropertyOptional()
  nipAsn: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  divisionId: string | null;

  @ApiPropertyOptional()
  divisionName: string | null;

  @ApiPropertyOptional()
  jamMasuk: string | null;

  @ApiPropertyOptional()
  jamPulang: string | null;

  @ApiPropertyOptional()
  batasTelat: string | null;

  @ApiPropertyOptional()
  batasPulangCepat: string | null;

  @ApiProperty({ type: [TeamMemberResponseDto] })
  members: TeamMemberResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
