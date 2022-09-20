import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { isSuperAdmin } from 'src/helpers/utils.helper';

@Injectable()
export class PasswordRevalidateGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return isSuperAdmin(request.user);
  }
}
