const get = (name) => cy.get(`[data-cy="${name}"]`);
const request = (method, path, body, failOnStatusCode = true) => cy.getAuthHeaders().then((headers) =>
  cy.request({ method, url: `${Cypress.env('server_host')}/api/${path}`, headers, body, failOnStatusCode, log: false }));
const menu = () => {
  get('version-switcher-button').then(($button) => {
    if (!$button.hasClass('opened')) cy.wrap($button).click();
  });
  cy.get('#version-manager-popover').should('be.visible');
};
const select = (name, environment) => get('version-switcher-button').then(($button) => {
  if ($button.text().includes(name) && (!environment || $button.text().includes(environment))) return;
  menu();
  if (environment) cy.get('.environment-toggle').contains('button', environment).click();
  get(`${name.toLowerCase()}-version-name`).click();
  get('version-switcher-button').should('contain.text', name);
  cy.get('#version-manager-popover').should('not.exist');
});
const scenario = (name, run) => {
  if (!Cypress.env('lifecycleScenario') || name.includes(Cypress.env('lifecycleScenario'))) it(name, run);
};
const picture = (name) => cy.screenshot(name, { capture: 'viewport' });
const save = (oldName, newName, screenshot) => {
  menu();
  get(`${oldName.toLowerCase()}-save-version-button`).click();
  get('version-name-input-field').clear().type(newName);
  get('version-description-input-field').clear().type('Immutable saved description');
  if (screenshot) picture(screenshot);
  get('version-name-input-field').should('have.value', newName);
  get('create-version-save-button').click();
  cy.then(() => {
    if (Cypress.env('moduleId')) cy.wait('@saveModuleVersion').then(({ request: saved, response }) => {
      expect(saved.body.name).to.eq(newName);
      expect(response.statusCode).to.eq(200);
    });
  });
  get('create-version-save-button').should('not.exist');
  get('version-switcher-button').should('contain.text', newName);
};
const createDraft = (name, screenshot) => {
  menu();
  get('create-draft-version-button').click();
  get('version-name-input-field').clear().type(name);
  if (screenshot) picture(screenshot);
  get('create-draft-version-create-button').click();
  get('create-draft-version-create-button').should('not.exist');
  get('version-switcher-button').should('contain.text', name);
};
const promote = (screenshot) => {
  menu();
  get('promote-version-button').click();
  if (screenshot) picture(screenshot);
  cy.get('.modal').find('[data-cy="promote-button"]').click();
  cy.get('.modal').should('not.exist');
  get('version-switcher-button').then(($button) => {
    if ($button.hasClass('opened')) cy.wrap($button).click();
  });
  cy.get('#version-manager-popover').should('not.exist');
};
const release = (screenshot) => {
  cy.intercept('**/api/**/release').as('releaseSnapshot');
  menu();
  get('release-version-button').click();
  if (screenshot) picture(screenshot);
  get('yes-button').click();
  cy.wait('@releaseSnapshot').its('response.statusCode').should('be.oneOf', [200, 201]);
  get('yes-button').should('not.exist');
};
const darkDialogs = (resource) => {
  createDraft('Dark-candidate', `${resource}-create-draft-dark`);
  menu();
  get('dark-candidate-version-more-menu-button').click();
  get('dark-candidate-edit-version-button').click();
  get('edit-version-description-input-field').clear().type('Dark draft details');
  picture(`${resource}-edit-dark`);
  get('save-button').click();
  get('save-button').should('not.exist');
  save('Dark-candidate', 'Dark-saved');
  promote(`${resource}-promote-dark`);
  select('Dark-saved', 'Staging');
  promote();
  select('Dark-saved', 'Production');
  release(`${resource}-release-dark`);
};
const visit = (path, dark = false) => cy.visit(path, { onBeforeLoad(win) {
  win.localStorage.setItem('darkMode', String(dark));
  win.localStorage.setItem('walkthroughCompleted', 'true');
} });

