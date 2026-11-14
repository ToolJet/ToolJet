import { emailInputSelector, baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";

/**
 * MODULE — appBuilder/components/baseInput: browser-only geometry + computed-style helpers for the
 * BaseInput family (TextInput, EmailInput, PasswordInput, NumberInput, TextArea). These cover what
 * jsdom cannot: measured label width, real rects, and `var()` colours resolved by the cascade.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  getRect('[data-cy="emailinput1-label"]').then((r) => ...)
 * @tjDom    first matching element's getBoundingClientRect() → {left,right,top,bottom,width,height}
 */
export const getRect = (selector) =>
  cy.get(selector).first().then(($el) => {
    const r = $el[0].getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  });

/**
 * @tjBlock  canvas
 * @tjUsage  expectRectInside('.tj-input-clear-btn', '[data-cy="emailinput1-actionable-section"]')
 * @tjDom    retries until the inner element's rect lies within the outer element's rect (± tolerance px)
 */
export const expectRectInside = (innerSelector, outerSelector, tolerance = 0.5) => {
  cy.get(outerSelector).first().should(($outer) => {
    const inner = Cypress.$(innerSelector)[0];
    expect(inner, `${innerSelector} rendered`).to.exist;
    const i = inner.getBoundingClientRect();
    const o = $outer[0].getBoundingClientRect();
    expect(i.left, `${innerSelector} left ≥ field left`).to.be.gte(o.left - tolerance);
    expect(i.right, `${innerSelector} right ≤ field right`).to.be.lte(o.right + tolerance);
    expect(i.top, `${innerSelector} top ≥ field top`).to.be.gte(o.top - tolerance);
    expect(i.bottom, `${innerSelector} bottom ≤ field bottom`).to.be.lte(o.bottom + tolerance);
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectRectsDisjoint('.tj-input-clear-btn', '[data-cy="emailinput1-label"]')
 * @tjDom    retries until the two elements' rects do not overlap (touching edges allowed)
 */
export const expectRectsDisjoint = (aSelector, bSelector, tolerance = 0.5) => {
  cy.get(aSelector).first().should(($a) => {
    const b = Cypress.$(bSelector)[0];
    expect(b, `${bSelector} rendered`).to.exist;
    const r1 = $a[0].getBoundingClientRect();
    const r2 = b.getBoundingClientRect();
    const overlapX = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
    const overlapY = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
    const overlaps = overlapX > tolerance && overlapY > tolerance;
    expect(overlaps, `${aSelector} overlaps ${bSelector} (dx=${overlapX.toFixed(1)}, dy=${overlapY.toFixed(1)})`).to.be.false;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectLabelFieldSplit('emailinput1', 0.5, 0.5)   // fieldShare null → field fills the remainder
 * @tjDom    label/field widths as a share of the `.text-input` row; side-by-side, no overlap, inside the row
 */
export const expectLabelFieldSplit = (widgetName, labelShare, fieldShare, tolerancePx = 2) => {
  cy.get(emailInputSelector.row(widgetName)).first().should(($row) => {
    const row = $row[0].getBoundingClientRect();
    const label = $row[0].querySelector(emailInputSelector.label(widgetName)).getBoundingClientRect();
    const field = $row[0].querySelector(emailInputSelector.field(widgetName)).getBoundingClientRect();
    expect(Math.abs(label.width - row.width * labelShare), `label width ${label.width} ≈ ${labelShare} × row ${row.width}`).to.be.lte(tolerancePx);
    if (fieldShare !== null) {
      expect(Math.abs(field.width - row.width * fieldShare), `field width ${field.width} ≈ ${fieldShare} × row ${row.width}`).to.be.lte(tolerancePx);
    } else {
      // fieldShare null → the field takes whatever the label leaves: it ends at the row's right edge
      expect(Math.abs(field.right - row.right), "field fills the rest of the row").to.be.lte(tolerancePx);
    }
    // side-by-side: field starts where the label ends and stays inside the row
    expect(Math.abs(field.left - label.right), "field starts at label's right edge").to.be.lte(tolerancePx);
    expect(field.right, "field stays inside the row").to.be.lte(row.right + tolerancePx);
    expect(label.left, "label starts at the row's left edge").to.be.closeTo(row.left, tolerancePx);
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  getLabelShare('emailinput1').then((share) => ...)
 * @tjDom    label rect width ÷ `.text-input` row rect width
 */
export const getLabelShare = (widgetName) =>
  cy.get(emailInputSelector.row(widgetName)).first().then(($row) => {
    const row = $row[0].getBoundingClientRect();
    const label = $row[0].querySelector(emailInputSelector.label(widgetName)).getBoundingClientRect();
    return label.width / row.width;
  });

/**
 * @tjBlock  styles
 * @tjUsage  setLabelWidth(50)
 * @tjDom    Styles tab › Label: uncheck auto-width-checkbox, then {selectall}+type into width-input-field (slider-coupled)
 */
export const setLabelWidth = (width) => {
  // The number box is controlled and re-seeds "0" on clear(), leaving the caret before it — so
  // clear().type("50") yields "500" → clamped to 100. {selectall} replaces the seeded value instead.
  cy.get(baseInputStyleSelector.autoWidthCheckbox).then(($c) => {
    if ($c.is(":checked")) cy.get(baseInputStyleSelector.autoWidthCheckbox).uncheck({ force: true });
  });
  cy.get(baseInputStyleSelector.widthInput).should("be.enabled").type(`{selectall}${width}`);
  cy.get(baseInputStyleSelector.widthInput).should("have.value", `${width}`);
};

/**
 * @tjBlock  styles
 * @tjUsage  selectStyleSwitch('right')
 * @tjDom    Radix segmented switch `togglr-button-<value>`; selected state on parent [role="radio"]
 */
export const selectStyleSwitch = (value) => {
  cy.get(baseInputStyleSelector.switchOption(value)).click({ force: true });
  cy.get(baseInputStyleSelector.switchOption(value))
    .closest('[role="radio"]')
    .should("have.attr", "aria-checked", "true");
};

/**
 * @tjBlock  styles
 * @tjUsage  resolveCssVarColor('--cc-error-systemStatus', '[data-cy="emailinput1-actionable-section"]').then((rgb) => ...)
 * @tjDom    appends a probe <span style="color:var(--x)"> under the scope element, reads its computed colour, removes it
 */
export const resolveCssVarColor = (varName, scopeSelector) =>
  cy.get(scopeSelector).first().then(($scope) => {
    const doc = $scope[0].ownerDocument;
    const probe = doc.createElement("span");
    probe.style.color = `var(${varName})`;
    $scope[0].appendChild(probe);
    const color = doc.defaultView.getComputedStyle(probe).color;
    probe.remove();
    return color;
  });

/**
 * @tjBlock  styles
 * @tjUsage  expectComputedColor('[data-cy="emailinput1-actionable-section"]', 'border-top-color', 'rgb(255, 0, 0)')
 * @tjDom    retries getComputedStyle(el)[prop] === expected (computed, not inline)
 */
export const expectComputedColor = (selector, cssProperty, expected) => {
  cy.get(selector).first().should(($el) => {
    const actual = $el[0].ownerDocument.defaultView.getComputedStyle($el[0]).getPropertyValue(cssProperty);
    expect(actual, `${selector} computed ${cssProperty}`).to.eq(expected);
  });
};

/**
 * @tjBlock  contexts
 * @tjUsage  importAppFixture('templates/appbuilderApps/emailInputPreRevamp.json', 'Legacy app')
 * @tjDom    POST /api/v2/resources/import with a fixture export; stores the new app id in Cypress.env('appId')
 */
export const importAppFixture = (fixturePath, appName) =>
  cy.getCookie("tj_auth_token").then((cookie) =>
    cy.fixture(fixturePath).then((fixture) => {
      const body = Cypress._.cloneDeep(fixture);
      body.organization_id = Cypress.env("workspaceId");
      body.app = body.app.map((app) => ({ ...app, appName }));
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/resources/import`,
          headers: {
            "Content-Type": "application/json",
            "Tj-Workspace-Id": Cypress.env("workspaceId"),
            Cookie: `tj_auth_token=${cookie.value}`,
          },
          body,
        })
        .then((res) => {
          expect(res.status, "import status").to.eq(201);
          const appId = res.body.imports.app[0].id;
          Cypress.env("appId", appId);
          return appId;
        });
    })
  );

/**
 * @tjBlock  contexts
 * @tjUsage  releaseAndMakePublic('my-app-slug')
 * @tjDom    REST on Cypress.env('appId'): publish draft → promote dev→staging→production → release → slug → is_public
 */
export const releaseAndMakePublic = (slug, appId = Cypress.env("appId")) => {
  // Name-based apiReleaseApp/apiAddAppSlug resolve the id through a direct DB query (cy.getAppId);
  // this stays on the REST API with the id the spec already holds.
  cy.apiPublishDraftVersion("v1");
  cy.apiPromoteAppVersion().then(() => cy.apiPromoteAppVersion(Cypress.env("stagingEnvId")));
  cy.getAuthHeaders().then((headers) => {
    cy.request({ method: "GET", url: `${Cypress.env("server_host")}/api/apps/${appId}`, headers }).then((res) => {
      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/apps/${appId}/release`,
        headers,
        body: { versionToBeReleased: res.body.editing_version.id },
      }).its("status").should("eq", 200);
    });
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/apps/${appId}`,
      headers,
      body: { app: { slug, is_public: true } },
    }).its("status").should("eq", 200);
  });
};
