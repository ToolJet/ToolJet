import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';

@Injectable()
export class DataSourcesService {

  constructor(
    private credentialsService: CredentialsService,
    @InjectRepository(DataSource)
    private dataSourcesRepository: Repository<DataSource>,
  ) { }

  async all(user: User, appId: string): Promise<DataSource[]> {

    return await this.dataSourcesRepository.find({
        where: {
          appId
        },
    });
  }

  async create(user: User, name:string, kind:string, options:Array<object>, appId:string): Promise<DataSource> {
    const newDataSource = this.dataSourcesRepository.create({ 
      name,
      kind,
      options: await this.parseOptionsForSaving(options),
      appId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const dataSource = await this.dataSourcesRepository.save(newDataSource);
    return dataSource;
  }

  async update(user: User, dataSourceId:string, name:string, options:Array<object>): Promise<DataSource> {

    const dataSource = this.dataSourcesRepository.save({
      id: dataSourceId,
      name,
      options: await this.parseOptionsForSaving(options),
      updatedAt: new Date(),
    });

    return dataSource;
  }
  
  async parseOptionsForSaving(options:Array<object>) {

    let parsedOptions = {}

    for (const option of options) {
      if(option['encrypted']) {
        const credential = await this.credentialsService.create(option['value']);

        parsedOptions[option['key']] = {
          credential_id: credential.id,
          encrypted: option["encrypted"]
        }
      } else {
        parsedOptions[option['key']] = {
          value: option['value'],
          encrypted: false
        }
      }
    }

    return parsedOptions;
  }
}
