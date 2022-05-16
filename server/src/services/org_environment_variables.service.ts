import { EnvironmentVariableDto } from '@dto/environment-variable.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { cleanObject } from 'src/helpers/utils.helper';

@Injectable()
export class OrgEnvironmentVariablesService {
  constructor(
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariablesRepository: Repository<OrgEnvironmentVariable>
  ) {}

  async fetchVariables(currentUser: User): Promise<OrgEnvironmentVariable[]> {
    return await this.orgEnvironmentVariablesRepository.find({
      where: { organizationId: currentUser.organizationId },
    });
  }

  async create(currentUser: User, environmentVariableDto: EnvironmentVariableDto): Promise<OrgEnvironmentVariable> {
    return await this.orgEnvironmentVariablesRepository.save(
      this.orgEnvironmentVariablesRepository.create({
        variableName: environmentVariableDto.variable_name,
        value: environmentVariableDto.value,
        encrypted: environmentVariableDto.encrypted,
        organizationId: currentUser.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }

  async update(organizationId: string, variableId: string, params: any) {
    const { variable_name, value } = params;

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
}
