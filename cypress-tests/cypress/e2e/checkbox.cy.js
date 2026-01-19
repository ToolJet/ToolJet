describe('checbox', () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget('Checkbox');
  });
  it('should verify properties', () => {
    cy.wait(1000)
    /* ==== Generated with Cypress Studio ==== */
    // cy.get('[data-cy="edit-widget-name"]').clear('checkbox1');
    // cy.get('[data-cy="edit-widget-name"]').type('Test');
    // cy.get('[data-cy="label-input-field"] > .CodeMirror > .CodeMirror-scroll > .CodeMirror-sizer > [style="position: relative; top: 0px;"] > .CodeMirror-lines > [style="position: relative; outline: none;"] > .CodeMirror-code > .CodeMirror-line').click();
    // cy.get('#collapse-0 > .accordion-body > :nth-child(2) > :nth-child(1) > [style="display: block;"] > .row > .col > .field > .form-check').click();
    // cy.get('[data-cy="default-status-toggle-button"]').check();
    // cy.get('[data-cy="add-event-handler"]').click();
    // cy.get('#collapse-2 > .accordion-body > :nth-child(1) > .codeShow-active > [style="display: flex; justify-content: space-between;"]').click();
    // cy.get('[data-cy="show-on-desktop-toggle-button"]').uncheck();
    // cy.get('[data-cy="show-on-mobile-toggle-button"]').check();
    // cy.get('[data-cy="button-change-layout-to-mobile"] > svg').click();
    // cy.get('[data-cy="button-change-layout-to-desktop"] > svg > path').click();
    // cy.get('[data-cy="show-on-desktop-toggle-button"]').check();
    // /* ==== End Cypress Studio ==== */
    /* ==== Generated with Cypress Studio ==== */
    cy.get('[data-cy="edit-widget-name"]').clear('checkbox1');
    cy.get('[data-cy="edit-widget-name"]').type('Test');
    cy.get('[data-cy="real-canvas"]').click();
    cy.get('[data-cy="test-config-handle"] > span').click();
    cy.get('[data-cy="real-canvas"]').click();
    cy.get('[data-cy="test-config-handle"]').click();
    cy.get('[data-cy="default-status-toggle-button"]').check();
    cy.get('[data-cy="add-event-handler"]').click();
    cy.get('[data-cy="real-canvas"]').click();
    cy.get('.badge').click();
    cy.get('[data-cy="show-on-mobile-toggle-button"]').check();
    cy.get('[data-cy="show-on-desktop-toggle-button"]').uncheck();
    cy.get('[data-cy="button-change-layout-to-mobile"] > svg').click();
    cy.get('[data-cy="button-change-layout-to-desktop"] > svg').click();
    cy.get('[data-cy="show-on-desktop-toggle-button"]').check();
    cy.get('[data-cy="sidebar-option-styles"]').click();
    cy.get('[data-cy="text-color-picker"]').click();
    cy.get('.hue-horizontal').click();
    cy.get('.saturation-black').click();
    cy.get('[style="position: fixed; inset: 0px;"]').click();
    cy.get('[data-cy="checkbox-color-picker"]').click();
    cy.get('.saturation-black').click();
    cy.get('[style="position: fixed; inset: 0px;"]').click();
    cy.get('[data-cy="visibility-toggle-button"]').uncheck();
    cy.get('[data-cy="visibility-toggle-button"]').check();
    cy.get('[data-cy="disable-toggle-button"]').check();
    cy.get('[data-cy="disable-toggle-button"]').uncheck();
    cy.get('[data-cy="box-shadow-value"]').click();
    cy.get('[data-cy="box-shadow-color-picker-icon"]').click();
    cy.get('.saturation-black').click();
    cy.get('[data-cy="real-canvas"]').click();
    /* ==== End Cypress Studio ==== */
  })
  // it('should verify properties', () => {

  // })
})