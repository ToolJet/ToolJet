import { CreateEnvironmentVariableDto, UpdateEnvironmentVariableDto } from '@dto/environment-variable.dto';
import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { cleanObject } from 'src/helpers/utils.helper';
import { EncryptionService } from './encryption.service';

@Injectable()
export class OrgEnvironmentVariablesService {
  constructor(
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariablesRepository: Repository<OrgEnvironmentVariable>,
    private encryptionService: EncryptionService
  ) {}

  async fetchVariables(organizationId: string): Promise<OrgEnvironmentVariable[]> {
    const variables: OrgEnvironmentVariable[] = await this.orgEnvironmentVariablesRepository.find({
      where: { organizationId },
    });

    await Promise.all(
      variables.map(async (variable: OrgEnvironmentVariable) => {
        if (variable.variableType === 'server') {
          delete variable.value;
        } else {
          if (variable.encrypted) variable['value'] = await this.decryptSecret(organizationId, variable.value);
        }
      })
    );

    return variables;
  }

  async create(
    currentUser: User,
    environmentVariableDto: CreateEnvironmentVariableDto
  ): Promise<OrgEnvironmentVariable> {
    const variableToFind = await this.orgEnvironmentVariablesRepository.findOne({
      where: {
        variableName: environmentVariableDto.variable_name,
        variableType: environmentVariableDto.variable_type,
      },
    });

    if (variableToFind) {
      throw new ConflictException(
        `Variable name already exists in ${environmentVariableDto.variable_type ?? 'environment'} variables`
      );
    }

    const encrypted = environmentVariableDto.variable_type === 'server' ? true : environmentVariableDto.encrypted;
    let value: string;
    if (encrypted && environmentVariableDto.value) {
      value = await this.encryptSecret(currentUser.organizationId, environmentVariableDto.value);
    } else {
      value = environmentVariableDto.value;
    }
    return await this.orgEnvironmentVariablesRepository.save(
      this.orgEnvironmentVariablesRepository.create({
        variableName: environmentVariableDto.variable_name,
        value,
        variableType: environmentVariableDto.variable_type,
        encrypted,
        organizationId: currentUser.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async fetch(organizationId: string, variableId: string) {
    return await this.orgEnvironmentVariablesRepository.findOne({
      organizationId: organizationId,
      id: variableId,
    });
  }

  async update(organizationId: string, variableId: string, params: UpdateEnvironmentVariableDto) {
    const { variable_name } = params;
    let value = params.value;
    const variable = await this.fetch(organizationId, variableId);

    if (variable_name) {
      const variableToFind = await this.orgEnvironmentVariablesRepository.findOne({
        where: {
          variableName: variable_name,
          variableType: variable.variableType,
        },
      });

      if (variableToFind && variableToFind.id !== variableId) {
        throw new ConflictException(`Variable name already exists in ${variable.variableType} variables`);
      }
    }

    if (variable.encrypted && value) {
      value = await this.encryptSecret(organizationId, value);
    }

    const updateableParams = {
      variableName: variable_name,
      value,
    };

    // removing keys with undefined values
    cleanObject(updateableParams);

    return await this.orgEnvironmentVariablesRepository.update({ organizationId, id: variableId }, updateableParams);
  }

  async delete(organizationId: string, variableId: string) {
    return await this.orgEnvironmentVariablesRepository.delete({ organizationId, id: variableId });
  }

  private async encryptSecret(workspaceId: string, value: string) {
    return await this.encryptionService.encryptColumnValue('org_environment_variables', workspaceId, value);
  }

  private async decryptSecret(workspaceId: string, value: string) {
    return await this.encryptionService.decryptColumnValue('org_environment_variables', workspaceId, value);
  }
}
