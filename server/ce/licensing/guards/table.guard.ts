import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TableCountGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return true;
  }
}
