import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller, UseGuards } from '@nestjs/common';
import { FeatureAbilityGuard } from '../ability/guard';
import { BanUserDto, BanWorkspaceDto, UnbanWorkspaceDto } from '../dto';

@Controller('ext')
@InitModule(MODULES.EXTERNAL_APIS)
@UseGuards(FeatureAbilityGuard)
export class ExternalApisBanController {
  banUser(banUserDto: BanUserDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  unbanUser(email: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  banWorkspace(_banWorkspaceDto: BanWorkspaceDto): Promise<void> {
    throw new Error('Method not implemented.');
  }

  unbanWorkspace(_unbanWorkspaceDto: UnbanWorkspaceDto): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
