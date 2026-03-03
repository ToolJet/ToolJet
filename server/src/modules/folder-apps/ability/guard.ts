import { ExecutionContext, Injectable } from '@nestjs/common';
import { FeatureAbilityFactory } from '.';
import { AbilityGuard } from '@modules/app/guards/ability.guard';
import { FolderApp } from '@entities/folder_app.entity';
import { ResourceDetails } from '@modules/app/types';
import { MODULES } from '@modules/app/constants/modules';

@Injectable()
export class FeatureAbilityGuard extends AbilityGuard {
  protected getAbilityFactory() {
    return FeatureAbilityFactory;
  }

  protected getSubjectType() {
    return FolderApp;
  }

  protected getResource(): ResourceDetails {
    return {
      resourceType: MODULES.FOLDER,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // folderId comes from route param on DELETE (:folderId) or from request body on POST (folder_id)
    const folderId = request.params?.folderId || request.body?.folder_id;
    if (folderId) {
      request.tj_resource_id = folderId;
    }
    return super.canActivate(context);
  }
}
