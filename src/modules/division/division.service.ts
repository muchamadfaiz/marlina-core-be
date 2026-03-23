import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PageMetaDto, PageOptionsDto } from '../../common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDivisionDto, UpdateDivisionDto } from './dto';

@Injectable()
export class DivisionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDivisionDto) {
    const existing = await this.prisma.division.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Division name already exists');
    }

    return this.prisma.division.create({
      data: dto,
    });
  }

  async findAll(query: PageOptionsDto) {
    const [divisions, totalData] = await Promise.all([
      this.prisma.division.findMany({
        skip: query.skip,
        take: query.limit,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.order }
          : { name: 'asc' },
      }),
      this.prisma.division.count(),
    ]);

    const meta = new PageMetaDto({
      page: query.page,
      limit: query.limit,
      totalData,
    });

    return { data: divisions, meta };
  }

  async findOne(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
    });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    return division;
  }

  async update(id: string, dto: UpdateDivisionDto) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.prisma.division.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Division name already exists');
      }
    }

    return this.prisma.division.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.division.delete({
      where: { id },
    });
  }
}
