import { Controller } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

// CE stubs: no routes. The implementation lives in ee/app-security/.
@InitModule(MODULES.APP_SECURITY)
@Controller('apps')
export class AppSecurityController {
  constructor() {}
}

@InitModule(MODULES.APP_SECURITY_POLICY)
@Controller('app-security')
export class ScanPolicyController {
  constructor() {}
}
