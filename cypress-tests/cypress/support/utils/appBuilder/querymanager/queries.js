// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// queries.js
//   selectQueryFromLandingPage       -                    → common
//   deleteQuery                      -                    → common
//   query                            -                    → common
//   changeQueryToggles               -                    → common
//   renameQueryFromEditor            -                    → common
//   addInputOnQueryField             -                    → common
//   waitForQueryAction               -                    → common
//   selectRunQueryEvent              events               → events
//   chainQuery                       -                    → events
//   addSuccessNotification           -                    → common
//   performQueryAction               -                    → common
//   verifypreview                    -                    → common
//   addQueryN                        -                    → common
//   addQuery                         -                    → common
//   addDsAndAddQuery                 -                    → common
//   addQueryAndOpenEditor            -                    → common
//   createDataQuery                  -                    → common
//   createRestAPIQuery               -                    → common
//   verifyPreviewData                -                    → common
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/querymanager/queries: **Query panel** helpers (create, rename,
 * configure, preview, delete queries + wire query events).
 * FOR AI: operate the bottom query manager, not a component. Route by need:
 *   create via API+UI      → addQuery / addQueryN / addQueryAndOpenEditor / addDsAndAddQuery
 *   create purely via API  → createDataQuery / createRestAPIQuery
 *   rename / duplicate /    → renameQueryFromEditor · performQueryAction · deleteQuery
 *     delete a query
 *   fill a query field      → addInputOnQueryField
 *   run / wait / preview    → query · waitForQueryAction · verifypreview / verifyPreviewData
 *   query events & chaining → selectRunQueryEvent (Run-Query event) · chainQuery · addSuccessNotification
 * NOTE: selectRunQueryEvent is a local copy of the events.js flow — it drives the
 *   Radix `action-selection` Select via keyboard and gates on data-state; do not
 *   replace with events.js selectEvent (see its inline rationale).
 * NOT here: component event handlers → appBuilder/events.js · datasource connection
 *   setup → marketplace/datasources · component-state tree → inspectorTree.js.
 */
