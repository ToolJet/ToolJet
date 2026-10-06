import { Injectable, NotFoundException } from '@nestjs/common';
import { CreditsUsageResponseDto } from '../dto/credits-usage.dto';

@Injectable()
export class BuilderUsageService {
  async getCreditsUsage(user: { id: string; organizationId: string }): Promise<CreditsUsageResponseDto> {
    throw new NotFoundException();
  }
}
