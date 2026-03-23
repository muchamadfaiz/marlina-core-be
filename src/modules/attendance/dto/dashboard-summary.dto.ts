import { ApiProperty } from '@nestjs/swagger';
import { AttendanceResponseDto } from './attendance-response.dto';

export class AbsentOfficerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;
}

export class MapMarkerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userName: string;

  @ApiProperty()
  latitude: number;

  @ApiProperty()
  longitude: number;

  @ApiProperty({ required: false })
  workLocationName?: string;

  @ApiProperty()
  createdAt: Date;
}

export class DashboardSummaryDto {
  @ApiProperty()
  totalOfficers: number;

  @ApiProperty()
  presentToday: number;

  @ApiProperty()
  onTimeCount: number;

  @ApiProperty()
  lateCount: number;

  @ApiProperty()
  absentCount: number;

  @ApiProperty({ type: [AbsentOfficerDto] })
  absentOfficers: AbsentOfficerDto[];

  @ApiProperty({ type: [AttendanceResponseDto] })
  todayAttendances: AttendanceResponseDto[];

  @ApiProperty({ type: [MapMarkerDto] })
  todayMarkers: MapMarkerDto[];
}
