import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import {
  AssignPermissionsDto,
  CreatePermissionDto,
  CreateRoleDto,
} from './dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Roles ───

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async createRole(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Role name already exists');
    }

    return this.prisma.role.create({ data: { name: dto.name } });
  }

  async updateRole(id: string, dto: CreateRoleDto) {
    await this.findRoleById(id);

    return this.prisma.role.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteRole(id: string) {
    const role = await this.findRoleById(id);

    if (['ADMIN', 'USER'].includes(role.name)) {
      throw new BadRequestException('Cannot delete built-in role');
    }

    await this.prisma.role.delete({ where: { id } });
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    await this.findRoleById(roleId);

    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });

      await tx.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });

    return this.findRoleById(roleId);
  }

  // ─── Permissions ───

  async findAllPermissions() {
    return this.prisma.permission.findMany({ orderBy: { name: 'asc' } });
  }

  async createPermission(dto: CreatePermissionDto) {
    const existing = await this.prisma.permission.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Permission name already exists');
    }

    return this.prisma.permission.create({
      data: { name: dto.name, description: dto.description },
    });
  }

  async deletePermission(id: string) {
    const perm = await this.prisma.permission.findUnique({ where: { id } });

    if (!perm) {
      throw new NotFoundException('Permission not found');
    }

    await this.prisma.permission.delete({ where: { id } });
  }
}
