import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { createHash } from 'crypto';
import got from 'got';
import * as yaml from 'js-yaml';
import { EntityManager } from 'typeorm';
import SwaggerParser from '@apidevtools/swagger-parser';
import { dereferenceInternal, getJsonSchemaRefParserDefaultOptions } from '@apidevtools/json-schema-ref-parser';
import { Logger } from 'nestjs-pino';
import { OpenApiSpecOperation } from '@entities/openapi_spec_operation.entity';
import { DataSourceOptions } from '@entities/data_source_options.entity';
import { dbTransactionWrap } from '@helpers/database.helper';
import { OpenApiSpecTerminationRegistry } from '../services/openapi-spec-termination-registry';
import { StageTimer } from '../utils/stage-timer.util';
import { pruneCircularRefs } from '../utils/circular-ref.util';
import { chunkArray } from '../utils/chunk.util';
import { sleep } from '../utils/sleep.util';
import {
  DEFAULT_OPENAPI_SPEC_BATCH_SIZE,
  OPENAPI_SPEC_OPTION_KEYS,
  OPENAPI_SPEC_PROCESSING_QUEUE,
  OpenApiSpecSourceType,
  OpenApiSpecStatus,
} from '../constants';
import { OPENAPI_SPEC_CONCURRENCY } from '../constants/queue-config';

export interface OpenApiSpecJobData {
  dataSourceId: string;
  organizationId: string;
  environmentIds: string[];
  sourceType: OpenApiSpecSourceType;
  url?: string;
  definition?: string;
}

interface ExtractedOperation {
  operationId: string;
  serviceId: string;
  path: string;
  method: string;
  name: string;
  deprecated: boolean;
  tags: string[];
  security: string[];
  hasRequestBody: boolean;
  parameters: Record<string, any>[];
  requestBodySchema: Record<string, any> | null;
}

interface PathItemEntry {
  path: string;
  method: string;
  pathItem: Record<string, any>;
  operation: Record<string, any>;
}

const FETCH_TIMEOUT_MS = 30000;
const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

// Thrown to unwind out of the single per-job transaction when termination is observed mid-loop -
// distinguishes "cancelled cooperatively" from a genuine processing failure so the catch block
// can finalize with CANCELLED instead of FAILED.
class OpenApiSpecCancelledError extends Error {}

@Processor(OPENAPI_SPEC_PROCESSING_QUEUE, {
  concurrency: OPENAPI_SPEC_CONCURRENCY,
})
export class OpenApiSpecProcessor extends WorkerHost {
  // dereferenceInternal is the same low-level crawl SwaggerParser.validate()/.dereference() use
  // internally - a real public export, not a private reach-in - which gives correct
  // circular-reference detection and extended-$ref (sibling-key) merging for free. These are
  // behavior flags only - dereferenceInternal starts a fresh $ref cache on every call, so nothing
  // resolved for one operation is reused by the next.
  private readonly dereferenceOptions = getJsonSchemaRefParserDefaultOptions();

  constructor(
    private readonly terminationRegistry: OpenApiSpecTerminationRegistry,
    private readonly logger: Logger
  ) {
    super();
  }

  async process(job: Job<OpenApiSpecJobData>): Promise<void> {
    const { dataSourceId, environmentIds, sourceType, url, definition } = job.data;
    const timer = new StageTimer();
    this.logger.log(
      `[openapi-spec:${job.id}] default heap ceiling: ${timer.defaultHeapLimitMB}MB - measured before processing starts`
    );

    try {
      if (await this.isTerminated(dataSourceId, environmentIds)) {
        return this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.CANCELLED);
      }

      // DTO validation on the upload endpoint guarantees url is set for URL sources and
      // definition is set for DEFINITION sources - see CreateOpenApiSpecDto.
      const rawSpec =
        sourceType === OpenApiSpecSourceType.URL ? await this.fetchSpecText(url as string) : (definition as string);
      const parsedInput = this.parseSpecText(rawSpec);
      timer.mark('parse');
      // SwaggerParser.resolve() parses/fetches external refs and builds a $Refs lookup map, but
      // does NOT deep-expand every $ref into the document the way validate()/dereference() do -
      // much cheaper up front. Each operation's own subtree is dereferenced lazily, per batch,
      // below - bounding peak per-step work/memory to one batch's worth of operations rather
      // than the whole spec's, and giving a safe point (between batches) to yield the event loop,
      // unlike validate()'s single opaque whole-document call.
      const $refs = await SwaggerParser.resolve(parsedInput as any);
      timer.mark('resolve');

      if (await this.isTerminated(dataSourceId, environmentIds)) {
        return this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.CANCELLED);
      }

