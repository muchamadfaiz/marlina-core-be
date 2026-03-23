import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import {
  CreateWorkLocationDto,
  UpdateWorkLocationDto,
  WorkLocationResponseDto,
  AssignTeamWorkLocationDto,
  TeamWorkLocationResponseDto,
  WorkLocationQueryDto,
} from './dto';

@Injectable()
export class WorkLocationService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToResponse(loc: any): WorkLocationResponseDto {
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius: loc.radius,
      isActive: loc.isActive,
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
    };
  }

  async create(dto: CreateWorkLocationDto) {
    const loc = await this.prisma.workLocation.create({
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius ?? 100,
        isActive: dto.isActive ?? true,
      },
    });

    return this.mapToResponse(loc);
  }

  async findAll(query: WorkLocationQueryDto) {
    const where = typeof query.active === 'boolean' ? { isActive: query.active } : {};
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [locations, totalData] = await Promise.all([
      this.prisma.workLocation.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.workLocation.count({ where }),
    ]);

    const data = locations.map((l) => this.mapToResponse(l));
    const meta = new PageMetaDto({ page: query.page, limit: query.limit, totalData });
    return { data, meta };
  }

  async findOne(id: string) {
    const loc = await this.prisma.workLocation.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException('Work location not found');
    return this.mapToResponse(loc);
  }

  async update(id: string, dto: UpdateWorkLocationDto) {
    const existing = await this.prisma.workLocation.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Work location not found');

    const loc = await this.prisma.workLocation.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        latitude: dto.latitude,
        longitude: dto.longitude,
        radius: dto.radius,
        isActive: dto.isActive,
      },
    });

    return this.mapToResponse(loc);
  }

  async remove(id: string) {
    const existing = await this.prisma.workLocation.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Work location not found');

    await this.prisma.workLocation.delete({ where: { id } });
  }

  // ── TeamWorkLocation assignments ──

  private mapAssignToResponse(assign: any): TeamWorkLocationResponseDto {
    return {
      id: assign.id,
      teamId: assign.teamId,
      teamName: assign.team?.name || '',
      workLocationId: assign.workLocationId,
      workLocationName: assign.workLocation?.name || '',
      workLocationAddress: assign.workLocation?.address || null,
      assignedDate: assign.assignedDate instanceof Date
        ? assign.assignedDate.toISOString().split('T')[0]
        : String(assign.assignedDate).split('T')[0],
      createdAt: assign.createdAt,
    };
  }

  private readonly assignInclude = {
    team: true,
    workLocation: true,
  };

  async assignTeam(dto: AssignTeamWorkLocationDto) {
    // Validate team exists
    const team = await this.prisma.team.findUnique({ where: { id: dto.teamId } });
    if (!team) throw new NotFoundException('Team not found');

    // Validate work location exists
    const loc = await this.prisma.workLocation.findUnique({ where: { id: dto.workLocationId } });
    if (!loc) throw new NotFoundException('Work location not found');

    // Check duplicate
    const existing = await this.prisma.teamWorkLocation.findUnique({
      where: {
        teamId_workLocationId_assignedDate: {
          teamId: dto.teamId,
          workLocationId: dto.workLocationId,
          assignedDate: new Date(dto.assignedDate),
        },
      },
    });
    if (existing) {
      throw new BadRequestException('Team is already assigned to this location on this date');
    }

    const assign = await this.prisma.teamWorkLocation.create({
      data: {
        teamId: dto.teamId,
        workLocationId: dto.workLocationId,
        assignedDate: new Date(dto.assignedDate),
      },
      include: this.assignInclude,
    });

    return this.mapAssignToResponse(assign);
  }

  async findAssignmentsByDate(date: string) {
    const assigns = await this.prisma.teamWorkLocation.findMany({
      where: { assignedDate: new Date(date) },
      include: this.assignInclude,
      orderBy: { createdAt: 'desc' },
    });
    return assigns.map((a) => this.mapAssignToResponse(a));
  }

  async findAssignmentsByTeam(teamId: string) {
    const assigns = await this.prisma.teamWorkLocation.findMany({
      where: { teamId },
      include: this.assignInclude,
      orderBy: { assignedDate: 'desc' },
    });
    return assigns.map((a) => this.mapAssignToResponse(a));
  }

  async findAssignmentsByWorkLocation(workLocationId: string) {
    const assigns = await this.prisma.teamWorkLocation.findMany({
      where: { workLocationId },
      include: this.assignInclude,
      orderBy: { assignedDate: 'desc' },
    });
    return assigns.map((a) => this.mapAssignToResponse(a));
  }

  async findUpcomingAssignments(days = 7) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const assigns = await this.prisma.teamWorkLocation.findMany({
      where: {
        assignedDate: {
          gte: today,
          lt: endDate,
        },
      },
      include: this.assignInclude,
      orderBy: { assignedDate: 'asc' },
    });
    return assigns.map((a) => this.mapAssignToResponse(a));
  }

  async removeAssignment(id: string) {
    const existing = await this.prisma.teamWorkLocation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Assignment not found');
    await this.prisma.teamWorkLocation.delete({ where: { id } });
  }
}
