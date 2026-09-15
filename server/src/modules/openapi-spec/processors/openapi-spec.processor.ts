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

@Processor(OPENAPI_SPEC_PROCESSING_QUEUE, {
  concurrency: OPENAPI_SPEC_CONCURRENCY,
})
export class OpenApiSpecProcessor extends WorkerHost {
  // Behaviour flags only; dereferenceInternal starts a fresh $ref cache on every call.
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

      // CreateOpenApiSpecDto guarantees url/definition is set for the matching sourceType.
      const rawSpec =
        sourceType === OpenApiSpecSourceType.URL ? await this.fetchSpecText(url as string) : (definition as string);
      const parsedInput = this.parseSpecText(rawSpec);
      timer.mark('parse');
      // resolve() only builds the $refs map; unlike dereference() it does not expand the whole
      // document. Each operation is dereferenced lazily per batch below, yielding between batches.
      const $refs = await SwaggerParser.resolve(parsedInput as any);
      timer.mark('resolve');

      if (await this.isTerminated(dataSourceId, environmentIds)) {
        return this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.CANCELLED);
      }

      const version = parsedInput.openapi ? '3.0' : '2.0';
      const metadata = this.extractMetadata(parsedInput, version);
      const checksum = this.checksum(rawSpec);
      const specSecurity = parsedInput.security || [];

      const batches = chunkArray(this.extractPathItems(parsedInput), DEFAULT_OPENAPI_SPEC_BATCH_SIZE);
      const persistedCounts: Record<string, number> = Object.fromEntries(environmentIds.map((id) => [id, 0]));

      // Readers only see rows once status is READY, so no transaction needs to span the job.
      for (const environmentId of environmentIds) {
        await dbTransactionWrap((manager: EntityManager) =>
          manager.delete(OpenApiSpecOperation, { dataSourceId, environmentId })
        );
      }

      for (let i = 0; i < batches.length; i++) {
        if (await this.isTerminated(dataSourceId, environmentIds)) {
          return this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.CANCELLED);
        }

        // A malformed operation (e.g. unresolvable $ref) is logged and skipped, not fatal to the job.
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

        // `batches` lives for the whole job; release consumed entries so they can be GC'd.
        batches[i] = [];

        for (const environmentId of environmentIds) {
          persistedCounts[environmentId] += await this.persistBatchForEnvironment(
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

      for (const environmentId of environmentIds) {
        await this.updateSpecOptions(dataSourceId, environmentId, {
          [OPENAPI_SPEC_OPTION_KEYS.STATUS]: OpenApiSpecStatus.READY,
          [OPENAPI_SPEC_OPTION_KEYS.ERROR]: null,
          [OPENAPI_SPEC_OPTION_KEYS.METADATA]: metadata,
          [OPENAPI_SPEC_OPTION_KEYS.VERSION]: version,
          [OPENAPI_SPEC_OPTION_KEYS.CHECKSUM]: checksum,
        });
        this.logger.log(
          `[openapi-spec:${job.id}] persisted ${persistedCounts[environmentId]} operations for environment ${environmentId}`
        );
      }

      this.logger.log(`[openapi-spec:${job.id}] processing complete: ${JSON.stringify(timer.summary())}`);
    } catch (error) {
      this.logger.error(`OpenAPI spec processing failed for datasource ${dataSourceId}`, error);
      await this.finalize(dataSourceId, environmentIds, OpenApiSpecStatus.FAILED, (error as Error).message);
      throw error;
    } finally {
      await Promise.all(
        environmentIds.map((environmentId) => this.terminationRegistry.clear(dataSourceId, environmentId))
      );
    }
  }

  // yaml.load also parses JSON, but JSON.parse is far faster and lighter, so try it first.
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
      // Needed by the frontend auth picker (resolveSecurities) to handle AND-combined schemes.
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

  // dereferenceInternal only needs a {schema, $refs} parser-shaped object. It mutates `subtree` in
  // place, so pass a clone: $refs keeps the parsed spec alive for the whole job, and expanding it
  // in place would pin every dereferenced operation in memory.
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
    // Only parameters/requestBody are dereferenced: nothing reads responses, which dominate the
    // expanded size of large specs (e.g. Microsoft Graph). Cloning pre-expansion is cheap.
    const operation = {
      ...rawOperation,
      ...this.dereferenceSubtree(
        structuredClone({ parameters: rawOperation.parameters, requestBody: rawOperation.requestBody }),
        $refs
      ),
    };

    // Per the spec, path-item parameters are inherited by every operation unless overridden by
    // (name, in).
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

  // Batching keeps each INSERT under Postgres's 65,535 bind-parameter limit, which an unbatched
  // save() of a large spec would exceed.
  private async persistBatchForEnvironment(
    dataSourceId: string,
    environmentId: string,
    batchOperations: ExtractedOperation[]
  ): Promise<number> {
    if (!batchOperations.length) return 0;
    return dbTransactionWrap(async (manager: EntityManager) => {
      const entities = batchOperations.map((op) =>
        manager.create(OpenApiSpecOperation, {
          ...op,
          dataSourceId,
          environmentId,
        })
      );
      const saved = await manager.save(OpenApiSpecOperation, entities);
      return saved.length;
    });
  }

  // Uses DataSourceOptions directly, not the edition-split AppEnvironmentUtilService: this
  // non-split provider would inject the CE token and throw UnknownDependenciesException under EE.
  private async updateSpecOptions(
    dataSourceId: string,
    environmentId: string,
    patch: Record<string, any>
  ): Promise<void> {
    await dbTransactionWrap(async (manager: EntityManager) => {
      const existing = await manager.findOne(DataSourceOptions, {
        where: { dataSourceId, environmentId },
      });
      const options = { ...(existing?.options || {}) };
      for (const key of Object.keys(patch)) {
        options[key] = { value: patch[key], encrypted: false };
      }
      await manager.update(DataSourceOptions, { dataSourceId, environmentId }, { options, updatedAt: new Date() });
    });
  }
}