      const version = parsedInput.openapi ? '3.0' : '2.0';
      const metadata = this.extractMetadata(parsedInput, version);
      const checksum = this.checksum(rawSpec);
      const specSecurity = parsedInput.security || [];

      // chunkArray(this.extractPathItems(...)) is intentionally not bound to its own variable -
      // extractPathItems' flat array is only ever needed to build `batches`; keeping a second,
      // separate long-lived reference to every {pathItem, operation} pair around would defeat
      // the per-batch release below just as surely as never clearing `batches[i]` would.
      const batches = chunkArray(this.extractPathItems(parsedInput), DEFAULT_OPENAPI_SPEC_BATCH_SIZE);
      const persistedCounts: Record<string, number> = Object.fromEntries(environmentIds.map((id) => [id, 0]));

      // One transaction spans clearing old rows, dereferencing, and persisting every batch for
      // every environment - a failure anywhere rolls back all of it. Each batch is dereferenced
      // and immediately fanned out to every environment before moving to the next, instead of
      // dereferencing the whole spec up front and only then persisting - peak memory is bounded
      // to one batch's worth of operations (DEFAULT_OPENAPI_SPEC_BATCH_SIZE), not the whole
      // spec's operation count. IMPORTANT: that bound only holds because `batches[i]` is
      // explicitly cleared once consumed (see below) - `batches` itself lives for the whole job,
      // so leaving a processed slot populated would keep every operation's dereferenced subtree
      // (dereferenceInternal mutates pathItem/operation in place, replacing $ref pointers with
      // the actual, potentially large, expanded schema objects) reachable for the rest of the
      // job, growing roughly linearly with batches processed instead of staying flat.
      await dbTransactionWrap(async (manager) => {
        for (const environmentId of environmentIds) {
          await manager.delete(OpenApiSpecOperation, {
            dataSourceId,
            environmentId,
          });
        }

        for (let i = 0; i < batches.length; i++) {
          // Checked once per batch (not once per environment) - a termination request on a
          // large multi-environment job is now honored roughly environmentIds.length times
          // faster, since this is the finer-grained loop. Throwing here rolls back every
          // environment's deletes/inserts so far too, same as any other failure.
          if (await this.isTerminated(dataSourceId, environmentIds)) {
            throw new OpenApiSpecCancelledError();
          }

          // A single malformed operation (an unresolvable $ref, a schema shape dereferenceInternal
          // can't crawl, etc.) shouldn't fail the entire batch/job - skip just that operation, log
          // which one and why, and keep going. Everything else in the spec still gets processed.
          const batchOperations: ExtractedOperation[] = [];
          for (const { path, method, pathItem, operation } of batches[i]) {
            try {
              batchOperations.push(
                this.buildExtractedOperation(path, method, pathItem, operation, $refs, version, specSecurity)
              );
            } catch (error) {
              this.logger.error(
                `[openapi-spec:${job.id}] skipping operation ${method.toUpperCase()} ${path} - failed to dereference/prune: ${
                  (error as Error).message
                }`,
                (error as Error).stack
              );
            }
          }

          // Drop the only remaining reference to this batch's (now dereferenced-in-place, fully
          // expanded) pathItem/operation objects - batchOperations above already captured
          // everything needed as fresh, self-contained clones (pruneCircularRefs never
          // references the original mutated subtree), so nothing is lost. Without this,
          // `batches` - which lives for the entire job, not just this iteration - would keep
          // every already-processed operation's expanded schema reachable indefinitely.
          batches[i] = [];

          // Per-operation data (id, path, method, parameters, schemas, ...) lives solely in the
          // openapi_spec_operations table - listOpenApiSpecOperations queries it directly.
          for (const environmentId of environmentIds) {
            persistedCounts[environmentId] += await this.persistBatchForEnvironment(
              manager,
              dataSourceId,
              environmentId,
              batchOperations
            );
          }

          this.logger.log(
            `[openapi-spec:${job.id}] batch ${i + 1}/${batches.length} dereferenced + persisted ` +
              `(${batchOperations.length} operations x ${environmentIds.length} environments)`
          );
          await sleep(0);
        }

        timer.mark(`dereference+persist (${batches.length} batches)`);

        // Metadata only carries spec-level info (servers/tags/services/securitySchemes) that
        // has nothing to do with any single operation, so it's identical across environments -
        // written once per environment only after every batch has been persisted for it.
        for (const environmentId of environmentIds) {
          await this.updateSpecOptions(
            dataSourceId,
            environmentId,
            {
              [OPENAPI_SPEC_OPTION_KEYS.STATUS]: OpenApiSpecStatus.READY,
              [OPENAPI_SPEC_OPTION_KEYS.ERROR]: null,
              [OPENAPI_SPEC_OPTION_KEYS.METADATA]: metadata,
              [OPENAPI_SPEC_OPTION_KEYS.VERSION]: version,
              [OPENAPI_SPEC_OPTION_KEYS.CHECKSUM]: checksum,
            },
            manager
          );
          this.logger.log(
            `[openapi-spec:${job.id}] persisted ${persistedCounts[environmentId]} operations for environment ${environmentId}`
          );
        }
      });

