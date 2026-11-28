import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { assertImportedVariableDefinitions } from '@helpers/import-variable-validation.helper';

/** Runs after authentication but before ValidationPipe strips prototype keys / transforms bodies. */
@Injectable()
export class ImportVariablesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ body: unknown; path: string }>();
    const moduleImport = /\/modules\/import\/?$|\/import\/workspace\/[^/]+\/modules\/?$/.test(request.path);
    assertImportedVariableDefinitions(request.body, moduleImport);
    return true;
  }
}
