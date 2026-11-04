// Read before any login: cy.apiLogin overwrites Cypress.env('workspaceId') with the workspace it signs into.
const home = Cypress.env('workspaceId');
const phase = Cypress.env('queryLibraryLicenseCase');
const get = (name) => cy.get(`[data-cy="${name}"]`);
const request = (method, path, body, failOnStatusCode = true) => cy.getAuthHeaders().then((headers) =>
  cy.request({ method, url: `${Cypress.env('server_host')}/api/${path}`, headers, body, failOnStatusCode, log: false }));
const menu = () => {
  get('version-switcher-button').then(($button) => {
    if (!$button.hasClass('opened')) cy.wrap($button).click();
  });
  cy.get('#version-manager-popover').should('be.visible');
};
const closeMenu = () => get('version-switcher-button').then(($button) => {
  if ($button.hasClass('opened')) cy.wrap($button).click();
});
// Licensed scenarios run once with no licence phase; the unlicensed import runs in the harness's `disabled` phase.
const scenario = (name, run, onlyPhase) => {
  if ((phase ?? 'licensed') !== (onlyPhase ?? 'licensed')) return;
  if (!Cypress.env('edgeScenario') || name.includes(Cypress.env('edgeScenario'))) it(name, run);
};
const picture = (name) => cy.screenshot(name, { capture: 'viewport' });
const save = (oldName, newName) => {
  menu();
  get(`${oldName.toLowerCase()}-save-version-button`).click();
  get('version-name-input-field').clear().type(newName);
  get('create-version-save-button').click();
  get('create-version-save-button').should('not.exist');
  get('version-switcher-button').should('contain.text', newName);
};
let promoteAttempts = 0;
const promoteBlocked = (...messages) => {
  // A fresh alias per attempt, so an earlier successful promote is never the request waited on.
  const alias = `promoteRefused${(promoteAttempts += 1)}`;
  cy.intercept('PUT', '**/versions/*/promote').as(alias);
  menu();
  get('promote-version-button').click();
  cy.get('.modal').find('[data-cy="promote-button"]').click();
  cy.wait(`@${alias}`).its('response.statusCode').should('eq', 400);
  messages.forEach((message) => cy.contains(message).should('be.visible'));
  cy.get('.modal').should('not.exist');
  closeMenu();
};
const visit = (path) => cy.visit(path, { onBeforeLoad(win) {
  win.localStorage.setItem('darkMode', 'false');
  win.localStorage.setItem('walkthroughCompleted', 'true');
} });
const libraryPage = () => visit(`/${home}/query-library`);

// Creates an app or module and returns its editing version and the workspace sources that version can see.
const createApp = (name, type = 'front-end') =>
  request('POST', type === 'module' ? 'modules' : 'apps', { name, type, icon: 'floppydisk' })
    .then(({ body }) => request('GET', `apps/${body.id}`))
    .then(({ body: app }) => request('GET',
      `data-sources/${Cypress.env('workspaceId')}/environments/${app.editorEnvironment.id}/versions/${app.editing_version.id}?branch_id=${app.editing_version.branch_id}`)
      .then(({ body: sources }) => ({
        id: app.id,
        versionId: app.editing_version.id,
        source: (kind) => {
          const found = sources.data_sources.find((item) => item.kind === kind);
          expect(found, `${kind} source`).to.exist;
          return found;
        },
      })));
const pinConsumer = (app, name, options) => request('POST',
  `data-queries/data-sources/${app.source('library').id}/versions/${app.versionId}`, { name, kind: 'library', options })
  .then(({ body }) => body);
// Creates a RunJS library query and saves its first draft. Saving keeps the draft's UUID.
const createRunJSLibrary = (name, code, inputs = []) => request('GET', 'query-library/static-data-sources')
  .then(({ body }) => request('POST', 'query-library/queries', {
    name, kind: 'runjs', dataSourceId: body.find((item) => item.kind === 'runjs').id, options: { code, inputs },
  }))
  .then(({ body: created }) => request('POST', `query-library/queries/${created.id}/drafts/${created.draftId}/save`,
    { name: `${name.replace(/\s+/g, '-')}-v1` }).then(() => ({ id: created.id, savedId: created.draftId })));
