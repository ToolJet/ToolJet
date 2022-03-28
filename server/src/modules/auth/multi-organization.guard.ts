import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class MultiOrganizationGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return this.configService.get<string>('MULTI_ORGANIZATION') === 'true';
  }
}
