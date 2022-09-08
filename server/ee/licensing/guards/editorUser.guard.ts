import { Injectable, CanActivate, ExecutionContext, HttpException } from '@nestjs/common';
import { UsersService } from '@services/users.service';
import { getManager } from 'typeorm';
import License from '../configs/License';

@Injectable()
export class EditorUserCountGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const license = License.Instance;

    if (license.editorUsers === 'UNLIMITED') {
      return true;
    }
    const editorCount = await this.usersService.fetchTotalEditorCount(getManager());

    if (editorCount >= license.editorUsers) {
      throw new HttpException('Maximum editor user limit reached', 451);
    }
    return true;
  }
}
