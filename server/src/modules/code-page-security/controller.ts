import { Controller } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

// CE stub: no routes. The implementation lives in ee/code-page-security/.
@InitModule(MODULES.CODE_PAGE_SECURITY)
@Controller('code-page-security')
export class CodePageSecurityController {
  constructor() {}
}
