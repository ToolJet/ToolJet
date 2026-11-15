/**
 * MODULE — appBuilder/components/richTextEditor: browser-only helpers for the Text Editor widget (RichTextEditor, draft-js).
 * FOR AI: addRichTextEditorsViaApi seeds Text Editors (richtextarea.js definition defaults merged) plus helper widgets in
 * one components POST; valueProbe builds a plain-text Text widget that shows JSON.stringify(<editor>.value) so the
 * exposed HTML can be compared exactly; selectAllInEditor selects the whole document through the DOM selection draft-js
 * reads on `select`; applyHeading / clickToolbarIcon drive the real toolbar (mousedown handlers, DraftEditor.jsx:46);
 * rteMetrics reads the real geometry of the widget, wrapper, root, editor area and content.
 */
import { richTextEditorText } from "Texts/appBuilder/components/richTextEditor";
import { richTextEditorSelector } from "Selectors/appBuilder/components/richTextEditor";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addRichTextEditorsViaApi([{ name: 'richtexteditor1', layout: { top: 40, left: 2, width: 16, height: 210 }, properties: { dynamicHeight: { value: '{{true}}' } } }, valueProbe('text1', 'richtexteditor1', { top: 300, left: 2 })])
 * @tjDom    GET /api/apps/<appId> (editing version + home page; sets Cypress.env('editingVersionId')) → POST
 *           /api/v2/apps/<appId>/versions/<v>/components. An item without `type` is a RichTextEditor and gets
 *           richtextarea.js definition defaults under properties/styles/others; any other `type` posts only what is
 *           passed (the app loader fills the rest).
 */
