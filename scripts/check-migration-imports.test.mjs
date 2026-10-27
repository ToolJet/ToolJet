// Run: node --test scripts/check-migration-imports.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disallowedImports } from './check-migration-imports.mjs';

const sources = (code) => disallowedImports(code).map((v) => v.source);

test('allows typeorm, its subpaths and Node built-ins', () => {
  assert.deepEqual(
    sources(`import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { Table } from 'typeorm/schema-builder/table/Table';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';`),
    []
  );
});

test('flags entities, helpers, modules, Nest, relative paths and npm packages', () => {
  assert.deepEqual(
    sources(`import { Component } from 'src/entities/component.entity';
import { App } from '@entities/app.entity';
import { processDataInBatches } from '@helpers/migration.helper';
import { AppsService } from '@modules/apps/service';
import { NestFactory } from '@nestjs/core';
import { getEnvVars } from '../scripts/database-config-utils';
import { ormconfig } from 'ormconfig';
import { cloneDeep } from 'lodash';`),
    [
      'src/entities/component.entity',
      '@entities/app.entity',
      '@helpers/migration.helper',
      '@modules/apps/service',
      '@nestjs/core',
      '../scripts/database-config-utils',
      'ormconfig',
      'lodash',
    ]
  );
});

test('catches multi-line, type-only, side-effect, re-export, require and dynamic imports', () => {
  assert.deepEqual(
    disallowedImports(`import {
  ComponentJsonRow,
  transform,
} from '@helpers/component-migration.helper';
import type { App } from '@entities/app.entity';
import '@helpers/setup';
export { x } from '../shared';
const { v4 } = require('uuid');
const mod = await import('@modules/apps/service');`),
    [
      { line: 4, source: '@helpers/component-migration.helper' },
      { line: 5, source: '@entities/app.entity' },
      { line: 6, source: '@helpers/setup' },
      { line: 7, source: '../shared' },
      { line: 8, source: 'uuid' },
      { line: 9, source: '@modules/apps/service' },
    ]
  );
});

test('a marker with a reason on the import line allows it; a bare marker does not', () => {
  assert.deepEqual(
    sources(`import { getEnvVars } from '../scripts/database-config-utils'; // migration-import-allowed: needs TOOLJET_DB_USER
import { cloneDeep } from 'lodash'; // migration-import-allowed:`),
    ['lodash']
  );
});

test('ignores imports inside comments', () => {
  assert.deepEqual(sources(`// import { App } from '@entities/app.entity';\n/* const x = require('lodash'); */`), []);
});

test('does not mistake SQL "from" inside an exported class for a re-export', () => {
  assert.deepEqual(
    sources(`export class RenameWhiteLabelling1707112483331 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const rows = await queryRunner.query(\`select * from "white_labelling"\`);
  }
}`),
    []
  );
});
