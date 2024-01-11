import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WhiteLabelling } from 'src/entities/white_labelling.entity';

@Injectable()
export class WhiteLabellingService {
  constructor(
    @InjectRepository(WhiteLabelling)
    private readonly whiteLabellingRepository: Repository<WhiteLabelling>
  ) {}

  async getSettings(organizationId: string): Promise<WhiteLabelling> {
    const whiteLabellingSetting = await this.whiteLabellingRepository.findOne({ where: { organizationId } });
    return whiteLabellingSetting;
  }

  async updateSettings(organizationId: string, updateDto): Promise<any> {
    const updateData = {
      organizationId: organizationId,
      logo: updateDto.logo,
      text: updateDto.text,
      favicon: updateDto.favicon,
    };
    await this.whiteLabellingRepository.upsert(updateData, ['organizationId']);
    return updateData;
  }
}