const exportApp = (appId) => request('POST', 'v2/resources/export', { app: [{ id: appId }], organization_id: home })
  .then(({ body }) => body);
// Signs into a brand-new workspace (created through the product endpoint) and imports the file through the dashboard.
const importIntoNewWorkspace = (label, exported) => {
  const slug = `${label}-${Date.now()}`;
  let workspaceId;
  return request('POST', 'organizations', { name: slug, slug })
    .then(({ body }) => {
      workspaceId = body.organization_id;
      cy.apiLogin(Cypress.env('testEmail'), 'password', workspaceId);
      visit(`/${workspaceId}`);
      cy.intercept('POST', '**/api/v2/resources/import').as('importApp');
      get('import-dropdown-menu').click();
      cy.get('[data-cy="import-option-input"]').eq(0).selectFile({
        contents: Cypress.Buffer.from(JSON.stringify(exported)), fileName: `${label}.json`, mimeType: 'application/json',
      }, { force: true });
      get('import-app').click();
      return cy.wait('@importApp');
    })
    .then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      const appId = response.body.imports.app[0].id;
      get('version-switcher-button').should('be.visible');
      return request('GET', `apps/${appId}`).then(({ body }) => ({ workspaceId, appId, versionId: body.editing_version.id }));
    });
};
const queriesOf = (versionId) => request('GET', `data-queries/${versionId}?mode=edit`).its('body.data_queries');

