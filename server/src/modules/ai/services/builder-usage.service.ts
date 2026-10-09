import { Injectable, NotFoundException } from '@nestjs/common';
import { CreditsUsageResponseDto, UpdateBuilderLimitDto, UpdateCreditLimitsDto } from '../dto/credits-usage.dto';

@Injectable()
export class BuilderUsageService {
  async getCreditsUsage(user: { id: string; organizationId: string }): Promise<CreditsUsageResponseDto> {
    throw new NotFoundException();
  }

  async updateCreditLimits(user: { id: string; organizationId: string }, body: UpdateCreditLimitsDto): Promise<void> {
    throw new NotFoundException();
  }

  async updateBuilderLimit(
    user: { id: string; organizationId: string },
    userId: string,
    body: UpdateBuilderLimitDto
  ): Promise<void> {
    throw new NotFoundException();
  }
}
