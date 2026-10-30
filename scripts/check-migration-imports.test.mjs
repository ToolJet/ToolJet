// Run: node --test scripts/check-migration-imports.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { disallowedImports } from './check-migration-imports.mjs';

const sources = (code) => disallowedImports(code).map((v) => v.source);

test('allows everything that is not an entity: typeorm, built-ins, helpers, modules, Nest, relative paths, npm', () => {
  assert.deepEqual(
    sources(`import { MigrationInterface, QueryRunner } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { processDataInBatches } from '@helpers/migration.helper';
import { DEFAULT_GROUP_PERMISSIONS } from '@modules/group-permissions/constants';
import { NestFactory } from '@nestjs/core';
import { getEnvVars } from '../scripts/database-config-utils';
import { ormconfig } from 'ormconfig';
import { cloneDeep } from 'lodash';`),
    []
  );
});

test('flags entities in every path style', () => {
  assert.deepEqual(
    sources(`import { App } from '@entities/app.entity';
import { Component } from 'src/entities/component.entity';
import { Organization } from '../src/entities/organization.entity';
import { Thing } from '@modules/things/thing.entity';`),
    ['@entities/app.entity', 'src/entities/component.entity', '../src/entities/organization.entity', '@modules/things/thing.entity']
  );
});

test('catches entities in multi-line, type-only, side-effect, re-export, require and dynamic imports', () => {
  assert.deepEqual(
    disallowedImports(`import {
  App,
  AppVersion,
} from '@entities/app.entity';
import type { User } from '@entities/user.entity';
import '@entities/setup.entity';
export { Org } from '../src/entities/organization.entity';
const { Page } = require('src/entities/page.entity');
const mod = await import('@entities/component.entity');`),
    [
      { line: 4, source: '@entities/app.entity' },
      { line: 5, source: '@entities/user.entity' },
      { line: 6, source: '@entities/setup.entity' },
      { line: 7, source: '../src/entities/organization.entity' },
      { line: 8, source: 'src/entities/page.entity' },
      { line: 9, source: '@entities/component.entity' },
    ]
  );
});

test('a marker with a reason on the import line allows an entity; a bare marker does not', () => {
  assert.deepEqual(
    sources(`import { App } from '@entities/app.entity'; // migration-import-allowed: one-off backfill reviewed with team
import { User } from '@entities/user.entity'; // migration-import-allowed:`),
    ['@entities/user.entity']
  );
});

test('ignores imports inside comments', () => {
  assert.deepEqual(sources(`// import { App } from '@entities/app.entity';\n/* const x = require('src/entities/x.entity'); */`), []);
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
