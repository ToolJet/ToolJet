import { EnvironmentVariableDto } from '@dto/environment-variable.dto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class OrgEnvironmentVariablesService {
  constructor(
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariablesRepository: Repository<OrgEnvironmentVariable>
  ) {}

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
}
