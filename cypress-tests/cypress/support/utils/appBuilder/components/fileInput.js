/**
 * MODULE — appBuilder/components/fileInput: browser-only helpers for the File Input widget.
 * FOR AI: addFileInputsViaApi seeds fully-configured File Inputs (fileinput.js definition defaults merged) in one
 * components POST; interceptFileChooser keeps a native OS file dialog from ever opening in automation (CDP
 * Page.setInterceptFileChooserDialog); trackFileInputActivation records every activation of the widget's hidden
 * <input type="file"> — whether the browser had transient user activation (the precondition for showing a
 * native picker) and whether anything cancelled the default action.
 */
import { fileInputText } from "Texts/appBuilder/components/fileInput";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addFileInputsViaApi([{ name: 'fileinput1', layout: { top: 40, left: 2, width: 10, height: 60 }, properties: { disabledState: { value: '{{true}}' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components.
 *           An item without `type` is a FileInput and gets fileinput.js definition defaults under every bucket;
 *           any other `type` posts only what is passed.
 */
export const addFileInputsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = {
      "Content-Type": "application/json",
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      const D = fileInputText.definition;
      const diff = {};
      items.forEach((item) => {
        const isFileInput = !item.type || item.type === "FileInput";
        const layout = {
          top: 40,
          left: 2,
          width: fileInputText.defaultSize.width,
          height: isFileInput ? fileInputText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || "FileInput",
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isFileInput ? merge(D.properties, item.properties) : item.properties || {},
          styles: isFileInput ? merge(D.styles, item.styles) : item.styles || {},
          others: isFileInput ? merge(D.others, item.others) : item.others || {},
          validation: isFileInput ? merge(D.validation, item.validation) : item.validation || {},
        };
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
    });
  });

const cdp = (command, params = {}) => Cypress.automation("remote:debugger:protocol", { command, params });
export const fileInputCdp = cdp;

/**
 * @tjBlock  userflow
 * @tjUsage  interceptFileChooser()   // before the first click that could reach a file input
 * @tjDom    CDP Page.enable + Page.setInterceptFileChooserDialog({ enabled: true }) on the browser tab: the browser
 *           reports a file-chooser request over the protocol instead of drawing the OS dialog, so automation never
 *           blocks on a native window. Survives AUT navigations (it is set on the tab, not the document).
 */
export const interceptFileChooser = () =>
  cy.then(() => cdp("Page.enable").then(() => cdp("Page.setInterceptFileChooserDialog", { enabled: true })));

/**
 * @tjBlock  userflow
 * @tjUsage  trackFileInputActivation('[data-cy="fileinput1-input-field"]'); cy.get(browse).realClick(); fileInputActivations('[data-cy="fileinput1-input-field"]').should((a) => expect(a).to.have.length(1))
 * @tjDom    a click listener on the hidden <input type="file"> itself (target phase — react-dropzone's input onClick
 *           stops propagation, so nothing above the input sees it). Each activation records the browser's transient
 *           user activation at that instant (navigator.userActivation.isActive — Chromium shows a file chooser only
 *           with it), the input's type/disabled/connected state, and keeps the event so `prevented` is read after
 *           dispatch finished (whether any handler cancelled the default action that opens the chooser).
 */
export const trackFileInputActivation = (inputSelector) =>
  cy.get(inputSelector).then(($input) => {
    const input = $input[0];
    const win = input.ownerDocument.defaultView;
    win.__fileInputActivations = win.__fileInputActivations || {};
    const log = (win.__fileInputActivations[inputSelector] = []);
    input.addEventListener("click", (e) => {
      log.push({
        event: e,
        type: input.type,
        disabled: input.disabled,
        connected: input.isConnected,
        userActivation: !!(win.navigator.userActivation && win.navigator.userActivation.isActive),
      });
    });
  });

export const fileInputActivations = (inputSelector) =>
  cy.get(inputSelector).then(($input) => {
    const win = $input[0].ownerDocument.defaultView;
    const log = (win.__fileInputActivations && win.__fileInputActivations[inputSelector]) || [];
    return log.map(({ event, ...rest }) => ({ ...rest, trusted: event.isTrusted, prevented: event.defaultPrevented }));
  });
