const phase = Cypress.env('queryLibraryLicenseCase');
const enabled = phase !== 'disabled';
const get = (name) => cy.get(`[data-cy="${name}"]`);
const api = (method, path, body, anonymous = false) => {
  const send = (headers) => cy.request({ method, url: `${Cypress.env('server_host')}/api/${path}`, headers, body,
    failOnStatusCode: false, log: false });
  return anonymous ? send({}) : cy.getAuthHeaders().then(send);
};

describe(`Query Library licensing: ${phase}`, () => {
  beforeEach(() => cy.apiLogin(Cypress.env('testEmail'), 'password', Cypress.env('workspaceId')));

  it('uses the effective flag for discovery and direct editor navigation', () => {
    api('GET', 'license/access').its('body.queryLibraryEnabled').should('eq', enabled);
    cy.visit(`/${Cypress.env('workspaceId')}`);
    cy.contains('[role="tab"]', 'Query library').should(enabled ? 'be.visible' : 'not.exist');
    cy.visit(`/${Cypress.env('workspaceId')}/query-library`);
    if (enabled) {
      get('query-library-page').should('be.visible');
      cy.contains('License RunJS').should('be.visible');
    } else {
      cy.get('[role="alert"]').should('contain.text', 'upgrade');
      get('query-library-page').should('not.exist');
      api('GET', 'query-library/catalog').its('status').should('eq', 451);
      api('POST', 'query-library/queries', { name: 'Denied query', kind: 'runjs', dataSourceId: Cypress.env('licenseSourceId'), options: { code: 'return 1;' } }).its('status').should('eq', 451);
    }
    if (enabled) cy.contains('.query-row', 'License RunJS').screenshot(`license-${phase}-editor`);
    else cy.contains('[role="alert"]', 'upgrade').screenshot(`license-${phase}-editor`);
  });

  it('enforces public consumer requests and preserves ordinary query writes', () => {
    api('POST', `data-queries/${Cypress.env('licensePublicJSId')}/library-definition`, {}, true)
      .then(({ status, body }) => {
        expect(status).to.eq(enabled ? 201 : 451);
        if (enabled) expect(body.kind).to.eq('runjs');
      });
    api('POST', `data-queries/${Cypress.env('licensePublicServerId')}/run-library`, {}, true)
      .then(({ status, body }) => {
        expect(status).to.eq(enabled ? 201 : 451);
        if (enabled) { expect(body.status).to.eq('ok'); expect(body.data).to.deep.eq({ licenseAnswer: 42 }); }
      });
    api('PATCH', `data-queries/${Cypress.env('licenseOrdinaryId')}/versions/${Cypress.env('licenseVersionId')}`, { options: { code: 'return 7;' } }).its('status').should('eq', 200);
    if (!enabled) {
      api('POST', `data-queries/${Cypress.env('licenseOrdinaryId')}/versions/${Cypress.env('licenseVersionId')}/add-to-library`, {
        name: 'Denied conversion', sourceOptions: { code: 'return 7;' }, libraryOptions: { code: 'return 7;' }, inputs: {},
      }).its('status').should('eq', 451);
    }
  });

  it('runs browser JavaScript only when licensed and keeps the same pin', () => {
    cy.visit(`/${Cypress.env('workspaceId')}/apps/${Cypress.env('licenseAppId')}`);
    get('list-query-licensejs').click();
    if (enabled) {
      get('query-run-button').should('not.be.disabled').click();
      get('preview-content').should('contain.text', '42');
      api('GET', `data-queries/${Cypress.env('licenseVersionId')}`).then(({ body }) => {
        const consumer = body.data_queries.find((query) => query.id === Cypress.env('licenseJSId'));
        expect(consumer.options.libraryQueryId).to.eq(Cypress.env('licenseQueryId'));
        expect(consumer.options.libraryQueryVersionId).to.eq(Cypress.env('licensePinId'));
      });
    } else {
      get('query-run-button').should('be.disabled');
      cy.get('[role="alert"]').should('contain.text', 'upgrade');
      get('show-ds-popover-button').click();
      get('ds-librarydefault').should('not.exist');
      get('ds-restapidefault').should('be.visible');
      get('show-ds-popover-button').click();
    }
    if (enabled) get('query-name-label').screenshot(`license-${phase}-consumer`);
    else cy.contains('[role="alert"]', 'upgrade').screenshot(`license-${phase}-consumer`);
  });
});
