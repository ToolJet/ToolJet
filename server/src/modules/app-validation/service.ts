import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { dbTransactionWrap } from '@helpers/database.helper';
import { RequestContext } from '@modules/request-context/service';
import { VALIDATION_WARNINGS_LOCALS_KEY } from './constants';
import { AppValidationException } from './exception';
import { getMode, resolveSource } from './mode';
import { rulesFor } from './rules';
import { runRules } from './runner';
import { Issue, Rule, RuleContext, ValidationArea, ValidationResult, WriteSource } from './types';
import { VersionIndex } from './version-index';

export interface CheckOptions {
  appVersionId: string;
  organizationId?: string;
  appType?: string;
  // Defaults to the current request's source. Bulk paths must set it.
  source?: WriteSource;
  // The caller's transaction, for checks that must see uncommitted data.
  manager?: EntityManager;
  // Prebuilt lookup (e.g. an import's in-memory data); skips the database.
  index?: VersionIndex;
  // Overrides the area's registered rules.
  rules?: Rule<any>[];
}

@Injectable()
export class AppValidationService {
  constructor(protected readonly logger: Logger) {}

  // Throws AppValidationException only when the source is in enforce mode.
  async check<T>(area: ValidationArea, inputs: T | T[], options: CheckOptions): Promise<ValidationResult> {
    const source = options.source ?? resolveSource();
    const mode = getMode(source);
    const list = Array.isArray(inputs) ? inputs : [inputs];
    const rules = options.rules ?? this.rulesFor(area);
    if (mode === 'off' || !list.length || !rules.length) return { errors: [], warnings: [] };

    const result = await runRules(rules, list, this.buildContext(source, options), (ruleId, error) =>
      this.logger.error(
        { appValidation: { area, ruleId, source, appVersionId: options.appVersionId }, err: error },
        `App validation rule "${ruleId}" crashed; the write was allowed`
      )
    );

    if (result.errors.length && mode === 'enforce') {
      throw new AppValidationException(result.errors, result.warnings, area);
    }

    if (result.errors.length) {
      this.logger.warn(
        {
          appValidation: {
            area,
            source,
            appVersionId: options.appVersionId,
            wouldBlock: result.errors.map(({ code, path }) => ({ code, path })),
          },
        },
        `App validation (report mode): ${result.errors.length} problem(s) would block this write`
      );
    }

    this.recordWarnings(mode === 'report' ? [...result.errors, ...result.warnings] : result.warnings);
    return result;
  }

  // EE overrides this to add EE-only rules.
  protected rulesFor(area: ValidationArea): Rule<any>[] {
    return rulesFor(area);
  }

  protected buildContext(source: WriteSource, options: CheckOptions): RuleContext {
    let index: Promise<VersionIndex> | undefined = options.index ? Promise.resolve(options.index) : undefined;
    return {
      appVersionId: options.appVersionId,
      organizationId: options.organizationId,
      appType: options.appType,
      source,
      index: () =>
        (index ??= dbTransactionWrap(
          (manager: EntityManager) => VersionIndex.load(manager, options.appVersionId),
          options.manager
        )),
    };
  }

  // Picked up by ValidationWarningsInterceptor.
  protected recordWarnings(warnings: Issue[]): void {
    const res = RequestContext.currentContext?.res;
    if (!warnings.length || !res) return;
    const existing: Issue[] = res.locals?.[VALIDATION_WARNINGS_LOCALS_KEY] ?? [];
    RequestContext.setLocals(VALIDATION_WARNINGS_LOCALS_KEY, [...existing, ...warnings]);
  }
}
