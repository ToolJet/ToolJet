import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationGitSync } from 'src/entities/organization_git_sync.entity';
import { Organization } from 'src/entities/organization.entity';
import { GitSyncController } from './controller';
import { GitSyncService } from './service';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationGitSync, Organization])],
  controllers: [GitSyncController],
  providers: [GitSyncService],
})
export class GitSyncModule {}