// Only observes real HTTP responses. No lifecycle, authentication or licensing response is stubbed.
describe('Query Library named version lifecycle', () => {
  beforeEach(() => {
    cy.apiLogin(Cypress.env('testEmail'), 'password', Cypress.env('workspaceId'));
  });

  scenario('creates app and module consumers from the Library card with explicit draft and saved pins', () => {
    let libraryId;
    let savedId;
    let draftId;
    let emptyApp;
    let creates = 0;
    cy.intercept('POST', '**/api/data-queries/data-sources/*/versions/*', (req) => {
      creates += 1;
      req.alias = 'createConsumer';
    });
    request('POST', 'apps', { name: 'Empty catalog picker', type: 'front-end', icon: 'floppydisk' }).then(({ body }) => {
      emptyApp = body.id;
      visit(`/${Cypress.env('workspaceId')}/apps/${emptyApp}`);
    });
    get('library-add-query-card').click();
    cy.contains('No queries in the query library yet').should('be.visible');
    get('create-library-consumer').should('be.disabled');
    cy.contains('button', 'Cancel').click();
    cy.then(() => expect(creates).to.eq(0));
    request('GET', 'query-library/static-data-sources').then(({ body }) => {
      const source = body.find((item) => item.kind === 'runjs');
      return request('POST', 'query-library/queries', { name: 'Picker lookup', kind: 'runjs', dataSourceId: source.id, options: { code: 'return { answer: 42 };', inputs: [] } });
    })
      .then(({ body }) => {
        libraryId = body.id;
        savedId = body.draftId;
        return request('POST', `query-library/queries/${libraryId}/drafts/${savedId}/save`, { name: 'Stable' });
      }).then(() => request('POST', `query-library/queries/${libraryId}/drafts`, { name: 'Experiment', fromVersionId: savedId }))
      .then(({ body }) => { draftId = body.id; });
    for (const type of ['front-end', 'module']) {
      for (const pinKind of ['saved', 'draft']) {
        let versionId;
        let consumerId;
        request('POST', type === 'module' ? 'modules' : 'apps', { name: `Picker ${type} ${pinKind}`, type, icon: 'floppydisk' })
          .then(({ body }) => {
            visit(`/${Cypress.env('workspaceId')}/apps/${body.id}`);
            return request('GET', `apps/${body.id}`);
          }).then(({ body }) => { versionId = body.editing_version.id; });
        get('library-add-query-card').click();
        cy.contains('Select a query').click();
        cy.get('[role="option"]').contains('Picker lookup').click();
        if (pinKind === 'draft') {
          cy.contains('Stable · Development').click();
          cy.get('[role="option"]').contains('Experiment · Draft (testing only)').click();
        }
        // A chosen target remains local until the user confirms creation.
        cy.contains('button', 'Cancel').click();
        get('library-add-query-card').click();
        cy.contains('Select a query').click();
        cy.get('[role="option"]').contains('Picker lookup').click();
        if (pinKind === 'draft') {
          cy.contains('Stable · Development').click();
          cy.get('[role="option"]').contains('Experiment · Draft (testing only)').click();
        }
        get('create-library-consumer').click();
        cy.wait('@createConsumer').then(({ request: sent, response }) => {
          expect(response.statusCode).to.eq(201);
          expect(sent.body.options).to.include({ libraryQueryId: libraryId, libraryQueryVersionId: pinKind === 'draft' ? draftId : savedId });
          expect(sent.body.options).not.to.have.property('libraryVersion');
          consumerId = response.body.id;
        });
        get('query-run-button').click();
        get('preview-content').should('contain.text', '42');
        cy.then(() => request('GET', `data-queries/${versionId}?mode=edit`)).then(({ body }) => {
          const persisted = body.data_queries.find((query) => query.id === consumerId);
          expect(persisted.options).to.include({ libraryQueryId: libraryId, libraryQueryVersionId: pinKind === 'draft' ? draftId : savedId });
        });
        picture(`consumer-${type}-${pinKind}`);
      }
    }
  });

  scenario('creates independent drafts, saves unchanged content, promotes and releases older and newer versions', () => {
    let queryId;
    let originalId;
    let draftA;
    let draftB;
    cy.intercept('POST', '**/api/query-library/queries').as('createQuery');
    visit(`/${Cypress.env('workspaceId')}/query-library`);
    get('query-library-page').should('be.visible');
    get('restapi-add-query-card').first().click();
    cy.wait('@createQuery').then(({ response }) => {
      expect(response.statusCode).to.eq(201);
      queryId = response.body.id;
      originalId = response.body.draftId;
      Cypress.env('libraryQueryId', queryId);
      Cypress.env('libraryQueryName', response.body.name);
    });
    save('v1', 'Original', 'library-save-light');
    cy.then(() => request('GET', `query-library/queries/${queryId}/versions`)).then(({ body }) => {
      expect(body.versions[0]).to.include({ id: originalId, name: 'Original', description: 'Immutable saved description' });
    });
    createDraft('Branch-A', 'library-create-draft-light');
    createDraft('Branch-B');
    cy.then(() => request('GET', `query-library/queries/${queryId}/versions`)).then(({ body }) => {
      draftA = body.drafts.find((draft) => draft.name === 'Branch-A');
      draftB = body.drafts.find((draft) => draft.name === 'Branch-B');
      expect(draftA.id).not.to.eq(draftB.id);
      Cypress.env('libraryPinnedDraft', draftB.id);
    });
    select('Branch-A');
    menu();
    get('branch-a-version-more-menu-button').click();
    get('branch-a-edit-version-button').click();
    get('edit-version-description-input-field').clear().type('Only A changes');
    picture('library-edit-light');
    get('save-button').click();
    get('save-button').should('not.exist');
    cy.then(() => request('GET', `query-library/queries/${queryId}/versions`)).then(({ body }) => {
      expect(body.drafts.find((draft) => draft.id === draftA.id).description).to.eq('Only A changes');
      expect(body.drafts.find((draft) => draft.id === draftB.id).description).not.to.eq('Only A changes');
    });
    save('Branch-A', 'Newer'); // No content change is required to save a named snapshot.
    promote('library-promote-light');
    get('version-switcher-button').should('contain.text', 'Newer').and('contain.text', 'Staging');
    select('Newer', 'Staging');
    promote();
    get('version-switcher-button').should('contain.text', 'Newer').and('contain.text', 'Production');
    cy.contains('This query is connected to a local data source which has been').should('not.exist');
    select('Newer', 'Production');
    release('library-release-light');
    select('Original', 'Development');
    promote();
    select('Original', 'Staging');
    promote();
    select('Original', 'Production');
    release();
    select('Newer', 'Production');
    release();
    cy.then(() => request('GET', `query-library/queries/${queryId}/versions`)).then(({ body }) => {
      expect(body.versions.filter((version) => version.isReleased).map((version) => version.name)).to.deep.eq(['Newer']);
      expect(body.versions.find((version) => version.name === 'Newer').id).to.eq(draftA.id);
    });
    createDraft('From-production');
    get('version-switcher-button').should('contain.text', 'Development');
    picture('library-create-from-production');
    visit(`/${Cypress.env('workspaceId')}/query-library`, true);
    cy.then(() => get(`list-query-${Cypress.env('libraryQueryName').toLowerCase()}`).click());
    select('Branch-B', 'Development');
    menu();
    get('branch-b-save-version-button').click();
    picture('library-save-dark');
    get('create-version-cancel-button').click();
    darkDialogs('library');
  });

  scenario('uses the same Save, Create draft, Edit, Promote and Release dialogs for Modules', () => {
    request('POST', 'modules', { name: 'Browser lifecycle module', icon: 'floppydisk', type: 'module' }).then(({ body }) => {
      Cypress.env('moduleId', body.id);
      visit(`/${Cypress.env('workspaceId')}/apps/${body.id}`);
    });
    get('version-switcher-button').should('be.visible');
    cy.intercept('PUT', '**/api/v2/apps/*/versions/*', (req) => {
      if (req.body.status === 'PUBLISHED') req.alias = 'saveModuleVersion';
    });
    save('v1', 'Original', 'module-save-light');
    createDraft('Branch-A', 'module-create-draft-light');
    menu();
    get('branch-a-version-more-menu-button').click();
    get('branch-a-edit-version-button').click();
    picture('module-edit-light');
    get('edit-version-description-input-field').clear().type('Module draft details');
    get('save-button').click();
    get('save-button').should('not.exist');
    save('Branch-A', 'Newer');
    promote('module-promote-light');
    select('Newer', 'Staging');
    promote();
    get('version-switcher-button').should('contain.text', 'Newer').and('contain.text', 'Production');
    cy.contains('This query is connected to a local data source which has been').should('not.exist');
    select('Newer', 'Production');
    release('module-release-light');
    createDraft('Dark-draft');
    cy.then(() => visit(`/${Cypress.env('workspaceId')}/apps/${Cypress.env('moduleId')}`, true));
    select('Dark-draft', 'Development');
    menu();
    get('dark-draft-save-version-button').click();
    picture('module-save-dark');
    get('create-version-cancel-button').click();
    darkDialogs('module');
  });

  scenario('blocks deletion for app and module consumers and preserves selection after I understand', () => {
    // Each consumer is created through real product endpoints; no fixture endpoint exists.
    for (const type of ['front-end', 'module']) {
      let consumerId;
      let consumerVersionId;
      request('POST', type === 'module' ? 'modules' : 'apps', { name: `Pinned ${type}`, type, icon: 'floppydisk' })
        .then(({ body }) => request('GET', `apps/${body.id}`))
        .then(({ body }) => {
          const versionId = body.editing_version.id;
          consumerVersionId = versionId;
          return request('GET', `data-sources/${Cypress.env('workspaceId')}/environments/${body.editorEnvironment.id}/versions/${versionId}?branch_id=${body.editing_version.branch_id}`)
            .then(({ body: sources }) => {
              const source = sources.data_sources.find((item) => item.kind === 'library');
              expect(source, 'Library source').to.exist;
              return request('POST', `data-queries/data-sources/${source.id}/versions/${versionId}`, {
                name: 'libraryConsumer', kind: 'library', options: {
                  libraryQueryId: Cypress.env('libraryQueryId'), libraryQueryVersionId: Cypress.env('libraryPinnedDraft'), inputs: {},
                },
              });
            });
        }).then(({ body }) => { consumerId = body.id; });
      visit(`/${Cypress.env('workspaceId')}/query-library`);
      cy.then(() => get(`list-query-${Cypress.env('libraryQueryName').toLowerCase()}`).click());
      select('Branch-B', 'Development');
      menu();
      get('branch-b-version-more-menu-button').click();
      get('branch-b-delete-version-button').click();
      cy.contains('button', 'Delete version').click();
      get('dependent-apps-acknowledge-button').should('contain.text', 'I understand');
      picture(`library-${type}-dependency-light`);
      get('dependent-apps-acknowledge-button').click();
      get('version-switcher-button').should('contain.text', 'Branch-B');
      request('DELETE', `query-library/queries/${Cypress.env('libraryQueryId')}`, undefined, false)
        .its('status').should('eq', 409);
      cy.then(() => request('DELETE', `data-queries/${consumerId}/versions/${consumerVersionId}`)).its('status').should('eq', 200);
    }
  });
});
