import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { SSOResponse } from '@entities/sso_response.entity';

@Injectable()
export class SSOResponseRepository extends Repository<SSOResponse> {
  constructor(dataSource: DataSource) {
    super(SSOResponse, dataSource.createEntityManager());
  }

  async findByIdForConfig(id: string, configId: string): Promise<SSOResponse | null> {
    if (!id || !configId) return null;
    return await this.findOne({ where: { id, configId } });
  }

  async createSSOResponse(configId: string, response: string, sso: string): Promise<SSOResponse> {
    const ssoResponse = this.create({
      configId,
      response,
      sso,
    });

    return await this.save(ssoResponse);
  }
}
