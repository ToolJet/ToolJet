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
const select = (name, environment) => get('version-switcher-button').then(($button) => {
  if ($button.text().includes(name) && (!environment || $button.text().includes(environment))) return;
  menu();
  if (environment) cy.get('.environment-toggle').contains('button', environment).click();
  get(`${name.toLowerCase()}-version-name`).click();
  get('version-switcher-button').should('contain.text', name);
  cy.get('#version-manager-popover').should('not.exist');
});
const scenario = (name, run) => {
  if (!Cypress.env('consumerScenario') || name.includes(Cypress.env('consumerScenario'))) it(name, run);
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
const promote = () => {
  menu();
  get('promote-version-button').click();
  cy.get('.modal').find('[data-cy="promote-button"]').click();
  cy.get('.modal').should('not.exist');
  closeMenu();
  cy.get('#version-manager-popover').should('not.exist');
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
const openRelease = () => {
  cy.intercept('**/api/**/release').as('releaseSnapshot');
  menu();
  get('release-version-button').click();
};
const release = () => {
  openRelease();
  get('yes-button').click();
  cy.wait('@releaseSnapshot').its('response.statusCode').should('be.oneOf', [200, 201]);
  get('yes-button').should('not.exist');
};
const visit = (path) => cy.visit(path, { onBeforeLoad(win) {
  win.localStorage.setItem('darkMode', 'false');
  win.localStorage.setItem('walkthroughCompleted', 'true');
} });
const appPath = (id) => `/${Cypress.env('workspaceId')}/apps/${id}`;

// Creates an app and returns its editing version and the workspace sources that version can see.
const createApp = (name) => request('POST', 'apps', { name, type: 'front-end', icon: 'floppydisk' })
  .then(({ body }) => request('GET', `apps/${body.id}`))
  .then(({ body: app }) => request('GET',
    `data-sources/${Cypress.env('workspaceId')}/environments/${app.editorEnvironment.id}/versions/${app.editing_version.id}?branch_id=${app.editing_version.branch_id}`)
    .then(({ body: sources }) => ({
      id: app.id,
      slug: app.slug,
      versionId: app.editing_version.id,
      source: (kind) => {
        const found = sources.data_sources.find((item) => item.kind === kind);
        expect(found, `${kind} source`).to.exist;
        return found;
      },
    })));
const createQuery = (app, sourceId, query) =>
  request('POST', `data-queries/data-sources/${sourceId}/versions/${app.versionId}`, query).then(({ body }) => body);
const pinConsumer = (app, name, options) => createQuery(app, app.source('library').id, { name, kind: 'library', options });
// Creates a library query and saves its first draft. Saving keeps the draft's UUID.
const createLibrary = (body, savedName) => request('POST', 'query-library/queries', body).then(({ body: created }) =>
  request('POST', `query-library/queries/${created.id}/drafts/${created.draftId}/save`, { name: savedName })
    .then(() => ({ id: created.id, savedId: created.draftId })));
const libraryAction = (library, action) =>
  request('POST', `query-library/queries/${library.id}/versions/${library.savedId}/${action}`);
const runInEditor = (queryName, expected) => {
  cy.intercept('POST', '**/data-queries/*/versions/*/run-library/*').as('editorRun');
  get(`list-query-${queryName.toLowerCase()}`).click();
  get('query-run-button').click();
  cy.wait('@editorRun').its('response.statusCode').should('be.oneOf', [200, 201]);
  get('preview-content').should('contain.text', expected);
};

// Leaving a page cancels its in-flight requests; the app reports those as unhandled "Failed to fetch". Any other
// application error still fails the test.
Cypress.on('uncaught:exception', (error) => (error.message.includes('Failed to fetch') ? false : undefined));
// Only observes real HTTP responses. Every fixture is created through product endpoints.
describe('Query Library consumer journeys', () => {
  beforeEach(() => {
    cy.apiLogin(Cypress.env('testEmail'), 'password', Cypress.env('workspaceId'));
  });

  scenario('adds an app query to the library with its app references as inputs and blocks RunJS that reads app state', () => {
    let app;
    let fetchItem;
    createApp('Add to library app').then((created) => {
      app = created;
      return createQuery(app, Cypress.env('runSourceId'), {
        name: 'fetchItem', kind: 'restapi',
        options: { method: 'get', url: '/item/{{variables.itemId}}', headers: [], body: [], url_params: [] },
      });
    }).then((query) => {
      fetchItem = query;
      return createQuery(app, app.source('runjs').id, {
        name: 'readsText', kind: 'runjs', options: { code: 'return components.text1.text;' },
      });
    }).then(() => visit(appPath(app.id)));

    get('query-handler-menu-readstext').click({ force: true });
    get('query-card-add-to-library-button').click();
    get('add-to-library-blocked').should('contain.text', 'components');
    get('confirm-add-to-library').should('not.exist');
    picture('add-to-library-blocked');
    get('cancel-add-to-library').click();

    cy.intercept('POST', '**/add-to-library').as('addToLibrary');
    get('query-handler-menu-fetchitem').click({ force: true });
    get('query-card-add-to-library-button').click();
    get('add-to-library-name').should('have.value', 'fetchItem');
    cy.contains('code', '{{variables.itemId}}').should('be.visible');
    picture('add-to-library-inputs');
    get('confirm-add-to-library').click();
    cy.wait('@addToLibrary').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      // The app query is converted in place: same row, same name, now pinned to the new v1.
      expect(response.body.query).to.include({ id: fetchItem.id, name: 'fetchItem', kind: 'library' });
      expect(Object.values(response.body.query.options.inputs)).to.deep.eq(['{{variables.itemId}}']);
      expect(response.body.query.options.libraryQueryVersionId).to.eq(response.body.libraryVersionId);
      return request('GET', `query-library/queries/${response.body.libraryQueryId}/versions`);
    }).then(({ body }) => {
      expect(body.drafts).to.deep.eq([]);
      expect(body.versions).to.have.length(1);
      expect(body.versions[0].isReleased).not.to.eq(true);
    });
    get('confirm-add-to-library').should('not.exist');
  });

  scenario('runs a library query with inputs using each environment credentials in the editor and the released app', () => {
    let app;
    let library;
    createLibrary({
      name: 'Env echo', kind: 'restapi', dataSourceId: Cypress.env('runSourceId'),
      options: { method: 'get', url: '/item/{{input.item}}', headers: [], body: [], url_params: [],
        inputs: [{ name: 'item', defaultValue: '' }] },
    }, 'Echo-v1').then((created) => {
      library = created;
      return libraryAction(library, 'promote');
    }).then(() => libraryAction(library, 'promote'))
      .then(() => libraryAction(library, 'release'))
      .then(() => createApp('Run consumer app'))
      .then((created) => {
        app = created;
        return pinConsumer(app, 'envEcho', {
          libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'restapi',
          inputs: { item: 'abc' }, runOnPageLoad: true,
        });
      }).then(() => visit(appPath(app.id)));

    get('version-switcher-button').should('be.visible');
    runInEditor('envEcho', '/development/item/abc');
    save('v1', 'Run-v1');
    promote();
    select('Run-v1', 'Staging');
    runInEditor('envEcho', '/staging/item/abc');
    picture('run-staging');
    promote();
    select('Run-v1', 'Production');
    release();

    cy.intercept('POST', '**/data-queries/*/run-library').as('viewerRun');
    cy.then(() => visit(`/applications/${app.slug || app.id}`));
    cy.wait('@viewerRun').then(({ response }) => {
      expect(response.statusCode).to.be.oneOf([200, 201]);
      expect(response.body.data.path).to.eq('/production/item/abc');
    });
  });

  scenario('blocks app promote and release until every library pin is saved, promoted and released', () => {
    let library;
    let draftId;
    let draftApp;
    let savedApp;
    request('GET', 'query-library/static-data-sources').then(({ body }) => createLibrary({
      name: 'Gate lookup', kind: 'runjs', dataSourceId: body.find((item) => item.kind === 'runjs').id,
      options: { code: 'return { gate: true };', inputs: [] },
    }, 'Gate-v1')).then((created) => {
      library = created;
      return request('POST', `query-library/queries/${library.id}/drafts`, { name: 'Gate-draft', fromVersionId: library.savedId });
    }).then(({ body }) => {
      draftId = body.id;
      return createApp('Draft pin app');
    }).then((created) => {
      draftApp = created;
      // Saved app versions are immutable, so pins are set before saving.
      return pinConsumer(draftApp, 'gateLookup', {
        libraryQueryId: library.id, libraryQueryVersionId: draftId, libraryKind: 'runjs', inputs: {},
      });
    }).then(() => createApp('Saved pin app'))
      .then((created) => {
        savedApp = created;
        return pinConsumer(savedApp, 'gateLookup', {
          libraryQueryId: library.id, libraryQueryVersionId: library.savedId, libraryKind: 'runjs', inputs: {},
        });
      }).then(() => visit(appPath(draftApp.id)));

    save('v1', 'Draft-pin');
    promoteBlocked('Promote blocked', 'is on the draft of "Gate lookup"');
    picture('gate-draft-pin');

    cy.then(() => visit(appPath(savedApp.id)));
    save('v1', 'Saved-pin');
    promoteBlocked('Promote blocked', /not promoted to staging yet/i);
    cy.then(() => libraryAction(library, 'promote'));
    promote();
    select('Saved-pin', 'Staging');
    promoteBlocked('Promote blocked', /not promoted to production yet/i);
    cy.then(() => libraryAction(library, 'promote'));
    promote();
    select('Saved-pin', 'Production');

    openRelease();
    cy.get('[data-testid="library-release-notices"]')
      .should('contain.text', 'gateLookup uses Gate lookup Gate-v1; the released version is none.');
    picture('gate-release-notice');
    get('yes-button').click();
    cy.wait('@releaseSnapshot').its('response.statusCode').should('eq', 400);
    cy.contains('Release blocked').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cancel-button"]').length) cy.get('[data-cy="cancel-button"]').click();
    });
    closeMenu();
    cy.then(() => libraryAction(library, 'release'));
    release();
  });
});
