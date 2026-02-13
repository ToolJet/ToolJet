import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SslConfiguration } from '@entities/ssl_configuration.entity';

@Injectable()
export class SslConfigurationRepository extends Repository<SslConfiguration> {
  constructor(private dataSource: DataSource) {
    super(SslConfiguration, dataSource.createEntityManager());
  }

  async getConfig(): Promise<SslConfiguration | null> {
    // Instance-scoped: always return first (and only) row
    return this.findOne({ where: {}, order: { createdAt: 'ASC' } });
  }

  async createOrUpdateConfig(configData: Partial<SslConfiguration>): Promise<SslConfiguration> {
    const existingConfig = await this.getConfig();

    if (existingConfig) {
      return this.save({ ...existingConfig, ...configData });
    }

    return this.save(this.create(configData));
  }
}
