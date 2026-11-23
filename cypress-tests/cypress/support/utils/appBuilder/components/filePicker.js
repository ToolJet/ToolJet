/**
 * MODULE — appBuilder/components/filePicker: browser-only helpers for the File Picker widget.
 * FOR AI: addFilePickersViaApi seeds fully-configured File Pickers (filepicker.js definition defaults merged) plus
 * helper widgets in one components POST (+ event handlers); pickerFiles builds in-memory files for cy.selectFile;
 * dropFiles performs a real HTML5 drag-and-drop onto the dropzone (cy.selectFile action 'drag-drop' → dragenter /
 * dragover / drop with a DataTransfer); dragFilesOver / dragLeave hold a drag over the dropzone without dropping so
 * the drag-state affordance can be read; pickerMetrics reads the real geometry and scroll / scrollbar state.
 */
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addFilePickersViaApi([{ name: 'filepicker1', layout: { top: 40, left: 2, width: 15, height: 220 }, properties: { dynamicHeight: { value: '{{true}}' } }, validation: { maxFileCount: { value: '{{10}}' } }, events: [counterEvent('onFileSelected', 'selected')] }, { type: 'Text', name: 'below', layout: {…}, properties: { text: { value: 'x' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           → POST .../events per handler. An item without `type` is a FilePicker and gets filepicker.js definition
 *           defaults under every bucket; any other `type` posts only what is passed. Event items are merged over
 *           { actionId: 'show-alert', alertType: 'info' }.
 */
export const addFilePickersViaApi = (items, appIdArg) =>
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
      const D = filePickerText.definition;
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = crypto.randomUUID();
        const isPicker = !item.type || item.type === filePickerText.componentType;
        const layout = {
          top: 40,
          left: 2,
          width: filePickerText.defaultSize.width,
          height: isPicker ? filePickerText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[id] = {
          name: item.name,
          type: item.type || filePickerText.componentType,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isPicker ? merge(D.properties, item.properties) : item.properties || {},
          styles: isPicker ? merge(D.styles, item.styles) : item.styles || {},
          others: isPicker ? merge(D.others, item.others) : item.others || {},
          validation: isPicker ? merge(D.validation, item.validation) : item.validation || {},
        };
        (item.events || []).forEach((e, index) =>
          events.push({
            name: e.eventId, // event_handlers.name is NOT NULL
            event: { actionId: "show-alert", alertType: "info", ...e },
            eventType: "component",
            attachedTo: id,
            index,
          })
        );
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
      events.forEach((body) =>
        cy
          .request({
            method: "POST",
            url: `${api}/v2/apps/${appId}/versions/${versionId}/events`,
            headers,
            body,
            failOnStatusCode: false,
          })
          .then((r) => expect(r.status, `create event: ${JSON.stringify(r.body)}`).to.be.oneOf([200, 201]))
      );
    });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  dropFiles('filepicker1', pickerFiles(3, 'shot'))            // hover, then drop (a user's timing)
 *           dropFiles('filepicker1', files, { hover: false })            // one-shot cy.selectFile drag-drop
 * @tjDom    the dropzone root (UploadArea.jsx:54, no data-cy). Default: native dragenter + dragover with a DataTransfer
 *           of the files, wait until react-dropzone shows the drag state (`is-dragging`), then a native `drop` with the
 *           same files — the HTML5 drag path react-dropzone listens to, not the hidden <input>'s change event.
 *           `hover: false` → cy.selectFile(files, { action: 'drag-drop' }), which fires dragenter/dragover/drop in ONE
 *           tick: react-dropzone's async dragenter file read then resolves after the drop's reset and leaves the zone
 *           stuck in `is-dragging` (a synthetic-timing artifact a human drag cannot produce) — use it only where no
 *           drag state appears (drop zone off) or the post-drop state is not asserted.
 */
export const dropFiles = (name, files, { hover = true } = {}) => {
  if (!hover) {
    return cy.get(filePickerSelector.dropzone(name)).selectFile(files, { action: "drag-drop", force: true });
  }
  dragFilesOver(name, files);
  cy.get(filePickerSelector.dropzone(name)).should("have.class", "is-dragging");
  return fireDrag(name, "drop", files);
};

/**
 * @tjBlock  userflow
 * @tjUsage  pickerFiles(3, 'shot')  → [{ contents, fileName: 'shot-1.png', mimeType: 'image/png', lastModified }, …]
 * @tjDom    pure: in-memory files for cy.selectFile, each `bytes` long (default 120 — above the 50-byte minSize
 *           default, filepicker.js:406) with a distinct name so useFilePicker's duplicate check (name+size+mtime)
 *           never collapses them
 */
export const pickerFiles = (count, prefix = "file", { ext = "png", mimeType = "image/png", bytes = 120 } = {}) =>
  Array.from({ length: count }, (_, i) => ({
    contents: Cypress.Buffer.alloc(bytes, i + 1),
    fileName: `${prefix}-${i + 1}.${ext}`,
    mimeType,
    lastModified: 1700000000000 + i,
  }));

const fireDrag = (name, type, files) =>
  cy.get(filePickerSelector.dropzone(name)).then(($dz) => {
    const win = $dz[0].ownerDocument.defaultView;
    const dt = new win.DataTransfer();
    files.forEach((f) => dt.items.add(new win.File([f.contents], f.fileName, { type: f.mimeType })));
    $dz[0].dispatchEvent(new win.DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt }));
  });

/**
 * @tjBlock  userflow
 * @tjUsage  dragFilesOver('filepicker1', pickerFiles(1, 'a'))
 * @tjDom    native DragEvent('dragenter') + ('dragover') on the dropzone with a DataTransfer of the files, no drop —
 *           react-dropzone flips isDragActive / isDragAccept / isDragReject from the dragged items' types
 */
export const dragFilesOver = (name, files) => {
  fireDrag(name, "dragenter", files);
  fireDrag(name, "dragover", files);
};

/**
 * @tjBlock  userflow
 * @tjUsage  dragLeave('filepicker1')
 * @tjDom    native DragEvent('dragleave') on the dropzone — the pointer left without dropping
 */
export const dragLeave = (name) => fireDrag(name, "dragleave", []);

const measure = (doc, name) => {
  const box = doc.querySelector(filePickerSelector.draggableWidget(name));
  const wrapper = doc.querySelector(filePickerSelector.widget(name));
  const dz = doc.querySelector(filePickerSelector.dropzone(name));
  const pane = doc.querySelector(filePickerSelector.filesPane(name));
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width };
  };
  const cs = wrapper ? doc.defaultView.getComputedStyle(wrapper) : null;
  return {
    box: rect(box),
    wrapper: rect(wrapper),
    dropzone: rect(dz),
    pane: rect(pane),
    rows: doc.querySelectorAll(filePickerSelector.fileRow(name)).length,
    scrollTop: wrapper ? wrapper.scrollTop : 0,
    scrollHeight: wrapper ? wrapper.scrollHeight : 0,
    clientHeight: wrapper ? wrapper.clientHeight : 0,
    overflowY: cs ? cs.overflowY : null,
    scrollbarColor: cs ? cs.scrollbarColor : null,
    scrollbarWidth: cs ? cs.scrollbarWidth : null,
    isHovered: wrapper ? wrapper.matches(":hover") : false,
    dropzoneClass: dz ? dz.className : "",
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  pickerMetrics('filepicker1', (m) => expect(m.box.height).to.be.closeTo(220, 2))
 * @tjDom    retries the callback with rects of the RenderWidget box (`draggable-widget-<name>`), the widget root
 *           (`.file-picker-widget-wrapper.files-pane-scrollable`, FilePicker.jsx:212-216), dropzone, files pane; the
 *           root's scroll state + computed overflow-y / scrollbar-color / scrollbar-width, :hover, file-row count
 */
export const pickerMetrics = (name, assertFn) =>
  cy.get(filePickerSelector.draggableWidget(name), { timeout: 30000 }).should(($w) => assertFn(measure($w[0].ownerDocument, name)));

/** Yields the metrics once (no retry) — for before/after comparisons. Plain object. */
export const readPickerMetrics = (name) =>
  cy.get(filePickerSelector.draggableWidget(name), { timeout: 30000 }).then(($w) => measure($w[0].ownerDocument, name));

/**
 * @tjBlock  canvas
 * @tjUsage  removeFileRow('filepicker1', 0)
 * @tjDom    the row's trash button (FileListItem.jsx:37-48) is opacity 0 / visibility hidden until the row is hovered
 *           (style.scss .file-list-item:hover) — real hover first, then a real click
 */
export const removeFileRow = (name, index) => {
  cy.get(filePickerSelector.fileRow(name)).eq(index).realHover({ scrollBehavior: false });
  cy.get(filePickerSelector.fileRow(name)).eq(index).find(".delete-button").should("be.visible").realClick({ scrollBehavior: false });
};
