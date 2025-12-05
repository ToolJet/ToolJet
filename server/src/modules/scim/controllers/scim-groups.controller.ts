import { MODULES } from '@modules/app/constants/modules';
import { InitModule } from '@modules/app/decorators/init-module';
import { Controller } from '@nestjs/common';

@Controller('scim/v2')
@InitModule(MODULES.SCIM)
export class ScimGroupsController { }
