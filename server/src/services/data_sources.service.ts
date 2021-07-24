import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/entities/user.entity';
import { DataSource } from '../../src/entities/data_source.entity';
import { CredentialsService } from './credentials.service';
import { allPlugins } from 'src/modules/data_sources/plugins';

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

  async findOne(dataSourceId: string): Promise<DataSource> {
    return await this.dataSourcesRepository.findOne(dataSourceId);
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

  async testConnection(kind: string, options: object): Promise<object> {
    let result = {};
    try {

      let sourceOptions = {};

      for(const key of Object.keys(options)) {
        sourceOptions[key] = options[key]['value'];
      }

      const serviceClass = allPlugins[kind];
      const service = new serviceClass();
      result = await service.testConnection(sourceOptions);
   
    } catch(error) {
      result = {
        status: 'failed',
        message: error.message
      }
    }

    return result;
  }
  
  async parseOptionsForSaving(options:Array<object>) {

    let parsedOptions = {}

    // Check if an Oauth2 datasource
    if(options.find(option => option['key'] === 'oauth2')) {
      const provider = options.find(option => option['key'] === 'provider')['value'];
      const authCode = options.find(option => option['key'] === 'code')['value'];

      const queryService = new allPlugins[provider];
      const accessDetails = await queryService.accessDetailsFrom(authCode);

      for(const row of accessDetails) {
        const option = {};
        option['key'] = row[0];
        option['value'] = row[1]
        option['encrypted'] = true;

        options.push(option);
      }

      options = options.filter(option => !(['provider', 'code', 'oauth2'].includes(option['key'])) );
    }

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

  async getAuthUrl(provider): Promise<object> {
    const service = new allPlugins[provider];
    return { url: service.authUrl() }
  }
  
}
