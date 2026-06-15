import { IsEnum } from 'class-validator';
import { RESOURCE } from '../constants';

export class ResourceParamDto {
  @IsEnum(RESOURCE, {
    message: `resource must be one of: ${Object.values(RESOURCE).join(', ')}`,
  })
  resource: RESOURCE;
}
