import { AttendanceResponseDto } from '../dto';

interface OperationalHourMap {
  [dayOfWeek: number]: { startTime: string; endTime: string; isActive: boolean };
}

const LATE_TOLERANCE_MINUTES = 15;

function addMinutes(time: string, minutes: number): string {
  const [hh, mm] = time.split(':').map(Number);
  const total = hh * 60 + mm + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function computeStatus(
  type: string,
  createdAt: Date,
  opHours: OperationalHourMap,
): string {
  const date = new Date(createdAt);
  const dayOfWeek = date.getDay();
  const opHour = opHours[dayOfWeek];

  if (!opHour || !opHour.isActive) return 'unknown';

  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const time = `${hh}:${mm}`;

  if (type === 'CHECK_IN') {
    const lateThreshold = addMinutes(opHour.startTime, LATE_TOLERANCE_MINUTES);
    return time <= lateThreshold ? 'on_time' : 'late';
  }

  if (type === 'CHECK_OUT') {
    return time >= opHour.endTime ? 'on_time' : 'early_leave';
  }

  return 'unknown';
}

export function mapAttendanceToResponse(
  attendance: any,
  opHours?: OperationalHourMap,
): AttendanceResponseDto {
  return {
    id: attendance.id,
    userId: attendance.userId,
    userName: attendance.user?.profile?.fullName || attendance.user?.email || undefined,
    userEmail: attendance.user?.email || undefined,
    type: attendance.type,
    selfieFileId: attendance.selfieFileId,
    description: attendance.description,
    latitude: attendance.latitude,
    longitude: attendance.longitude,
    workLocationId: attendance.workLocationId,
    workLocationName: attendance.workLocation?.name || undefined,
    status: opHours ? computeStatus(attendance.type, attendance.createdAt, opHours) : undefined,
    submittedById: attendance.submittedById,
    createdAt: attendance.createdAt,
  };
}
