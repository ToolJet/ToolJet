import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DeleteResult, EntityManager } from 'typeorm';
import { CreateOrganizationConstantDto, UpdateOrganizationConstantDto } from '@modules/organization-constants/dto';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OrganizationConstant } from '@entities/organization_constants.entity';
import { OrgEnvironmentConstantValue } from '@entities/org_environment_constant_values.entity';
import { AppEnvironmentUtilService } from '@modules/app-environments/util.service';
import { IOrganizationConstantsService } from './interfaces/IService';
import { OrganizationConstantsUtilService } from './util.service';
import { ConstantSource, OrganizationConstantType, SECRET_VALUE_MASK } from './constants';
import { OrganizationConstantRepository } from './repository';
import {
  BulkDeleteConstantsPayload,
  ConstantDetailPayload,
  ConstantListItemPayload,
  ConstantListPayload,
  ConstantWithEnvironmentValues,
} from './types';
import { ListConstantsQueryDto } from './dto/v2/list-constants.query.dto';
import { CreateConstantDto } from './dto/v2/create-constant.dto';
import { UpdateConstantValuesDto } from './dto/v2/update-constant.dto';
import {
  EnvironmentValueWrite,
  isDuplicateConstantError,
  resolveCreateWrites,
  resolveUpdateWrites,
} from './helpers/constant-values';
import {
  buildConstantsPage,
  ConstantListRow,
  mergeConstantRows,
  toEnvironmentConstantRow,
  toUserRef,
  toWorkspaceConstantRow,
} from './helpers/constants-list';

function toListItemPayload(row: ConstantListRow, value: string | null): ConstantListItemPayload {
  const isEditable = row.source === ConstantSource.WORKSPACE;
  return {
    kind: 'constant',
    id: row.id,
    name: row.name,
    type: row.type,
    source: row.source,
    value,
    environments_with_value: row.environmentIdsWithValue,
    last_modified_at: row.lastModifiedAt?.toISOString() ?? null,
    owner: row.owner,
    modified_by: row.modifiedBy,
    actions: { edit: isEditable, delete: isEditable },
  };
}

@Injectable()
export class OrganizationConstantsService implements IOrganizationConstantsService {
  constructor(
    protected readonly organizationConstantRepository: OrganizationConstantRepository,
    protected readonly organizationConstantsUtilService: OrganizationConstantsUtilService,
    protected readonly appEnvironmentUtilService: AppEnvironmentUtilService
  ) {}

  // Edition seam: `.env` constants exist only in the enterprise edition, so CE has none.
  protected async listEnvironmentConstants(organizationId: string): Promise<ConstantWithEnvironmentValues[]> {
    return [];
  }

  // Edition seam: whether each environment can hold its own value. Used by the write paths.
  protected async isMultiEnvironmentEnabled(organizationId: string): Promise<boolean> {
    return false;
  }

  async listConstants(organizationId: string, query: ListConstantsQueryDto): Promise<ConstantListPayload> {
    const environments = await this.appEnvironmentUtilService.getAll(organizationId);
    if (!environments.some((environment) => environment.id === query.environment_id)) {
      throw new BadRequestException('environment_id is not an environment of this workspace');
    }

    const [records, envConstants] = await Promise.all([
      this.organizationConstantRepository.findWithValuesAndUsers(organizationId),
      this.listEnvironmentConstants(organizationId),
    ]);
    const workspaceRows = records
      .map((record) => toWorkspaceConstantRow(record, query.environment_id))
      .filter((row): row is ConstantListRow => row !== null);
    // An .env constant only hides a database one when it has a value in this environment.
    const envRows = envConstants
      .map((constant) => toEnvironmentConstantRow(constant, query.environment_id))
      .filter((row): row is ConstantListRow => row !== null);

    const page = buildConstantsPage(mergeConstantRows(workspaceRows, envRows), {
      type: query.type,
      search: query.search,
      sources: query.source,
      sort: query.sort,
      page: query.page,
      perPage: query.per_page,
    });

    // Decrypt only the Globals on the returned page, never the whole workspace.
    const items = await Promise.all(
      page.items.map(async (row) => toListItemPayload(row, await this.resolveListValue(organizationId, row)))
    );

    return { items, page: query.page, page_size: query.per_page, total: page.total, counts: page.counts };
  }

  // Secrets resolve to null: their plaintext must not leave the server. `.env` values are already plaintext.
  private async resolveListValue(organizationId: string, row: ConstantListRow): Promise<string | null> {
    if (row.type !== OrganizationConstantType.GLOBAL) return null;
    if (row.source === ConstantSource.ENV) return row.value;
    return this.organizationConstantsUtilService.decryptSecret(organizationId, row.value);
  }

