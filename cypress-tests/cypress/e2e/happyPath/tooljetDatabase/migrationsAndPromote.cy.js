import {
  getEnvironmentIds,
  plainColumn,
  uniqueTableName,
  apiCreateTable,
  apiAddColumn,
  apiViewTable,
  apiColumnNames,
  apiPromote,
  apiPromotePreview,
  apiMigrations,
  apiRawSqlMigration,
  apiRevertMigration,
  apiSeedSql,
  apiSelectRows,
  apiDropTables,
} from 'Support/utils/tooljetDatabase/tooljetDatabaseApi';

describe('ToolJet Database environments - migrations and promote', () => {
  let envs;
  let tableNames = [];

  const trackedTable = (prefix, columns, foreignKeys) => {
    const name = uniqueTableName(prefix);
    tableNames.push(name);
    return apiCreateTable(name, columns, foreignKeys).then((id) => ({ id, name }));
  };

  beforeEach(() => {
    tableNames = [];
    cy.apiLogin();
    getEnvironmentIds().then((ids) => {
      envs = ids;
    });
  });

  afterEach(() => {
    apiDropTables(tableNames);
  });

  it('TC-02 a new table exists only in development', () => {
    trackedTable('qa_new').then(({ name }) => {
      apiViewTable(name, envs.development).its('status').should('eq', 200);

      apiViewTable(name, envs.staging).then((response) => {
        expect(response.status).to.eq(404);
        expect(response.body.message).to.include(`"${name}"`);
        expect(response.body.message).to.include('in this environment');
        // names the table, never its logical id
        expect(response.body.message).to.not.match(/[0-9a-f]{8}-[0-9a-f]{4}-/);
      });
      apiViewTable(name, envs.production).its('status').should('eq', 404);
    });
  });

  it('TC-52 migrations are numbered from 1 per table and every schema edit appends one', () => {
    trackedTable('qa_num').then(({ id, name }) => {
      apiMigrations(id).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.result.migrations.map((m) => m.migration_number)).to.deep.eq([1]);
      });

      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiMigrations(id).then((response) => {
        const { migrations } = response.body.result;
        expect(migrations.map((m) => m.migration_number)).to.deep.eq([1, 2]);
        expect(migrations.map((m) => m.kind)).to.deep.eq(['structured', 'structured']);
      });
    });

    // a second table starts again at 1
    trackedTable('qa_num2').then(({ id }) => {
      apiMigrations(id).then((response) => {
        expect(response.body.result.migrations.map((m) => m.migration_number)).to.deep.eq([1]);
      });
    });
  });

  it('TC-12 promote preview lists the pending migrations with their SQL and changes nothing', () => {
    trackedTable('qa_prev').then(({ id, name }) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));

      apiPromotePreview(id, envs.development).then((response) => {
        expect(response.status).to.eq(200);
        const preview = response.body.result;
        expect(preview.target_environment.name).to.eq('staging');
        expect(preview.target_relation_exists).to.eq(false);
        expect(preview.missing_migrations).to.have.length(2);
        expect(preview.missing_migrations[0].sql).to.match(/CREATE TABLE/i);
        expect(preview.missing_migrations[1].sql).to.match(/ADD COLUMN/i);
      });

      // preview did not create anything in staging
      apiViewTable(name, envs.staging).its('status').should('eq', 404);
    });
  });

  it('TC-13 TC-14 TC-15 promote moves one step at a time, brings no rows, and is a no-op when up to date', () => {
    trackedTable('qa_prom').then(({ id, name }) => {
      apiAddColumn(name, plainColumn('gpa', 'integer'));
      apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('dev-row')", envs.development)
        .its('status')
        .should('eq', 201);

      // dev -> staging
      apiPromote(id, envs.development).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.result).to.include({ promoted_to: 'staging', applied_migrations: 2 });
      });
      apiColumnNames(name, envs.staging).should('deep.eq', ['id', 'name', 'gpa']);
      apiSelectRows(id, envs.staging).should('have.length', 0);
      apiSelectRows(id, envs.development).should('have.length', 1);
      // production is still missing
      apiViewTable(name, envs.production).its('status').should('eq', 404);

      // staging -> production (second step)
      apiPromote(id, envs.staging).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.result).to.include({ promoted_to: 'production', applied_migrations: 2 });
      });
      apiColumnNames(name, envs.production).should('deep.eq', ['id', 'name', 'gpa']);

      // up to date: nothing applied, no error
      apiPromote(id, envs.development).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.result.applied_migrations).to.eq(0);
      });

      // control: a new development migration applies exactly once
      apiAddColumn(name, plainColumn('city'));
      apiPromote(id, envs.development).then((response) => {
        expect(response.body.result.applied_migrations).to.eq(1);
      });
      apiColumnNames(name, envs.staging).should('deep.eq', ['id', 'name', 'gpa', 'city']);
    });
  });

  it('TC-16 promoting from the highest environment is refused', () => {
    trackedTable('qa_top').then(({ id }) => {
      apiPromote(id, envs.production).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq('There is no higher environment to promote to');
      });
    });
  });

  it('TC-21 promote refuses an unknown table id', () => {
    apiPromote('00000000-0000-4000-8000-000000000000', envs.development).then((response) => {
      expect(response.status).to.eq(404);
      expect(response.body.message).to.eq('Table not found');
    });
  });

  it('TC-08 TC-09 raw SQL migration is recorded, replays on promote, and can be reverted', () => {
    trackedTable('qa_raw').then(({ id, name }) => {
      // negatives first: nothing is recorded for a rejected statement
      apiRawSqlMigration(id, 'ALTER TABLE some_other_table ADD COLUMN x integer').its('status').should('eq', 400);
      // a DDL target other than {{self}} / {{table.<name>}} is refused before any substitution
      apiRawSqlMigration(id, 'ALTER TABLE "{{nope}}" ADD COLUMN x integer').then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.include('Table DDL must target');
      });
      // a placeholder elsewhere in the statement that resolves to nothing is refused too
      apiRawSqlMigration(id, 'ALTER TABLE "{{self}}" ADD COLUMN x character varying DEFAULT \'{{nope}}\'').then(
        (response) => {
          expect(response.status).to.eq(400);
          expect(response.body.message).to.include('Unresolved placeholder');
        }
      );
      apiRawSqlMigration(id, 'ALTER TABLE "{{self}}" ADD COLUMN note text').then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.include('does not support');
      });
      apiMigrations(id).its('body.result.migrations').should('have.length', 1);

      // control: a supported type is recorded
      apiRawSqlMigration(id, 'ALTER TABLE "{{self}}" ADD COLUMN note character varying', 'add note').then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(response.body.result).to.include({ kind: 'raw_sql', name: 'add note' });
          cy.wrap(response.body.result.id).as('rawMigrationId');
        }
      );
      apiColumnNames(name, envs.development).should('include', 'note');

      // it replays in staging
      apiPromote(id, envs.development).its('body.result.applied_migrations').should('eq', 2);
      apiColumnNames(name, envs.staging).should('include', 'note');

      // revert is a new migration that undoes the column in development
      cy.get('@rawMigrationId').then((migrationId) => {
        apiRevertMigration(id, migrationId, 'ALTER TABLE "{{self}}" DROP COLUMN note').then((response) => {
          expect(response.status).to.eq(201);
        });
        apiRevertMigration(id, '00000000-0000-4000-8000-000000000000', 'ALTER TABLE "{{self}}" DROP COLUMN note')
          .its('status')
          .should('eq', 404);
      });
      apiColumnNames(name, envs.development).should('not.include', 'note');
      apiMigrations(id).its('body.result.migrations').should('have.length', 3);
    });
  });

  it('TC-17 a promote that cannot apply fails with the database error and changes nothing', () => {
    trackedTable('qa_fail').then(({ id, name }) => {
      apiPromote(id, envs.development).its('status').should('eq', 201);
      // staging now holds a row that development's next migration cannot accept
      apiSeedSql(id, "INSERT INTO {{self}} (name) VALUES ('staging-row')", envs.staging)
        .its('status')
        .should('eq', 201);
      apiRawSqlMigration(id, 'ALTER TABLE "{{self}}" ADD COLUMN required_col character varying NOT NULL').then(
        (response) => expect(response.status).to.eq(201)
      );

      apiPromote(id, envs.development).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.match(/null/i);
      });
      apiColumnNames(name, envs.staging).should('not.include', 'required_col');
      apiSelectRows(id, envs.staging).should('have.length', 1);

      // control: once the blocking row is gone the same promote succeeds
      apiSeedSql(id, 'DELETE FROM {{self}}', envs.staging).its('status').should('eq', 201);
      apiPromote(id, envs.development).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.result.applied_migrations).to.eq(1);
      });
      apiColumnNames(name, envs.staging).should('include', 'required_col');
    });
  });

  it('TC-18 a child table cannot be promoted before its foreign key parent', () => {
    trackedTable('qa_parent').then(({ id: parentId, name: parentName }) => {
      trackedTable(
        'qa_child',
        [plainColumn('parent_id', 'integer')],
        [
          {
            column_names: ['parent_id'],
            referenced_table_name: parentName,
            referenced_table_id: parentId,
            referenced_column_names: ['id'],
            on_update: 'NO ACTION',
            on_delete: 'CASCADE',
          },
        ]
      ).then(({ id: childId, name: childName }) => {
        apiPromote(childId, envs.development).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.message).to.include(`Cannot promote "${childName}" to staging`);
          expect(response.body.message).to.include(`Promote "${parentName}" first`);
        });
        // nothing was left behind
        apiViewTable(childName, envs.staging).its('status').should('eq', 404);

        // control: parent first, then the child follows
        apiPromote(parentId, envs.development).its('status').should('eq', 201);
        apiPromote(childId, envs.development).its('status').should('eq', 201);
        apiViewTable(childName, envs.staging).its('status').should('eq', 200);
      });
    });
  });
});
