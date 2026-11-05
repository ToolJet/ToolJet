import { Controller } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';

// CE stub: no routes. The CLI download lives in ee/code-mode-source/cli.controller.ts.
@InitModule(MODULES.CODE_MODE_SOURCE)
@Controller('code-mode/cli')
export class CodeModeCliController {
  constructor() {}
}