// Leaving a page cancels its in-flight requests; the app reports those as unhandled "Failed to fetch". Any other
// application error still fails the test.
Cypress.on('uncaught:exception', (error) => (error.message.includes('Failed to fetch') ? false : undefined));
// Only observes real HTTP responses. Every fixture is created through product endpoints.
describe(`Query Library consumer edge cases${phase ? `: ${phase}` : ''}`, () => {
  beforeEach(() => {
    cy.apiLogin(Cypress.env('testEmail'), 'password', home);
  });

  scenario('keeps an app whose library query is not in the workspace editable, and blocks running and promoting it', () => {
    let library;
    // A server-side kind, so the editor run goes through run-library and reports the missing target.
    request('POST', 'query-library/queries', {
      name: 'Missing lookup', kind: 'restapi', dataSourceId: Cypress.env('runSourceId'),
      options: { method: 'get', url: '/missing', headers: [], body: [], url_params: [], inputs: [] },
    }).then(({ body: created }) => request('POST', `query-library/queries/${created.id}/drafts/${created.draftId}/save`,
      { name: 'Missing-v1' }).then(() => ({ id: created.id, savedId: created.draftId })))
      .then((created) => {
        library = created;
        return createApp('Missing pin app');
    }).then((app) => pinConsumer(app, 'missingPin', {
      libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'restapi', inputs: {},
    }).then(() => exportApp(app.id)))
      .then((exported) => {
        // An export made without the library definitions, as git and unlicensed exports are.
        delete exported.app[0].definition.appV2.libraryQueries;
        return importIntoNewWorkspace('missing-library', exported);
      })
      .then((imported) => queriesOf(imported.versionId).then((queries) => {
        // The reference is kept as-is: it names a query this workspace does not have.
        expect(queries.find((query) => query.name === 'missingPin').options)
          .to.include({ libraryQueryId: library.id, libraryQueryVersionId: library.savedId });
      }));

    cy.intercept('POST', '**/data-queries/*/versions/*/run-library/*').as('missingRun');
    get('list-query-missingpin').click();
    get('query-run-button').click();
    cy.wait('@missingRun').then(({ response }) => {
      expect(response.statusCode).to.eq(404);
      expect(JSON.stringify(response.body)).to.contain("isn't in this workspace. Pick one from the library.");
    });
    cy.contains("isn't in this workspace").should('exist');
    picture('missing-pin-run');
    // Saving a version is an edit of the app; it must still be allowed.
    save('v1', 'Missing-v1');
    promoteBlocked('Promote blocked', "uses a library query that isn't in this workspace. Pick one from the library.");
    picture('missing-pin-promote');
  });

  scenario('imports an app with the library queries it uses and runs the re-pointed pin in the new workspace', () => {
    let library;
    let imported;
    createRunJSLibrary('Portable echo', 'return { echoed: input.word };', [{ name: 'word', defaultValue: '' }])
      .then((created) => {
        library = created;
        return createApp('Portable app');
      }).then((app) => pinConsumer(app, 'portableEcho', {
        libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'runjs', inputs: { word: 'moved' },
      }).then(() => exportApp(app.id)))
      .then((exported) => {
        expect(exported.app[0].definition.appV2.libraryQueries).to.have.length(1);
        return importIntoNewWorkspace('portable-library', exported);
      })
      .then((result) => { imported = result; });

    cy.intercept('POST', '**/data-queries/*/library-definition').as('definition');
    get('list-query-portableecho').click();
    get('query-run-button').click();
    cy.wait('@definition').its('response.statusCode').should('be.oneOf', [200, 201]);
    get('preview-content').should('contain.text', 'moved');
    picture('portable-run');
    cy.then(() => request('GET', 'query-library/queries')).then(({ body }) => {
      const copy = body.find((query) => query.name === 'Portable echo');
      expect(copy, 'imported library query').to.exist;
      expect(copy.id).not.to.eq(library.id);
      return queriesOf(imported.versionId).then((queries) => {
        expect(queries.find((query) => query.name === 'portableEcho').options.libraryQueryId).to.eq(copy.id);
      });
    });
  });

  scenario('imports an app that references the library while Query Library is disabled and keeps the reference', () => {
    exportApp(Cypress.env('licenseAppId')).then((exported) => {
      expect(exported.app[0].definition.appV2).not.to.have.property('libraryQueries');
      return importIntoNewWorkspace('unlicensed-import', exported);
    }).then((imported) => {
      queriesOf(imported.versionId).then((queries) => {
        expect(queries.find((query) => query.name === 'licenseJS').options).to.include({
          libraryQueryId: Cypress.env('licenseQueryId'), libraryQueryVersionId: Cypress.env('licensePinId'),
        });
      });
      request('GET', 'query-library/catalog', undefined, false).its('status').should('eq', 451);
    });
    picture('unlicensed-import');
  }, 'disabled');

  scenario('creates, renames, fills and deletes a library folder without deleting its query', () => {
    let library;
    let folderId;
    createRunJSLibrary('folderedLookup', 'return 1;').then((created) => { library = created; });
    cy.intercept('POST', '**/api/query-library/folders').as('createFolder');
    cy.intercept('PATCH', '**/api/query-library/folders/*').as('renameFolder');
    cy.intercept('DELETE', '**/api/query-library/folders/*').as('deleteFolder');
    libraryPage();
    get('query-library-page').should('be.visible');
    get('show-ds-popover-button').click();
    get('new-folder-ds-select').click();
    cy.wait('@createFolder').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      folderId = response.body.id;
    });

    cy.then(() => get(`folder-name-${folderId}`).dblclick());
    cy.get('.query-rename-input').clear().type('Lookups{enter}');
    cy.wait('@renameFolder').its('response.statusCode').should('eq', 200);
    cy.then(() => get(`folder-name-${folderId}`).should('have.text', 'Lookups'));

    get('query-handler-menu-folderedlookup').click({ force: true });
    get('query-card-move-to-folder-button').click();
    cy.contains('.move-to-folder-body *', 'Lookups').click();
    get('confirm-move-to-folder').click();
    get('confirm-move-to-folder').should('not.exist');
    cy.then(() => request('GET', 'query-library/queries')).then(({ body }) => {
      expect(body.find((query) => query.id === library.id).folderId).to.eq(folderId);
    });
    picture('library-folder-filled');

    cy.then(() => get(`folder-menu-btn-${folderId}`).click({ force: true }));
    cy.then(() => get(`folder-delete-btn-${folderId}`).click());
    get('confirm-delete-folder').click();
    cy.wait('@deleteFolder').its('response.statusCode').should('be.oneOf', [200, 204]);
    cy.then(() => get(`folder-name-${folderId}`).should('not.exist'));
    get('list-query-folderedlookup').should('be.visible');
    cy.then(() => request('GET', 'query-library/queries')).then(({ body }) => {
      expect(body.find((query) => query.id === library.id).folderId).to.eq(null);
    });
  });

  scenario('lists the consuming app and module under Used by and opens them', () => {
    let library;
    const consumers = {};
    createRunJSLibrary('usageLookup', 'return 1;').then((created) => {
      library = created;
      return createApp('Usage app');
    }).then((app) => {
      consumers.app = app;
      return pinConsumer(app, 'usageConsumer', {
        libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'runjs', inputs: {},
      });
    }).then(() => createApp('Usage module', 'module'))
      .then((module) => {
        consumers.module = module;
        return pinConsumer(module, 'usageConsumer', {
          libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'runjs', inputs: {},
        });
      });
    libraryPage();
    get('list-query-usagelookup').click();
    get('query-library-usage').should('contain.text', 'Used by apps (1)').and('contain.text', 'Used by modules (1)');
    picture('library-used-by');
    for (const [kind, name] of [['app', 'Usage app'], ['module', 'Usage module']]) {
      cy.then(() => {
        libraryPage();
        get('list-query-usagelookup').click();
        return get('query-library-usage').contains('a', name).invoke('attr', 'href')
          .should('match', new RegExp(`/apps/${consumers[kind].id}$`));
      }).then((href) => {
        // The link opens a new tab; follow it in this one.
        visit(href);
        get('version-switcher-button').should('be.visible');
        cy.contains(name).should('be.visible');
        get('list-query-usageconsumer').should('be.visible');
      });
    }
  });

  scenario('does not let a library query use another library query', () => {
    createRunJSLibrary('nestingHost', 'return 1;');
    libraryPage();
    get('show-ds-popover-button').click();
    get('ds-runjsdefault').should('be.visible');
    get('ds-librarydefault').should('not.exist');
    picture('library-source-list');
    get('show-ds-popover-button').click();
    createApp('Nesting probe').then((app) => {
      const librarySource = app.source('library').id;
      // The request shape refuses the library kind outright...
      request('POST', 'query-library/queries', {
        name: 'nestedLibrary', kind: 'library', dataSourceId: librarySource, options: {},
      }, false).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(JSON.stringify(body.message)).to.contain('kind');
      });
      // ...and the service refuses the library source under any other kind.
      request('POST', 'query-library/queries', {
        name: 'nestedLibrarySource', kind: 'runjs', dataSourceId: librarySource, options: { code: 'return 1;' },
      }, false).then(({ status, body }) => {
        expect(status).to.eq(400);
        expect(body.message).to.eq("library queries can't be used from a query library");
      });
    });
  });

  // F03: at narrow desktop widths the library header's Run controls (QueryManagerHeader.jsx .query-header-buttons,
  // flex: 0 0 auto in queryManager.scss) cover the Transformation tab, so clicking the tab runs the query.
  scenario('keeps the Transformation tab clickable at a narrow desktop width', () => {
    request('POST', 'query-library/queries', {
      name: 'narrowHeader', kind: 'restapi', dataSourceId: Cypress.env('runSourceId'),
      options: { method: 'post', url: '/anything', headers: [], body: [], url_params: [], inputs: [] },
    });
    cy.viewport(955, 1260);
    cy.intercept('POST', '**/api/query-library/queries/*/run/**').as('libraryRun');
    libraryPage();
    get('list-query-narrowheader').click();
    get('query-tab-transformation').should('be.visible').then(($tab) => {
      const box = $tab[0].getBoundingClientRect();
      const hit = $tab[0].ownerDocument.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      expect($tab[0].contains(hit), 'Transformation tab is the element under its own centre').to.eq(true);
    });
    get('query-tab-transformation').click();
    get('query-tab-transformation').should('have.attr', 'aria-selected', 'true');
    cy.get('@libraryRun.all').should('have.length', 0);
    picture('library-narrow-header');
  });
});
