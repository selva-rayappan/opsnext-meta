import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CustomField, CustomFieldValue, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto, CustomFieldEntityType } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';

/**
 * CustomFieldsService manages the custom field schema (definitions) and
 * their values (per-entity instances).
 *
 * The storage model uses a polymorphic `entityType + entityId` approach:
 *  - CustomField defines the schema (name, type, entityType, etc.)
 *  - CustomFieldValue stores the actual value for a specific entity instance
 *
 * No FK constraint exists between CustomFieldValue.entityId and the entity
 * tables — this is intentional to keep the model generic. Callers are
 * responsible for only passing IDs of entities they have verified exist.
 */
@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Schema management (CustomField definitions)
  // ---------------------------------------------------------------------------

  /**
   * Returns all custom field definitions for the org, optionally filtered
   * to a specific entity type.
   */
  async findAll(orgId: string, entityType?: CustomFieldEntityType): Promise<CustomField[]> {
    return this.prisma.customField.findMany({
      where: {
        organizationId: orgId,
        ...(entityType ? { entityType } : {}),
      },
      orderBy: [{ entityType: 'asc' }, { order: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Creates a new custom field definition.
   * Field names are unique per (org, entityType) combination.
   */
  async create(dto: CreateCustomFieldDto, orgId: string): Promise<CustomField> {
    // Validate select/multiselect options are provided
    if (
      (dto.fieldType === 'select' || dto.fieldType === 'multiselect') &&
      (!dto.options || dto.options.length === 0)
    ) {
      throw new BadRequestException(
        `Field type "${dto.fieldType}" requires at least one option`,
      );
    }

    // Enforce unique name per org+entityType
    const existing = await this.prisma.customField.findFirst({
      where: {
        organizationId: orgId,
        entityType: dto.entityType,
        name: dto.name,
      },
    });
    if (existing) {
      throw new ConflictException(
        `A custom field named "${dto.name}" already exists for ${dto.entityType}`,
      );
    }

    return this.prisma.customField.create({
      data: {
        organizationId: orgId,
        entityType: dto.entityType,
        name: dto.name,
        fieldType: dto.fieldType,
        isRequired: dto.isRequired ?? false,
        // options stored as a JSON array
        options: dto.options ? (dto.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        order: dto.order ?? 0,
      },
    });
  }

  /**
   * Partially updates a custom field definition.
   * Note: entityType cannot be changed (would orphan stored values).
   */
  async update(id: string, dto: UpdateCustomFieldDto, orgId: string): Promise<CustomField> {
    const existing = await this.prisma.customField.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`Custom field ${id} not found`);
    }

    // If name is being changed, check for duplicate within same entityType
    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.prisma.customField.findFirst({
        where: {
          organizationId: orgId,
          entityType: existing.entityType,
          name: dto.name,
          NOT: { id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `A custom field named "${dto.name}" already exists for ${existing.entityType}`,
        );
      }
    }

    // Validate that select/multiselect still has options if fieldType is changed
    const newFieldType = dto.fieldType ?? existing.fieldType;
    const newOptions = dto.options ?? (existing.options as string[] | null);
    if (
      (newFieldType === 'select' || newFieldType === 'multiselect') &&
      (!newOptions || (newOptions as string[]).length === 0)
    ) {
      throw new BadRequestException(
        `Field type "${newFieldType}" requires at least one option`,
      );
    }

    return this.prisma.customField.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.fieldType !== undefined && { fieldType: dto.fieldType }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.options !== undefined && {
          options: dto.options as unknown as Prisma.InputJsonValue,
        }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  /**
   * Deletes a custom field definition and ALL of its stored values.
   * Values are removed by the DB cascade defined on CustomFieldValue.fieldId.
   */
  async delete(id: string, orgId: string): Promise<void> {
    const existing = await this.prisma.customField.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!existing) {
      throw new NotFoundException(`Custom field ${id} not found`);
    }

    // DB cascade on CustomFieldValue.fieldId handles value deletion
    await this.prisma.customField.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------------
  // Value management (CustomFieldValue instances)
  // ---------------------------------------------------------------------------

  /**
   * Returns the stored value for a specific (fieldId, entityId) pair.
   * Returns null if no value has been set yet.
   */
  async getValue(fieldId: string, entityId: string): Promise<CustomFieldValue | null> {
    return this.prisma.customFieldValue.findFirst({
      where: { fieldId, entityId },
    });
  }

  /**
   * Creates or updates the value for a specific (fieldId, entityType, entityId) triple.
   * Uses upsert to be idempotent — safe to call multiple times with new values.
   *
   * @param value - The JSON-serialisable value to store. Callers are responsible
   *                for passing values compatible with the field's fieldType.
   */
  async setValue(
    fieldId: string,
    entityType: CustomFieldEntityType,
    entityId: string,
    value: unknown,
    orgId: string,
  ): Promise<CustomFieldValue> {
    // Verify the field exists and belongs to this org
    const field = await this.prisma.customField.findFirst({
      where: { id: fieldId, organizationId: orgId },
    });
    if (!field) {
      throw new NotFoundException(`Custom field ${fieldId} not found`);
    }

    if (field.entityType !== entityType) {
      throw new BadRequestException(
        `Custom field ${fieldId} is for entity type "${field.entityType}", not "${entityType}"`,
      );
    }

    return this.prisma.customFieldValue.upsert({
      where: { fieldId_entityId: { fieldId, entityId } },
      create: {
        fieldId,
        entityType,
        entityId,
        value: value as Prisma.InputJsonValue,
      },
      update: {
        value: value as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Returns all custom field values for a specific entity instance, keyed by
   * fieldId. Each entry includes the field definition alongside the stored value.
   */
  async getEntityValues(
    entityType: CustomFieldEntityType,
    entityId: string,
    orgId: string,
  ): Promise<Array<{ field: CustomField; value: CustomFieldValue | null }>> {
    // Fetch all field definitions for this entity type in the org
    const fields = await this.prisma.customField.findMany({
      where: { organizationId: orgId, entityType },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });

    if (fields.length === 0) {
      return [];
    }

    // Fetch all stored values for this entity in a single query
    const storedValues = await this.prisma.customFieldValue.findMany({
      where: {
        entityType,
        entityId,
        fieldId: { in: fields.map((f) => f.id) },
      },
    });

    const valuesByFieldId = new Map(storedValues.map((v) => [v.fieldId, v]));

    return fields.map((field) => ({
      field,
      value: valuesByFieldId.get(field.id) ?? null,
    }));
  }
}
