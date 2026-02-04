import { Controller } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
@Controller('crm')
@InitModule(MODULES.CRM)
export class CrmController {
  constructor() {}
}
