const byCy = (name) => cy.get(`[data-cy="${name}"]`);
const row = (scope, name) => byCy(`variables-row-${scope}-${name}`);
const nameInput = () => byCy('variable-name-input');
const valueInput = () => byCy('variable-initial-value-input-field');
const backToList = () =>
  cy
    .get('[data-cy="variables-panel"]')
    .contains('[role="button"]', /^Variables$/)
    .click();

function enterValue(value) {
  valueInput()
    .find('.cm-content[contenteditable="true"]')
    .click()
    .should('be.focused')
    // The focus preview may overlap the editor after the click. Keyboard
    // input still goes to the focused editor; it needs no further mouse hit test.
    .type('{selectall}{backspace}', { force: true })
    .then(($editor) => {
      // Paste through CodeMirror's DOM boundary, preserving braces literally
      // rather than relying on the shared CDP typing helper's token rewriting.
      const win = $editor[0].ownerDocument.defaultView;
      const data = new win.DataTransfer();
      data.setData('text/plain', value);
      $editor[0].dispatchEvent(
        new win.ClipboardEvent('paste', {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        })
      );
    });
  valueInput().find('.cm-content').should('have.text', value);
}

function createVariable(scope, name, value) {
  byCy(`variables-add-${scope}`).click();
  nameInput().type(name);
  enterValue(value);
  byCy('variable-create-button').click();
  byCy('variable-detail-form').should('be.visible');
  backToList();
  row(scope, name).should('be.visible');
}

function deleteSelected() {
  byCy('dependency-detail-menu-button').click();
  byCy('dependency-detail-menu-delete-variable').click();
}

describe('Declared app and page variables', () => {
  let createdAppId;

  beforeEach(() => {
    createdAppId = null;
    // EmbedApp interprets window.name as an embedding PAT. Cypress names its
    // AUT iframe, so clear that browser boundary before editor JS reads it.
    cy.on('window:before:load', (win) => {
      win.name = '';
    });
    cy.apiLogin();
    // Send only AppCreateDto fields; the legacy apiCreateApp helper also sends
    // response-only fields rejected by the current API's strict validation.
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('server_host')}/api/apps`,
        headers,
        body: { name: `Declared variables ${Date.now()}`, type: 'front-end' },
      }).then(({ status, body }) => {
        expect(status).to.equal(201);
        createdAppId = body.id;
        Cypress.env('appId', body.id);
      });
    });
    cy.openApp();
    byCy('left-sidebar-variables-button').click();
    byCy('variables-panel').should('be.visible');
  });

  afterEach(() => {
    if (createdAppId) cy.apiDeleteApp(createdAppId);
  });

  it('validates names and displays a rejected self-reference without creating a variable', () => {
    byCy('variables-new-button').click();
    byCy('variable-create-button').should('be.disabled');
    nameInput().type('bad-name');
    byCy('variable-create-button').should('be.disabled');
    nameInput().clear().type('loop');
    enterValue('{{variables.loop}}');
    byCy('variable-create-button').click();
    byCy('variable-value-error').should('contain.text', 'Circular reference: loop → loop');
    byCy('variable-create-form').should('be.visible');
    backToList();
    row('app', 'loop').should('not.exist');
  });

  it('persists same-name app and page definitions through a real reload and filters the list', () => {
    cy.intercept('PUT', '**/global_settings').as('saveAppVariables');
    createVariable('app', 'threshold', '5');
    cy.wait('@saveAppVariables').its('response.statusCode').should('be.within', 200, 299);
    cy.intercept('PUT', '**/pages').as('savePageVariables');
    createVariable('page', 'threshold', '10');
    cy.wait('@savePageVariables').its('response.statusCode').should('be.within', 200, 299);

    cy.reload();
    byCy('left-sidebar-variables-button').click();
    row('app', 'threshold').should('contain.text', '5');
    row('page', 'threshold').should('contain.text', '10');
    byCy('variables-search-input').type('missing');
    byCy('variables-empty-app').should('contain.text', 'No matches');
    byCy('variables-empty-page').should('contain.text', 'No matches');
    byCy('variables-search-input').clear().type('THRESH');
    row('app', 'threshold').should('be.visible');
    row('page', 'threshold').should('be.visible');
  });

  it('edits a dependency through CodeMirror and shows the recalculated value', () => {
    createVariable('app', 'threshold', '5');
    createVariable('app', 'doubled', '{{variables.threshold * 2}}');
    row('app', 'doubled').should('contain.text', '10');
    row('app', 'threshold').click();
    enterValue('8');
    byCy('variable-value-preview').should('contain.text', '8');
    backToList();
    row('app', 'doubled').should('contain.text', '16');
  });

  it('cancels and confirms reference warnings without rewriting the dependent expression', () => {
    createVariable('app', 'threshold', '5');
    createVariable('app', 'doubled', '{{variables.threshold * 2}}');
    row('app', 'threshold').click();
    nameInput().clear().type('minimum{enter}');
    cy.contains('[role="dialog"]', 'Rename threshold to minimum?').should('be.visible');
    byCy('variable-references-list').should('contain.text', 'doubled');
    byCy('variable-references-cancel').click();
    nameInput().should('have.value', 'threshold');

    deleteSelected();
    cy.contains('[role="dialog"]', 'Delete threshold?').should('be.visible');
    byCy('variable-references-cancel').click();
    byCy('variable-detail-form').should('be.visible');
    deleteSelected();
    byCy('variable-references-confirm').click();
    row('app', 'threshold').should('not.exist');
    row('app', 'doubled').click();
    valueInput().should('contain.text', 'variables.threshold');
  });
});