      this.logger.log(`[openapi-spec:${job.id}] processing complete: ${JSON.stringify(timer.summary())}`);
    } catch (error) {
      if (error instanceof OpenApiSpecCancelledError) {
        await this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.CANCELLED);
        return;
      }
      this.logger.error(`OpenAPI spec processing failed for datasource ${dataSourceId}`, error);
      await this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.FAILED, (error as Error).message);
      throw error;
    } finally {
      await Promise.all(
        environmentIds.map((environmentId) => this.terminationRegistry.clear(dataSourceId, environmentId))
      );
    }
  }

  // JSON.parse is V8-native and dramatically faster/lower-memory than js-yaml for the same
  // content. A lot of "OpenAPI YAML" uploads are actually valid JSON underneath (JSON is a
  // subset of YAML) - try the cheap path first, fall back to yaml.load (which handles both
  // genuine YAML and, more slowly, JSON too) only if that throws. Explicitly supports both
  // formats rather than relying on yaml.load alone to happen to accept JSON.
  private parseSpecText(rawSpec: string): Record<string, any> {
    try {
      return JSON.parse(rawSpec);
    } catch {
      return yaml.load(rawSpec) as Record<string, any>;
    }
  }

  private async isTerminated(dataSourceId: string, environmentIds: string[]): Promise<boolean> {
    const flags = await Promise.all(
      environmentIds.map((environmentId) => this.terminationRegistry.isTerminated(dataSourceId, environmentId))
    );
    return flags.some(Boolean);
  }

  private async finalize(
    dataSourceId: string,
    environmentIds: string[],
    status: OpenApiSpecStatus,
    errorMessage: string | null = null
  ): Promise<void> {
    for (const environmentId of environmentIds) {
      await this.updateSpecOptions(dataSourceId, environmentId, {
        [OPENAPI_SPEC_OPTION_KEYS.STATUS]: status,
        [OPENAPI_SPEC_OPTION_KEYS.ERROR]: errorMessage,
      });
    }
  }

  private async fetchSpecText(url: string): Promise<string> {
    const response = await got(url, { timeout: { request: FETCH_TIMEOUT_MS } });
    return response.body;
  }

  private checksum(rawSpec: string): string {
    return createHash('sha256').update(rawSpec).digest('hex');
  }

  private extractMetadata(spec: Record<string, any>, version: string): Record<string, any> {
    const servers =
      version === '3.0'
        ? (spec.servers || []).map((s: any) => s.url)
        : [`${spec.schemes?.[0] || 'https'}://${spec.host || ''}${spec.basePath || ''}`];

    const securitySchemes = version === '3.0' ? spec.components?.securitySchemes || {} : spec.securityDefinitions || {};

    return {
      info: spec.info || {},
      servers,
      tags: (spec.tags || []).map((t: any) => t.name),
      services: spec['x-services'] || [],
      securitySchemes,
      // Spec-level security requirement (which scheme(s) actually apply, incl. AND-combos of
      // multiple schemes) - the frontend needs this alongside securitySchemes to reproduce the
      // legacy plugin's auth-picker logic (resolveSecurities) exactly.
      security: spec.security || [],
    };
  }

  private extractPathItems(spec: Record<string, any>): PathItemEntry[] {
    const results: PathItemEntry[] = [];

    for (const path of Object.keys(spec.paths || {})) {
      const pathItem = spec.paths[path];
      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (!operation) continue;
        results.push({ path, method, pathItem, operation });
      }
    }

    return results;
  }

  // Dereferences just THIS operation's subtree against the already-resolved $refs map, using
  // the library's own crawl (dereferenceInternal) instead of a hand-rolled walk. dereference()
  // only needs its `parser` argument to look like {schema, $refs} - it doesn't have to be a
  // real $RefParser instance - so a throwaway wrapper is enough. Mutates `subtree` in place -
  // callers MUST pass a disposable clone, never a live reference into `parsedInput` itself (see
  // buildExtractedOperation): $refs keeps parsedInput reachable for the entire job (any later
  // batch may still need to resolve a $ref against it), so mutating parsedInput's own path/
  // operation objects in place - even briefly - permanently grows the job's baseline memory
  // instead of leaving it eligible for GC once this operation's batch is done with it.
  private dereferenceSubtree(subtree: Record<string, any>, $refs: any): any {
    const wrapper = { schema: subtree, $refs };
    dereferenceInternal(wrapper as any, this.dereferenceOptions);
    return wrapper.schema;
  }

  private buildExtractedOperation(
    path: string,
    method: string,
    pathItem: Record<string, any>,
    rawOperation: Record<string, any>,
    $refs: any,
    version: string,
    specSecurity: Record<string, any>[]
  ): ExtractedOperation {
    // rawOperation/pathItem.parameters are live references into parsedInput.paths[path] itself
    // (extractPathItems doesn't copy) - dereferenceSubtree mutates whatever it's handed in place,
    // so cloning here is what keeps that mutation off parsedInput. Cheap: at this point the
    // subtree is still its small, pre-dereference form (plain properties + {$ref} placeholders),
    // not yet expanded.
    // Only parameters/requestBody are ever read (plugin run() uses {host,path,operation,params});
    // responses are ~99.9% of an expanded Graph operation and were never consumed.
    const operation = {
      ...rawOperation,
      ...this.dereferenceSubtree(
        structuredClone({ parameters: rawOperation.parameters, requestBody: rawOperation.requestBody }),
        $refs
      ),
    };

    // Path-item-level parameters (a sibling of get/post/etc on the Path Item Object, per the
    // OpenAPI/Swagger spec) apply to every operation under this path unless an operation-level
    // parameter overrides one with the same (name, in) - e.g. a shared {id} path parameter
    // reused across GET/PUT/DELETE. Previously dropped entirely since only operation.parameters
    // was read. Dereferenced separately since pathItem.parameters isn't part of rawOperation's
    // own subtree (a $ref'd shared parameter here still needs resolving).
    const resolvedPathItemParams = pathItem.parameters
      ? (this.dereferenceSubtree({ parameters: structuredClone(pathItem.parameters) }, $refs).parameters as Record<
          string,
          any
        >[])
      : [];
    const mergedParameters = this.mergeParameters(resolvedPathItemParams, operation.parameters || []);

    const operationId = operation.operationId || `${method}_${path}`;
    const security = (operation.security || specSecurity || []).flatMap((s: Record<string, any>) => Object.keys(s));
    const requestBodySchema = this.extractRequestBodySchema(operation, version);

    return {
      operationId,
      serviceId: operation['x-service'] || 'default',
      path,
      method,
      name: operation.summary || operationId,
      deprecated: !!operation.deprecated,
      tags: operation.tags || [],
      security,
      hasRequestBody: this.hasRequestBody(operation, version),
      parameters: pruneCircularRefs(
        mergedParameters.map((p) => ({
          name: p.name,
          in: p.in,
          required: !!p.required,
          schema: p.schema || { type: p.type },
        }))
      ),
      requestBodySchema: pruneCircularRefs(requestBodySchema),
    };
  }

  private mergeParameters(
    pathItemParams: Record<string, any>[],
    operationParams: Record<string, any>[]
  ): Record<string, any>[] {
    const key = (p: Record<string, any>) => `${p.name}::${p.in}`;
    const operationKeys = new Set(operationParams.map(key));
    const inherited = pathItemParams.filter((p) => !operationKeys.has(key(p)));
    return [...inherited, ...operationParams];
  }

  private hasRequestBody(operation: Record<string, any>, version: string): boolean {
    if (version === '3.0') return !!operation.requestBody;
    return (operation.parameters || []).some((p: Record<string, any>) => p.in === 'body');
  }

  private extractRequestBodySchema(operation: Record<string, any>, version: string): Record<string, any> | null {
    if (version === '3.0') {
      return operation.requestBody?.content?.['application/json']?.schema || null;
    }
    const bodyParam = (operation.parameters || []).find((p: Record<string, any>) => p.in === 'body');
    return bodyParam?.schema || null;
  }

  // Batches are persisted inside ONE transaction spanning the whole job (not one per batch) -
  // atomic, so a mid-job failure rolls back every batch rather than leaving partial rows. Batch
  // size itself exists to stay safely under Postgres's 65,535-bound-parameter-per-query limit
  // (DEFAULT_OPENAPI_SPEC_BATCH_SIZE rows x ~16 columns is a small fraction of that), which an
  // unbatched save() of a large spec's operations could otherwise exceed outright.
  //
  // Takes an already-dereferenced batch (built by the caller, once, then fanned out to every
  // environment) and always runs against the manager passed in - the caller's transaction spans
  // the whole job, this never opens its own. Returns a count, not the saved rows - the
  // openapi_spec_operations table is the sole source of truth for per-operation data
  // (listOpenApiSpecOperations queries it directly), so there's no lightweight index to build
  // from the saved entities afterward, and holding already-persisted rows (with their jsonb
  // columns) in memory just to discard them would be wasteful.
  private async persistBatchForEnvironment(
    manager: EntityManager,
    dataSourceId: string,
    environmentId: string,
    batchOperations: ExtractedOperation[]
  ): Promise<number> {
    if (!batchOperations.length) return 0;
    const entities = batchOperations.map((op) =>
      manager.create(OpenApiSpecOperation, {
        ...op,
        dataSourceId,
        environmentId,
      })
    );
    const saved = await manager.save(OpenApiSpecOperation, entities);
    return saved.length;
  }

  // Reads/writes DataSourceOptions directly rather than going through AppEnvironmentUtilService.
  // That service is edition-split (CE base + EE subclass resolved via getProviders), but this
  // processor is a plain, non-split provider registered directly in DataSourcesModule - it has
  // no edition-specific counterpart to redirect through, so any edition-split dependency here
  // resolves to the CE class token unconditionally and throws UnknownDependenciesException
  // under EE/Cloud, where the DI container only has the EE class registered. Same reasoning as
  // ValidateOpenApiSpecStatusGuard.
  private async updateSpecOptions(
    dataSourceId: string,
    environmentId: string,
    patch: Record<string, any>,
    externalManager?: EntityManager
  ): Promise<void> {
    await dbTransactionWrap(async (manager) => {
      const existing = await manager.findOne(DataSourceOptions, {
        where: { dataSourceId, environmentId },
      });
      const options = { ...(existing?.options || {}) };
      for (const key of Object.keys(patch)) {
        options[key] = { value: patch[key], encrypted: false };
      }
      await manager.update(DataSourceOptions, { dataSourceId, environmentId }, { options, updatedAt: new Date() });
    }, externalManager);
  }
}
