import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import { getManager } from 'typeorm';
import { LicenseService } from '@services/license.service';
import { LICENSE_FIELD, LICENSE_LIMIT } from 'src/helpers/license.helper';

@Injectable()
export class EditorUserCountGuard implements CanActivate {
  constructor(private usersService: UsersService, private licenseService: LicenseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const editorsCount = await this.licenseService.getLicenseTerms(LICENSE_FIELD.EDITORS);
    if (editorsCount === LICENSE_LIMIT.UNLIMITED) {
      return true;
    }
    const editorCount = await this.usersService.fetchTotalEditorCount(getManager());

    if (editorCount >= editorsCount) {
      throw new HttpException('Maximum editor user limit reached', 451);
    }
    return true;
  }
}
