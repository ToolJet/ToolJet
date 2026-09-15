import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DataSource } from './data_source.entity';
import { AppEnvironment } from './app_environments.entity';

// operationId is optional in the OpenAPI 3.0/2.0 spec (and even when present, a malformed spec
// could technically reuse it across operations), so it is NOT part of the unique constraint -
// this row's own generated `id`, scoped to (dataSourceId, environmentId), is the identity used
// for lookups/references instead.
@Entity({ name: 'openapi_spec_operations' })
@Unique('UQ_OPENAPI_SPEC_OPERATION', ['dataSourceId', 'environmentId', 'id'])
@Index('IDX_OPENAPI_SPEC_OPERATION_SERVICE', ['dataSourceId', 'environmentId', 'serviceId'])
export class OpenApiSpecOperation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'data_source_id', type: 'uuid' })
  dataSourceId: string;

  @Column({ name: 'environment_id', type: 'uuid' })
  environmentId: string;

  @Column({ name: 'operation_id', type: 'text' })
  operationId: string;

  @Column({ name: 'service_id', type: 'text', default: 'default' })
  serviceId: string;

  @Column({ name: 'path', type: 'text' })
  path: string;

  @Column({ name: 'method', type: 'text' })
  method: string;

  @Column({ name: 'name', type: 'text' })
  name: string;

  @Column({ name: 'deprecated', type: 'boolean', default: false })
  deprecated: boolean;

  @Column({ name: 'tags', type: 'jsonb', nullable: true })
  tags: string[] | null;

  @Column({ name: 'security', type: 'jsonb', nullable: true })
  security: string[] | null;

  @Column({ name: 'has_request_body', type: 'boolean', default: false })
  hasRequestBody: boolean;

  @Column({ name: 'parameters', type: 'jsonb', nullable: true })
  parameters: Record<string, any>[] | null;

  @Column({ name: 'request_body_schema', type: 'jsonb', nullable: true })
  requestBodySchema: Record<string, any> | null;

  // Per-status-code response schemas, e.g. { "200": {...}, "404": {...} }. Only ever fetched via
  // the single-operation lookup (getOpenApiSpecOperation, by row `id`) - listOpenApiSpecOperations
  // deliberately selects a lightweight column subset that excludes this.
  @Column({ name: 'response_schemas', type: 'jsonb', nullable: true })
  responseSchemas: Record<string, any> | null;

  // requestBodySchema/responseSchemas above are the pruned view (circular refs truncated to {}
  // via pruneCircularRefs - see circular-ref.util.ts). These _raw counterparts preserve the
  // reference expression instead of truncating (markCircularRefs), stored pre-stringified as
  // text rather than jsonb since the point is preserving the exact reference structure as
  // written, not letting the pg driver re-serialize it.
  @Column({ name: 'request_body_schema_raw', type: 'text', nullable: true })
  requestBodySchemaRaw: string | null;

  @Column({ name: 'response_schemas_raw', type: 'text', nullable: true })
  responseSchemasRaw: string | null;

  @CreateDateColumn({ default: () => 'now()', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ default: () => 'now()', name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataSource, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'data_source_id' })
  dataSource: DataSource;

  @ManyToOne(() => AppEnvironment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'environment_id' })
  appEnvironment: AppEnvironment;
}
