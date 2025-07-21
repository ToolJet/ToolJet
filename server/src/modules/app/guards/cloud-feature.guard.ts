import { getTooljetEdition } from '@helpers/utils.helper';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { TOOLJET_EDITIONS } from '../constants';

@Injectable()
export class CloudFeatureGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
  }
}
