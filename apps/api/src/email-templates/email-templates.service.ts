import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto } from './dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** List templates: shared ones for the org + user's own private ones */
  async findAll(orgId: string, userId: string) {
    return this.prisma.emailTemplate.findMany({
      where: {
        organizationId: orgId,
        OR: [{ isShared: true }, { createdById: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async create(dto: CreateEmailTemplateDto, userId: string, orgId: string) {
    return this.prisma.emailTemplate.create({
      data: {
        organizationId: orgId,
        createdById: userId,
        name: dto.name,
        subject: dto.subject,
        bodyHtml: dto.bodyHtml,
        isShared: dto.isShared ?? true,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async update(
    id: string,
    dto: UpdateEmailTemplateDto,
    userId: string,
    orgId: string,
    role: Role,
  ) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!template) {
      throw new NotFoundException(`Email template ${id} not found`);
    }

    // Only the creator or an ADMIN/SUPER_ADMIN may update
    if (template.createdById !== userId && role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to update this template');
    }

    return this.prisma.emailTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.subject !== undefined && { subject: dto.subject }),
        ...(dto.bodyHtml !== undefined && { bodyHtml: dto.bodyHtml }),
        ...(dto.isShared !== undefined && { isShared: dto.isShared }),
      },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async remove(id: string, userId: string, orgId: string, role: Role) {
    const template = await this.prisma.emailTemplate.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!template) {
      throw new NotFoundException(`Email template ${id} not found`);
    }

    // Only the creator or an ADMIN/SUPER_ADMIN may delete
    if (template.createdById !== userId && role !== Role.ADMIN && role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this template');
    }

    await this.prisma.emailTemplate.delete({ where: { id } });
    return { success: true };
  }
}