  async getConstant(organizationId: string, constantId: string): Promise<ConstantDetailPayload> {
    const [constant] = await this.organizationConstantRepository.findWithValuesAndUsers(organizationId, constantId);
    if (!constant) {
      throw new NotFoundException('Constant not found');
    }
    const environments = await this.appEnvironmentUtilService.getAll(organizationId);
    const isGlobal = constant.type === OrganizationConstantType.GLOBAL;

    const values = await Promise.all(
      environments.map(async (environment) => {
        const stored = constant.orgEnvironmentConstantValues.find((v) => v.environmentId === environment.id)?.value;
        const hasValue = !!stored;
        return {
          environment_id: environment.id,
          environment_name: environment.name,
          has_value: hasValue,
          value:
            isGlobal && hasValue
              ? await this.organizationConstantsUtilService.decryptSecret(organizationId, stored)
              : null,
        };
      })
    );

    return {
      id: constant.id,
      name: constant.constantName,
      type: constant.type,
      owner: toUserRef(constant.createdByUser),
      modified_by: toUserRef(constant.updatedByUser),
      last_modified_at: constant.updatedAt.toISOString(),
      created_at: constant.createdAt.toISOString(),
      values,
    };
  }

  async createConstant(organizationId: string, userId: string, dto: CreateConstantDto): Promise<ConstantDetailPayload> {
    const environmentIds = (await this.appEnvironmentUtilService.getAll(organizationId)).map((env) => env.id);
    const writes = resolveCreateWrites(
      dto.values,
      environmentIds,
      await this.isMultiEnvironmentEnabled(organizationId)
    );

    let constantId: string;
    try {
      constantId = await dbTransactionWrap(async (manager: EntityManager) => {
        const saved = await manager.save(
          OrganizationConstant,
          manager.create(OrganizationConstant, {
            constantName: dto.name,
            organizationId,
            type: dto.type,
            createdBy: userId,
            updatedBy: userId,
          })
        );
        await this.organizationConstantsUtilService.createOrgConstantsInAllEnvironments(
          organizationId,
          saved.id,
          manager
        );
        await this.writeValues(organizationId, saved.id, userId, writes, manager);
        return saved.id;
      });
    } catch (error) {
      // No pre-check for an existing name: it would race with a concurrent create. The unique constraint decides.
      if (isDuplicateConstantError(error)) {
        throw new ConflictException(`A ${dto.type} constant named "${dto.name}" already exists`);
      }
      throw error;
    }

    return this.getConstant(organizationId, constantId);
  }

