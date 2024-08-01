import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class EditorUserCountGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    return true;
  }
}
