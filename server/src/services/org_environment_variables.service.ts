import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OrgEnvironmentVariable } from 'src/entities/org_envirnoment_variable.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrgEnvironmentVariablesService {
  constructor(
    @InjectRepository(OrgEnvironmentVariable)
    private orgEnvironmentVariables: Repository<OrgEnvironmentVariable>
  ) {}
}
