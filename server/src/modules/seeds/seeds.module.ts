import { Module } from '@nestjs/common';
import { SeedsService } from '../../services/seeds.service';
import { UserResourcePermissionsModule } from '@module/user_resource_permissions/user_resource_permissions.module';

@Module({
  imports: [UserResourcePermissionsModule],
  providers: [SeedsService],
  exports: [SeedsService],
})
export class SeedsModule {}