  async updateConstantValues(
    organizationId: string,
    constantId: string,
    userId: string,
    dto: UpdateConstantValuesDto
  ): Promise<ConstantDetailPayload> {
    const environmentIds = (await this.appEnvironmentUtilService.getAll(organizationId)).map((env) => env.id);
    const isMultiEnvironmentEnabled = await this.isMultiEnvironmentEnabled(organizationId);

    await dbTransactionWrap(async (manager: EntityManager) => {
      // The row lock makes concurrent updates of one constant run one after another, so the
      // "keeps a value" check below always sees the values the previous update left.
      const constant = await manager.findOne(OrganizationConstant, {
        where: { id: constantId, organizationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!constant) {
        throw new NotFoundException('Constant not found');
      }
      const stored = await manager.find(OrgEnvironmentConstantValue, { where: { organizationConstantId: constantId } });
      const writes = resolveUpdateWrites(
        dto.values,
        environmentIds,
        stored.filter((v) => !!v.value).map((v) => v.environmentId),
        isMultiEnvironmentEnabled
      );
      await this.writeValues(organizationId, constantId, userId, writes, manager);
    });

    return this.getConstant(organizationId, constantId);
  }

  async bulkDeleteConstants(organizationId: string, ids: string[]): Promise<BulkDeleteConstantsPayload> {
    const candidateIds = ids.filter((id) => isUUID(id));
    const deletedRows: { id: string }[] = candidateIds.length
      ? await dbTransactionWrap(
          async (manager: EntityManager) =>
            (
              await manager
                .createQueryBuilder()
                .delete()
                .from(OrganizationConstant)
                .where('id IN (:...candidateIds) AND organization_id = :organizationId', {
                  candidateIds,
                  organizationId,
                })
                .returning('id')
                .execute()
            ).raw
        )
      : [];

    // One statement, so the delete is atomic. Postgres returns ids in lower case.
    const deleted = new Set(deletedRows.map((row) => row.id));
    return {
      deleted_ids: ids.filter((id) => deleted.has(id.toLowerCase())),
      skipped_ids: ids.filter((id) => !deleted.has(id.toLowerCase())),
    };
  }

  private async writeValues(
    organizationId: string,
    constantId: string,
    userId: string,
    writes: EnvironmentValueWrite[],
    manager: EntityManager
  ): Promise<void> {
    for (const { environmentId, value } of writes) {
      const stored =
        value === '' ? '' : await this.organizationConstantsUtilService.encryptSecret(organizationId, value);
      await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
        stored,
        environmentId,
        constantId,
        userId,
        manager
      );
    }
  }

  async allEnvironmentConstants(
    organizationId: string,
    type?: OrganizationConstantType
  ): Promise<ConstantWithEnvironmentValues[]> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const result = await this.organizationConstantRepository.findAllByOrganizationId(organizationId, type);
      const appEnvironments = await this.appEnvironmentUtilService.getAll(organizationId);

      const constantsWithValues = await Promise.all(
        result.map(async (constant) => {
          const values = await Promise.all(
            appEnvironments.map(async (env) => {
              let resolvedValue = '';

              const value = constant.orgEnvironmentConstantValues.find((value) => value.environmentId === env.id);
              if (value) {
                if (constant.type === OrganizationConstantType.SECRET) {
                  resolvedValue = value.value ? SECRET_VALUE_MASK : '';
                } else {
                  resolvedValue = await this.organizationConstantsUtilService.decryptSecret(
                    organizationId,
                    value.value
                  );
                }
              }

              return {
                environmentName: env.name,
                value: resolvedValue,
              };
            })
          );

          return {
            id: constant.id,
            name: constant.constantName,
            values,
            createdAt: constant.createdAt,
            type: constant.type,
          };
        })
      );

      return constantsWithValues.filter(Boolean);
    });
  }

  async getConstantsForEnvironment(
    organizationId: string,
    environmentId: string,
    type?: OrganizationConstantType
  ): Promise<any[]> {
    return dbTransactionWrap(async (manager: EntityManager) => {
      const result = await this.organizationConstantRepository.findByEnvironment(organizationId, environmentId, type);

      return await Promise.all(
        result.map(async (constant) => {
          const resolvedValue = !(constant.type === OrganizationConstantType.SECRET)
            ? await this.organizationConstantsUtilService.decryptSecret(
                organizationId,
                constant.orgEnvironmentConstantValues[0].value
              )
            : SECRET_VALUE_MASK;

          return {
            id: constant.id,
            name: constant.constantName,
            type: constant.type,
            value: resolvedValue,
          };
        })
      );
    });
  }

  async create(
    organizationConstant: CreateOrganizationConstantDto,
    organizationId: string,
    userId: string,
    isMultiEnvEnabled?: boolean
  ): Promise<OrganizationConstant | []> {
    return await dbTransactionWrap(async (manager: EntityManager) => {
      const newOrganizationConstant = this.organizationConstantRepository.create({
        constantName: organizationConstant.constant_name,
        organizationId,
        type: organizationConstant.type,
        createdBy: userId,
        updatedBy: userId,
      });

      const savedOrganizationConstant = await manager.save(OrganizationConstant, newOrganizationConstant);

      // Creating empty options mapping for the constant
      await this.organizationConstantsUtilService.createOrgConstantsInAllEnvironments(
        organizationId,
        savedOrganizationConstant.id,
        manager
      );

      let environmentsToUpdate = [];
      if (isMultiEnvEnabled) {
        const environmentsIds = organizationConstant.environments;
        environmentsToUpdate = environmentsIds.map(async (environmentId) => {
          return await this.appEnvironmentUtilService.get(organizationId, environmentId, false);
        });
      } else {
        /* 
          Basic plan customer. lets update all environment constant values. 
          this will help us to run the apps successfully when the user buys enterprise plan 
        */
        environmentsToUpdate = await this.appEnvironmentUtilService.getAll(organizationId);
      }

      await Promise.all(
        environmentsToUpdate.map(async (environment) => {
          const encryptedValue = await this.organizationConstantsUtilService.encryptSecret(
            organizationId,
            organizationConstant.value
          );
          await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
            encryptedValue,
            (await environment).id,
            savedOrganizationConstant.id,
            userId,
            manager
          );
        })
      );

      return savedOrganizationConstant;
    });
  }

  async update(
    constantId: string,
    organizationId: string,
    params: UpdateOrganizationConstantDto,
    userId: string,
    isMultiEnvironmentEnabled = false
  ): Promise<OrganizationConstant> {
    const { constant_name, environment_id, value } = params;

    if (!constant_name && !value) {
      throw new Error('Nothing to update');
    }

    return await dbTransactionWrap(async (manager: EntityManager) => {
      const constantToUpdate = await this.organizationConstantRepository.findOne({
        where: { id: constantId, organizationId },
      });

      if (!constantToUpdate) {
        throw new Error('Constant not found');
      }

      if (constant_name) {
        constantToUpdate.constantName = constant_name;
        constantToUpdate.updatedBy = userId;
      }

      await manager.save(constantToUpdate);
      let environmentsToUpdate = [];
      if (!isMultiEnvironmentEnabled) {
        environmentsToUpdate = await this.appEnvironmentUtilService.getAll(organizationId);
      } else {
        const environment = await this.appEnvironmentUtilService.get(organizationId, environment_id, false);
        environmentsToUpdate.push(environment);
      }

      if (value) {
        await Promise.all(
          environmentsToUpdate.map(async (environment) => {
            const encryptedValue = await this.organizationConstantsUtilService.encryptSecret(organizationId, value);
            await this.organizationConstantsUtilService.updateOrgEnvironmentConstant(
              encryptedValue,
              environment.id,
              constantToUpdate.id,
              userId,
              manager
            );
          })
        );
      }

      return constantToUpdate;
    });
  }

  async delete(
    constantId: string,
    organizationId: string,
    userId: string,
    environmentId?: string
  ): Promise<DeleteResult> {
    return await this.organizationConstantsUtilService.deleteOrgEnvironmentConstant(
      constantId,
      organizationId,
      userId,
      environmentId
    );
  }
}
