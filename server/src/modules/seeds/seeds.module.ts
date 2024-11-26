import { Module } from '@nestjs/common';
import { SeedsService } from '../../services/seeds.service';
import { TooljetDbService } from '@services/tooljet_db.service';
import { UserResourcePermissionsModule } from '@modules/user_resource_permissions/user_resource_permissions.module';

@Module({
  imports: [UserResourcePermissionsModule],
  providers: [SeedsService, TooljetDbService],
  exports: [SeedsService, TooljetDbService],
})
export class SeedsModule {}