export const addRichTextEditorsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = {
      "Content-Type": "application/json",
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const D = richTextEditorText.definition;
      const diff = {};
      items.forEach((item) => {
        const isEditor = !item.type || item.type === "RichTextEditor";
        const layout = {
          top: 40,
          left: 2,
          width: richTextEditorText.defaultSize.width,
          height: isEditor ? richTextEditorText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || "RichTextEditor",
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isEditor ? merge(D.properties, item.properties) : item.properties || {},
          styles: isEditor ? merge(D.styles, item.styles) : item.styles || {},
          others: isEditor ? merge(D.others, item.others) : item.others || {},
          validation: {},
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

/**
 * @tjBlock  contexts
 * @tjUsage  valueProbe('text1', 'richtexteditor1', { top: 300, left: 2 })
 * @tjDom    item for addRichTextEditorsViaApi: a PLAIN-TEXT Text widget (the Text definition default is html,
 *           text.js:303, which would render the editor's HTML) showing JSON.stringify(components.<editor>.value)
 */
export const valueProbe = (name, editor, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 10, left: 20, width: 20, height: 40, ...layout },
  properties: {
    text: { value: `{{JSON.stringify(components.${editor}.value)}}` },
    textFormat: { value: "plainText" },
  },
});

/**
 * @tjBlock  userflow
 * @tjUsage  focusEditor('richtexteditor1'); cy.realType('abc')
 * @tjDom    real click on the editor's contentEditable (draft-js `.public-DraftEditor-content`), then asserts it
 *           owns keyboard focus
 */
export const focusEditor = (name) => {
  cy.get(richTextEditorSelector.content(name)).realClick({ scrollBehavior: false });
  cy.document().should((doc) =>
    expect(doc.activeElement && doc.activeElement.matches(".public-DraftEditor-content"), "editor focused").to.eq(true)
  );
};

/**
 * @tjBlock  userflow
 * @tjUsage  selectAllInEditor('richtexteditor1')
 * @tjDom    selects the whole contentEditable with a DOM Range and resolves only after the browser's async
 *           `selectionchange` (React turns it into the editor's onSelect, so draft-js adopts the selection) plus a frame —
 *           a toolbar press issued earlier would act on the previous, collapsed selection. Asserts the selected text.
 */
export const selectAllInEditor = (name) =>
  cy.get(richTextEditorSelector.content(name)).then(($c) => {
    const content = $c[0];
    const doc = content.ownerDocument;
    const win = doc.defaultView;
    content.focus();
    const adopted = new Cypress.Promise((resolve) => {
      doc.addEventListener("selectionchange", () => setTimeout(resolve, 100), { once: true });
      setTimeout(resolve, 1000); // the selection may already be the whole document (no change event)
    });
    const range = doc.createRange();
    range.selectNodeContents(content);
    const sel = win.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const squash = (t) => t.replace(/\s+/g, "");
    expect(squash(sel.toString()), "selection covers the document").to.eq(squash(content.textContent));
    return adopted;
  });

/**
 * @tjBlock  userflow
 * @tjUsage  pasteIntoEditor('richtexteditor1', 'line 1\nline 2')
 * @tjDom    focuses the contentEditable, selects everything and dispatches a paste ClipboardEvent carrying text/plain —
 *           draft-js's own paste path (editOnPaste) replaces the selection with one block per line and publishes the
 *           new value through onChange (a real user edit). Asserts the block count.
 */
export const pasteIntoEditor = (name, text) => {
  focusEditor(name);
  selectAllInEditor(name);
  cy.get(richTextEditorSelector.content(name)).then(($c) => {
    const win = $c[0].ownerDocument.defaultView;
    const data = new win.DataTransfer();
    data.setData("text/plain", text);
    $c[0].dispatchEvent(new win.ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
  });
  cy.get(richTextEditorSelector.block(name)).should("have.length", text.split("\n").length);
};

/**
 * @tjBlock  userflow
 * @tjUsage  applyHeading('richtexteditor1', 'H2')
 * @tjDom    hovers the toolbar `.dropmenu` (CSS :hover opens `.dropdown-content`, theme.scss:2485-2494) and presses the
 *           H<n> item (StyleButton toggles on mousedown, DraftEditor.jsx:46)
 */
export const applyHeading = (name, label) => {
  cy.get(richTextEditorSelector.headingButton(name)).realHover({ scrollBehavior: false });
  cy.get(richTextEditorSelector.headingList(name)).should("be.visible");
  cy.get(richTextEditorSelector.headingList(name))
    .contains(".RichEditor-styleButton", new RegExp(`^${label}$`))
    .realClick({ scrollBehavior: false });
};

/**
 * @tjBlock  userflow
 * @tjUsage  clickToolbarIcon('richtexteditor1', 'bold')
 * @tjDom    real mousedown/up on the icon-only StyleButton whose <img> is `<icon>.svg` (DraftEditor.jsx:64-131)
 */
export const clickToolbarIcon = (name, icon) =>
  cy.get(richTextEditorSelector.iconButton(name, icon)).realClick({ scrollBehavior: false });

/**
 * @tjBlock  userflow
 * @tjUsage  toolbarState('richtexteditor1').then((s) => expect(s.active).to.deep.eq(['bold']))
 * @tjDom    yields { active: icon file names / heading labels of `.RichEditor-activeButton` buttons }
 */
export const toolbarState = (name) =>
  cy.get(richTextEditorSelector.controls(name)).then(($c) => ({
    active: $c
      .find(".RichEditor-activeButton")
      .toArray()
      .map((b) => {
        const img = b.querySelector("img");
        return img ? img.getAttribute("src").split("/").pop().replace(".svg", "") : b.textContent.trim();
      }),
  }));

/**
 * @tjBlock  canvas
 * @tjUsage  rteMetrics('richtexteditor1', (m) => expect(m.widget.height).to.be.gt(210))
 * @tjDom    retries the callback with plain rects/numbers: widget (grid box), wrapper (`[data-cy=<name>]`), root
 *           (`.RichEditor-root` + scroll sizes), controls, editor (`.RichEditor-editor` + inline height) and content
 *           (`.public-DraftEditor-content` rect + scroll sizes + block count — the content, overflow-y scroll in
 *           theme.scss:2408-2412, is what scrolls when the editor area is fixed)
 */
export const rteMetrics = (name, assertFn) =>
  cy.get(richTextEditorSelector.draggableWidget(name), { timeout: 30000 }).first().should(($w) => {
    const w = $w[0];
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const root = w.querySelector(".RichEditor-root");
    const editor = w.querySelector(".RichEditor-editor");
    const content = w.querySelector(".public-DraftEditor-content");
    assertFn({
      widget: rect(w),
      wrapper: rect(w.querySelector(`[data-cy="${name}"]`)),
      root: root ? { ...rect(root), scrollHeight: root.scrollHeight, clientHeight: root.clientHeight } : null,
      controls: rect(w.querySelector(".RichEditor-controls")),
      editor: editor ? { ...rect(editor), inlineHeight: editor.style.height } : null,
      content: content
        ? {
            ...rect(content),
            scrollHeight: content.scrollHeight,
            clientHeight: content.clientHeight,
            blocks: content.querySelectorAll('[data-block="true"]').length,
          }
        : null,
    });
  });
