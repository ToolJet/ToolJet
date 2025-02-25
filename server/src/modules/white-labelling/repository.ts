import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WhiteLabelling } from '@entities/white_labelling.entity';

@Injectable()
export class WhiteLabellingRepository extends Repository<WhiteLabelling> {
  constructor(private readonly dataSource: DataSource) {
    super(WhiteLabelling, dataSource.createEntityManager());
  }

  async findByOrganizationId(organizationId: string): Promise<WhiteLabelling | null> {
    return this.findOne({
      where: { organizationId },
    });
  }

  async upsertSettings(updateData: Partial<WhiteLabelling>): Promise<void> {
    await this.upsert(updateData, ['organizationId']);
  }
}
