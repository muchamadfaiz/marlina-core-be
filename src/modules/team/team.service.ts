import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PageOptionsDto } from '../../common/dto/page-options.dto';
import { PageMetaDto } from '../../common/dto/page-meta.dto';
import { CreateTeamDto, UpdateTeamDto, TeamResponseDto } from './dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  private mapToResponse(team: any): TeamResponseDto {
    return {
      id: team.id,
      name: team.name,
      description: team.description,
      leaderId: team.leaderId,
      leaderName: team.leader?.profile?.fullName || team.leader?.email || '',
      pengawasId: team.pengawasId || null,
      pengawasName: team.pengawas?.profile?.fullName || team.pengawas?.email || null,
      divisionId: team.divisionId || null,
      divisionName: team.division?.name || null,
      isActive: team.isActive,
      members: (team.members || []).map((m: any) => ({
        id: m.id,
        userId: m.userId,
        fullName: m.user?.profile?.fullName || m.user?.email || '',
        email: m.user?.email || '',
        createdAt: m.createdAt,
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  private readonly includeRelations = {
    leader: { include: { profile: true } },
    pengawas: { include: { profile: true } },
    division: true,
    members: {
      include: {
        user: { include: { profile: true } },
      },
    },
  };

  async create(dto: CreateTeamDto) {
    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        leaderId: dto.leaderId,
        pengawasId: dto.pengawasId || null,
        divisionId: dto.divisionId || null,
        members: dto.memberIds?.length
          ? {
              create: dto.memberIds.map((userId) => ({ userId })),
            }
          : undefined,
      },
      include: this.includeRelations,
    });

    return this.mapToResponse(team);
  }

  async findAll(query: PageOptionsDto) {
    const where = { isActive: true };
    const orderBy = query.sortBy
      ? { [query.sortBy]: query.order }
      : { createdAt: query.order };

    const [teams, totalData] = await Promise.all([
      this.prisma.team.findMany({
        where,
        include: this.includeRelations,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.team.count({ where }),
    ]);

    const data = teams.map((t) => this.mapToResponse(t));
    const meta = new PageMetaDto({ page: query.page, limit: query.limit, totalData });
    return { data, meta };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!team) throw new NotFoundException('Team not found');
    return this.mapToResponse(team);
  }

  async findMyTeam(userId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        isActive: true,
        OR: [
          { leaderId: userId },
          { pengawasId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: this.includeRelations,
    });

    if (!team) return null;
    return this.mapToResponse(team);
  }

  async findSupervisedTeams(pengawasUserId: string) {
    const teams = await this.prisma.team.findMany({
      where: { isActive: true, pengawasId: pengawasUserId },
      include: this.includeRelations,
    });
    return teams.map((t) => this.mapToResponse(t));
  }

  async update(id: string, dto: UpdateTeamDto) {
    const existing = await this.prisma.team.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Team not found');

    // Update team fields
    const team = await this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        leaderId: dto.leaderId,
        ...(dto.pengawasId !== undefined && { pengawasId: dto.pengawasId || null }),
        ...(dto.divisionId !== undefined && { divisionId: dto.divisionId || null }),
      },
      include: this.includeRelations,
    });

    // Sync members if provided
    if (dto.memberIds !== undefined) {
      await this.prisma.teamMember.deleteMany({ where: { teamId: id } });
      if (dto.memberIds.length > 0) {
        await this.prisma.teamMember.createMany({
          data: dto.memberIds.map((userId) => ({ teamId: id, userId })),
        });
      }

      // Re-fetch with updated members
      const updated = await this.prisma.team.findUnique({
        where: { id },
        include: this.includeRelations,
      });
      return this.mapToResponse(updated);
    }

    return this.mapToResponse(team);
  }

  async remove(id: string) {
    const existing = await this.prisma.team.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Team not found');

    await this.prisma.team.delete({ where: { id } });
  }
}
