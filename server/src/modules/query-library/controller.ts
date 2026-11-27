import { Controller } from '@nestjs/common';
import { InitModule } from '@modules/app/decorators/init-module';
import { MODULES } from '@modules/app/constants/modules';
@Controller('query-library')
@InitModule(MODULES.QUERY_LIBRARY)
export class QueryLibraryController {}
