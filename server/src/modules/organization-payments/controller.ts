import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
import { Controller } from '@nestjs/common';

@Controller('organization-constants')
@InitModule(MODULES.ORGANIZATION_PAYMENTS)
export class OrganizationConstantController {
  constructor() {}
}
