import { Module } from '@nestjs/common';
import { WorkspaceDbSetupService } from '@services/workspace_db_setup.service';
import { SeedsService } from '../../services/seeds.service';

@Module({
  providers: [SeedsService, WorkspaceDbSetupService],
  exports: [SeedsService, WorkspaceDbSetupService],
})
export class SeedsModule {}
