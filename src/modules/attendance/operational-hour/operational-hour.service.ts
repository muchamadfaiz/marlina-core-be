import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SetOperationalHoursDto } from './dto';

@Injectable()
export class OperationalHourService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operationalHour.findMany({
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async bulkUpsert(dto: SetOperationalHoursDto) {
    const results = await Promise.all(
      dto.items.map((item) =>
        this.prisma.operationalHour.upsert({
          where: { dayOfWeek: item.dayOfWeek },
          update: {
            startTime: item.startTime,
            endTime: item.endTime,
            isActive: item.isActive,
          },
          create: {
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
            isActive: item.isActive,
          },
        }),
      ),
    );

    return results;
  }
}
