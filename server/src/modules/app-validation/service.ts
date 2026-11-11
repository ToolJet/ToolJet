import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { EntityManager } from 'typeorm';
import { getDBConnection } from '@helpers/database.helper';
import { Component } from '@entities/component.entity';
import { RequestContext } from '@modules/request-context/service';
import { VALIDATION_WARNINGS_LOCALS_KEY } from './core/constants';
import { AppValidationException } from './core/exception';
import { getMode, resolveSource } from './core/mode';
import { rulesFor } from './rules';
import { runRules } from './core/runner';
import { Issue, Rule, RuleContext, ValidationArea, ValidationMode, ValidationResult, WriteSource } from './types';
import { IndexedComponent, VersionIndex } from './version-index';

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
  // Components this request creates, overlaid on the loaded lookup so siblings can
  // reference each other. Loaded lazily inside check(), so an off mode never pays for it.
  overlayComponents?: IndexedComponent[];
  // Overrides the area's registered rules.
  rules?: Rule<any>[];
}

@Injectable()
export class AppValidationService {
  constructor(protected readonly logger: Logger) {}

  // Throws AppValidationException only when the source is in enforce mode.
  async check<T>(area: ValidationArea, inputs: T | T[], options: CheckOptions): Promise<ValidationResult> {
    const source = options.source ?? resolveSource();
    const mode = this.modeFor(source);
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

  protected modeFor(source: WriteSource): ValidationMode {
    return getMode(source);
  }

  // EE overrides this to add EE-only rules.
  protected rulesFor(area: ValidationArea): Rule<any>[] {
    return rulesFor(area);
  }

  protected buildContext(source: WriteSource, options: CheckOptions): RuleContext {
    let index: Promise<VersionIndex> | undefined = options.index ? Promise.resolve(options.index) : undefined;
    const known = new Map<string, boolean>();
    return {
      appVersionId: options.appVersionId,
      organizationId: options.organizationId,
      appType: options.appType,
      source,
      index: () => (index ??= this.loadIndex(options)),
      componentsInVersion: async (ids) => {
        // An existing lookup (prebuilt, or one a rule already loaded) answers for free.
        if (index) {
          const loaded = await index;
          return new Set(ids.filter((id) => loaded.component(id)));
        }
        for (const component of options.overlayComponents ?? []) known.set(component.id, true);
        const unknown = [...new Set(ids.filter((id) => !known.has(id)))];
        if (unknown.length) {
          const rows: { id: string }[] = await this.inSavepoint(options, (manager) =>
            manager
              .createQueryBuilder(Component, 'component')
              .innerJoin('component.page', 'page')
              .where('component.id IN (:...ids)', { ids: unknown })
              .andWhere('page.appVersionId = :appVersionId', { appVersionId: options.appVersionId })
              .select('component.id', 'id')
              .getRawMany()
          );
          const present = new Set(rows.map((row) => row.id));
          for (const id of unknown) known.set(id, present.has(id));
        }
        return new Set(ids.filter((id) => known.get(id)));
      },
    };
  }

  protected async loadIndex(options: CheckOptions): Promise<VersionIndex> {
    const loaded = await this.inSavepoint(options, (manager) => VersionIndex.load(manager, options.appVersionId));
    return options.overlayComponents ? loaded.withComponents(options.overlayComponents) : loaded;
  }

  // Lookup reads run in a savepoint on the caller's manager (EntityManager.transaction
  // nests when already in a transaction): a failing read - say a statement_timeout on the
  // heaviest statement of a small save - must roll back only itself, not abort the save's
  // transaction it was merely checking. Without a caller manager it opens its own.
  private inSavepoint<T>(options: CheckOptions, read: (manager: EntityManager) => Promise<T>): Promise<T> {
    return (options.manager ?? getDBConnection()).transaction((manager: EntityManager) => read(manager));
  }

  // Picked up by ValidationWarningsInterceptor.
  protected recordWarnings(warnings: Issue[]): void {
    const res = RequestContext.currentContext?.res;
    if (!warnings.length || !res) return;
    const existing: Issue[] = res.locals?.[VALIDATION_WARNINGS_LOCALS_KEY] ?? [];
    RequestContext.setLocals(VALIDATION_WARNINGS_LOCALS_KEY, [...existing, ...warnings]);
  }
}