import { postgreSqlSelector } from "Selectors/postgreSql";
import { selectEvent } from "Support/utils/appBuilder/events";
import { commonSelectors, commonQuerySelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { navigateToAppEditor } from "Support/utils/common";
import { postgreSqlText } from "Texts/postgreSql";

/**
 * @tjBlock  common
 * @tjUsage  selectQueryFromLandingPage('PostgreSQL', 'PostgreSQL')
 * @tjDom    <db>-add-query-card on the empty query-manager landing page
 */
export const selectQueryFromLandingPage = (dbName, label) => {
  cy.get(
    `[data-cy="${dbName.toLowerCase().replace(/\s+/g, "-")}-add-query-card"]`
  )
    .should("contain", label)
    .click();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  common
 * @tjUsage  deleteQuery('restapi1')
 * @tjDom    list-query-<name> → delete-query-<name> → component-inspector-delete-button
 */
export const deleteQuery = (queryName) => {
  cy.get(`[data-cy="list-query-${queryName}"]`).click();
  cy.get(`[data-cy="delete-query-${queryName}"]`).click();
  cy.get('[data-cy="component-inspector-delete-button"]').click();
};

/**
 * @tjBlock  common
 * @tjUsage  query('create')   // clicks query-create-button
 * @tjDom    query-<action>-button (create / preview / run …)
 */
export const query = (action) => {
  cy.get(`[data-cy="query-${action}-button"]`).click();
};

/**
 * @tjBlock  common
 * @tjUsage  changeQueryToggles('notification-on-success')
 * @tjDom    <option>-toggle-switch parent (query settings toggle)
 */
export const changeQueryToggles = (option) => {
  cy.get(`[data-cy="${option}-toggle-switch"]`).parent().click();
};

/**
 * @tjBlock  common
 * @tjUsage  renameQueryFromEditor('getUsers')
 * @tjDom    query-name-label breadcrumb → rename icon → query-rename-input
 */
export const renameQueryFromEditor = (name) => {
  cy.get('[data-cy="query-name-label"]').realHover();
  cy.get('[class="breadcrum-rename-query-icon"]').click();
  cy.get('[data-cy="query-rename-input"]').clear().type(`${name}{enter}`);
};

/**
 * @tjBlock  common
 * @tjUsage  addInputOnQueryField('url', 'https://api.example.com')
 * @tjDom    <field>-input-field CodeMirror in the query editor
 */
export const addInputOnQueryField = (field, data) => {
  cy.get(`[data-cy="${field}-input-field"]`)
    .click()
    .clearAndTypeOnCodeMirror(`{backSpace}`);
  cy.get(`[data-cy="${field}-input-field"]`).clearAndTypeOnCodeMirror(data);
};

/**
 * @tjBlock  common
 * @tjUsage  waitForQueryAction('run')
 * @tjDom    query-<action>-button — waits until it loses the button-loading class
 */
export const waitForQueryAction = (action) => {
  cy.get(`[data-cy="query-${action}-button"]`, { timeout: 20000 }).should(
    "not.have.class",
    "button-loading"
  );
};

// Create an event handler (popover EventManager flow) and set its action to
// "Run Query", picking the action from the `action-selection` RocketSelect.
//
// WHY THIS LIVES HERE (not via events.js `selectEvent`/`selectListboxOption`):
// `action-selection` is a Radix UI Select (frontend/.../shadcn/select.jsx:13
// → @radix-ui/react-select Trigger). Its Trigger opens the portalled
// `SelectContent` on a *pointer* gesture, not on a synthetic DOM click.
// A synthetic `.click({ force:true })` on that Trigger — when the EventManager
// auto-open (`open={true}` via autoOpenActionSelect, EventManager.jsx:579) has
// NOT kicked in for this render — does not reliably trigger Radix's pointerdown
// open handler. (events.js `selectListboxOption` was since changed to open via
// KEYBOARD {downarrow} for this same reason; this local helper predates that and
// is kept because it additionally gates on the trigger's data-state.) The portal never mounts, so
// `[role="option"]` is never found and the step times out (30s). This was
// intermittent: it passed whenever the auto-open had the listbox already
// showing (guard short-circuits the trigger click), and failed when it didn't.
//
// Fix: drive the Radix Select deterministically with cypress-real-events
// `.realClick()` (a native pointer event Radix responds to), and only when the
// listbox isn't already open from auto-open. Then pick the role=option.
/**
 * @tjType   events
 * @tjBlock  events
 * @tjUsage  selectRunQueryEvent('Query Success')
 * @tjDom    add-event-handler → event-trigger-option-<value> → action-selection Radix Select ("Run Query")
 */
export const selectRunQueryEvent = (
  event,
  addEventhandlerSelector = '[data-cy="add-event-handler"]',
  index = 0,
  eventIndex = 0
) => {
  // Event handlers save via POST `/events` (create) / PATCH `/events/:id`.
  cy.intercept(/\/events(\/|\?|$)/).as("chainEvents");

  // Add-new-handler popover (EventManager.jsx:1278/1290/1306). One click on the
  // trigger option both chooses the trigger and creates the handler.
  cy.get(addEventhandlerSelector).eq(index).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.contains(
    '[data-cy^="event-trigger-option-"]',
    new RegExp(`^${event}$`, "i")
  ).click();
  cy.wait("@chainEvents");

  // Creating a handler auto-opens its config popover-card (data-state="open").
  // Reopen it (force — open Radix popover sets body{pointer-events:none}) only
  // if it didn't auto-open.
  cy.get('[data-cy="event-handler-card"]')
    .eq(eventIndex)
    .then(($card) => {
      if ($card.attr("data-state") !== "open") {
        cy.wrap($card).click({ force: true });
      }
    });
  cy.get('[data-cy="popover-card"]').should("be.visible");

  // Open the action-selection Radix Select reliably.
  //
  // The previous flaky paths (events.js force-click; realClick) both failed
  // because (1) the action select is rendered inside the `popover-card` (a
  // Radix Popover) which scroll-locks `body { pointer-events:none }`, so a
  // pointer click — synthetic OR real — is swallowed; and (2) EventManager
  // controls the select's `open` prop via `autoOpenActionSelect`
  // (EventManager.jsx:579) — when that auto-open is active, clicking the
  // trigger calls onOpenChange(false) and *closes* an already-open listbox.
  //
  // Robust approach: focus the trigger and open via KEYBOARD (Radix Select
  // opens on Enter/Space/ArrowDown when focused — unaffected by the
  // body pointer-events lock), but ONLY if the listbox isn't already open
  // from the auto-open. Gate the keyboard open on the trigger's own
  // data-state so we never toggle a controlled-open select shut. Then assert
  // an option is present before picking.
  cy.get('[data-cy="action-selection"]')
    .find('button[role="combobox"]')
    .should("be.visible")
    .then(($trigger) => {
      if ($trigger.attr("data-state") !== "open") {
        cy.wrap($trigger).focus().type("{downarrow}", { force: true });
      }
    });
  cy.get('[role="option"]', { timeout: 15000 }).should("exist");
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*Run Query\\s*$`, "i"))
    .click({ force: true });
  // Changing actionId to run-query fires a PATCH /events; wait for it so the
  // query-selection-field has rendered before we type into it.
  cy.wait("@chainEvents");
};

/**
 * @tjBlock  events
 * @tjUsage  chainQuery('getUsers', 'refreshTable')
 * @tjDom    list-query-<name> → query-tab-settings → selectRunQueryEvent → query-selection-field combobox
 */
export const chainQuery = (currentQuery, trigger) => {
  cy.get(`[data-cy="list-query-${currentQuery}"]`).click();
  cy.wait(1000);
  cy.get('[data-cy="query-tab-settings"]').click();
  selectRunQueryEvent("Query Success");
  // query-selection-field is now a Rocket OptionCombobox whose InputGroup nests
  // more than one <input>, so the old `.find("input").type()` threw
  // "cy.type() can only be called on a single element" (2 elements). Type into
  // the first visible input, then pick the matching role=option.
  cy.get('[data-cy="query-selection-field"]').scrollIntoView().click();
  cy.get('[data-cy="query-selection-field"] input')
    .filter(":visible")
    .first()
    .clear({ force: true })
    .type(trigger, { force: true });
  cy.get('[role="option"]')
    .filter(":visible")
    .contains(new RegExp(`^\\s*${trigger}\\s*$`, "i"))
    .click({ force: true });
};

/**
 * @tjBlock  common
 * @tjUsage  addSuccessNotification('Saved!')
 * @tjDom    query-tab-settings → notification-on-success toggle → success-message-input-field
 */
export const addSuccessNotification = (notification) => {
  cy.get('[data-cy="query-tab-settings"]').click();
  cy.get("body").then(($body) => {
    if (!$body.find('[data-cy="success-message-input-field"]').is(":visible")) {
      changeQueryToggles("notification-on-success");
    }
  });
  cy.get('[data-cy="success-message-input-field"]').clearAndTypeOnCodeMirror(
    notification
  );
  cy.get('[data-cy="query-tab-setup"]').click();
  cy.wait(300);
};

/**
 * @tjBlock  common
 * @tjUsage  performQueryAction('q1', 'rename', 'q2') // action: rename | duplicate | delete
 * @tjDom    query-handler-menu-<name> context menu → rename/duplicate/delete action
 */
export const performQueryAction = (queryName, action, newName) => {
  cy.get(commonQuerySelectors.queryNameList(queryName))
    .should("be.visible")
    .trigger("mouseover");
  cy.get(`[data-cy="query-handler-menu-${queryName}"]`)
    .should("be.visible")
    .click();
  if (action === "rename") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(commonQuerySelectors.queryEditInputField)
      .clear()
      .type(`${newName}{enter}`);
  } else if (action === "duplicate") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
  } else if (action === "delete") {
    cy.get(commonQuerySelectors.queryActionButton(action)).click();
    cy.get(postgreSqlSelector.deleteModalMessage).verifyVisibleElement(
      "have.text",
      postgreSqlText.dialogueTextDelete
    );
    cy.get(postgreSqlSelector.deleteModalCancelButton).verifyVisibleElement(
      "have.text",
      postgreSqlText.cancel
    );
    cy.get(postgreSqlSelector.deleteModalConfirmButton)
      .verifyVisibleElement("have.text", postgreSqlText.yes)
      .click();
  }
};

// ── Query create / preview (moved from marketplace/datasources/dataSource.js;
//    these operate the query panel, not the datasource connection) ────────────

/**
 * @tjBlock  common
 * @tjUsage  verifypreview('json', 'success')  // type: json | raw
 * @tjDom    preview-tab-<type> → preview-<type>-data-container
 */
export const verifypreview = (type, data) => {
  cy.get(`[data-cy="preview-tab-${type}"]`).click();
  cy.get(`[data-cy="preview-${type}-data-container"]`).verifyVisibleElement(
    "contain.text",
    data,
    [{ timeout: 15000 }]
  );
};

/**
 * @tjBlock  common
 * @tjUsage  addQueryN('getUsers', 'SELECT * FROM users', 'postgresql')
 * @tjDom    <db>-add-query-card → query-rename-input; then apiAddQuery + reopen app (UI create, API body)
 */
export const addQueryN = (queryName, query, dbName) => {
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="gds-querymanager-search-bar"]').length > 0) {
      cy.clearAndType('[data-cy="gds-querymanager-search-bar"]', `${dbName}`);
    }
  });
  cy.intercept("POST", "/api/data-queries/**").as("createQuery");

  cy.get(`[data-cy="${dbName}-add-query-card"] > .text-truncate`).click();
  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);
  cy.forceClickOnCanvas();

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.apiAddQuery(queryName, query, dataQueryId);
    cy.openApp();
  });
};

/**
 * @tjBlock  common
 * @tjUsage  addQuery('getUsers', 'SELECT * FROM users', 'postgresql')
 * @tjDom    show-ds-popover-button → react-select ds option → query-rename-input; then apiAddQuery + reopen app
 */
export const addQuery = (queryName, query, dbName) => {
  cy.get('[data-cy="show-ds-popover-button"]').click();
  cy.get(".css-4e90k9").type(`${dbName}`);
  cy.intercept("POST", "/api/data-queries/**").as("createQuery");
  cy.contains(`[id*="react-select-"]`, dbName).click();

  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.apiAddQuery(queryName, query, dataQueryId);
    cy.openApp();
  });
};

/**
 * @tjBlock  common
 * @tjUsage  addDsAndAddQuery('getUsers', 'SELECT 1', 'postgresql')
 * @tjDom    show-ds-popover-button → ds option → query input CodeMirror → queryPreviewButton (fully UI-driven, no API)
 */
export const addDsAndAddQuery = (queryName, query, dbName) => {
  cy.get('[data-cy="show-ds-popover-button"]').click();
  cy.get(".css-4e90k9").type(`${dbName}`);
  cy.contains(`[id*="react-select-"]`, dbName).click();
  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);
  cy.get(postgreSqlSelector.queryInputField)
    .realMouseDown({ position: "center" })
    .realType(" ");
  cy.get(postgreSqlSelector.queryInputField).clearAndTypeOnCodeMirror(query);
  cy.wait(1000);
  cy.get(dataSourceSelector.queryPreviewButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    `Query (${queryName}) completed.`
  );
};

/**
 * @tjBlock  common
 * @tjUsage  addQueryAndOpenEditor('getUsers', 'SELECT 1', 'postgresql', 'MyApp')
 * @tjDom    show-ds-popover-button → ds option → query-rename-input; then apiAddQuery + navigateToAppEditor(appName)
 */
export const addQueryAndOpenEditor = (queryName, query, dbName, appName) => {
  cy.get('[data-cy="show-ds-popover-button"]').click();
  cy.get(".css-4e90k9").type(`${dbName}`);
  cy.get(".css-4e90k9").type(`${dbName}`);
  cy.intercept("POST", "/api/data-queries").as("createQuery");
  cy.contains(`[id*="react-select-"]`, dbName).click();

  cy.get('[data-cy="query-rename-input"]').clear().type(queryName);

  cy.wait("@createQuery").then((interception) => {
    const dataQueryId = interception.response.body.id;
    cy.visit("/my-workspace");
    cy.apiAddQuery(queryName, query, dataQueryId);
    navigateToAppEditor(appName);
    cy.wait(2000);
  });
};

/**
 * @tjBlock  common
 * @tjUsage  createDataQuery('MyApp', 'baseUrl', 'apiKey', 'token')
 * @tjDom    none (pure API) — POST /api/data-queries a REST query bound to {{constants.*}}
 */
export const createDataQuery = (appName, url, key, value) => {
  let appId, versionId;
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from apps where name='${appName}';`,
  }).then((resp) => {
    appId = resp.rows[0].id;

    cy.task("dbConnection", {
      dbconfig: Cypress.env("app_db"),
      sql: `select id from app_versions where app_id='${appId}';`,
    }).then((resp) => {
      versionId = resp.rows[0].id;

      cy.getCookie("tj_auth_token").then((cookie) => {
        const headers = {
          "Tj-Workspace-Id": Cypress.env("workspaceId"),
          Cookie: `tj_auth_token=${cookie.value}`,
        };

        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/data-queries`,
          headers: headers,
          body: {
            app_id: appId,
            app_version_id: versionId,
            name: "restapi1",
            kind: "restapi",
            options: {
              method: "get",
              url: `{{constants.${url}}}`,
              url_params: [["", ""]],
              headers: [[`{{constants.${key}}}`, `{{constants.${value}}}`]],
              body: [["", ""]],
              json_body: null,
              body_toggle: false,
              transformationLanguage: "javascript",
              enableTransformation: false,
            },
            data_source_id: null,
          },
        }).then((response) => {
          expect(response.status).to.equal(201);
        });
      });
    });
  });
};

/**
 * @tjBlock  common
 * @tjUsage  createRestAPIQuery('getData', 'restDs', '', '', 'https://api.example.com', true)
 * @tjDom    none (pure API) — POST a REST query against an existing data source; run = runOnPageLoad
 */
export const createRestAPIQuery = (
  queryName,
  dsName,
  key = "",
  value = "",
  url = "",
  run = true,
  kind = "restapi"
) => {
  cy.getCookie("tj_auth_token").then((cookie) => {
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };

    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps/${Cypress.env("appId")}`,
      headers: headers,
    }).then((response) => {
      const editingVersionId = response.body.editing_version.id;

      const data_source_id = Cypress.env(`${dsName}`);

      const requestBody = {
        app_id: Cypress.env("appId"),
        app_version_id: editingVersionId,
        name: queryName,
        kind: kind,
        options: {
          method: "get",
          url: url,
          url_params: [["", ""]],
          headers: [[`${key}`, `${value}`]],
          body: [["", ""]],
          json_body: null,
          body_toggle: false,
          runOnPageLoad: run,
          transformationLanguage: "javascript",
          enableTransformation: false,
        },
        data_source_id: data_source_id,
        plugin_id: null,
      };

      cy.request({
        method: "POST",
        url: `${Cypress.env(
          "server_host"
        )}/api/data-queries/data-sources/${data_source_id}/versions/${editingVersionId}`,
        headers: headers,
        body: requestBody,
      }).then((response) => {
        expect(response.status).to.equal(201);
        cy.log("Data query created successfully:", response.body);
      });
    });
  });
};

/**
 * @tjBlock  common
 * @tjUsage  verifyPreviewData('expected value')
 * @tjDom    query-preview-button → preview-json-data-container tree (expands first node, asserts contains)
 */
export const verifyPreviewData = (expectedData) => {
  cy.get('[data-cy="query-preview-button"]').click();
  cy.wait(2000);
  cy.get('[data-cy="preview-json-data-container"]>ul>li>ul>li>div').click();
  cy.get('[data-cy="preview-json-data-container"]')
    .should("be.visible")
    .and("contain", expectedData);
};
