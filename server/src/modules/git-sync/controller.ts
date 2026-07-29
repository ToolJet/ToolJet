import { Controller, Post, Put, Param, Body, NotFoundException, Patch } from '@nestjs/common';
import { User } from '@modules/app/decorators/user.decorator';
import { User as UserEntity } from 'src/entities/user.entity';
import { IGitSyncController } from './Interfaces/IController';
import { ProviderConfigDTO } from './dto/provider-config.dto';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { UpdateGitEnvConfigDTO } from '@modules/git-sync/providers/dto/provider-config.dto';

// Strategy-only stubs (CE base). DB-only endpoints moved to
// src/modules/git-sync-configs/controller.ts.
@Controller('git-sync')
@InitModule(MODULES.GIT_SYNC)
export class GitSyncController implements IGitSyncController {
  constructor() {}

  @Post('configs')
  async saveProviderConfigs(@User() _user: UserEntity, @Body() _configData: ProviderConfigDTO) {
    throw new NotFoundException();
  }

  @Patch('env-configs')
  async toggleEnvConfig(@User() _user: UserEntity, @Body() _configData: UpdateGitEnvConfigDTO) {
    throw new NotFoundException();
  }

  @Post('test-connection')
  async testConnection(@User() _user: UserEntity, @Body() _payload: unknown) {
    throw new NotFoundException();
  }

  @Put('finalize/:id')
  async setFinalizeConfig(
    @User() _user: UserEntity,
    @Param('id') _organizationGitId: string,
    @Body() _configDto: ProviderConfigDTO
  ) {
    throw new NotFoundException();
  }
}
