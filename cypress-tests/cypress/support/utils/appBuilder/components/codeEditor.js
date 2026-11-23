/**
 * MODULE — appBuilder/components/codeEditor: browser-only helpers for the Code Editor widget (CodeMirror 6).
 * FOR AI: addCodeEditorsViaApi seeds Code Editors (codeEditor.js definition defaults merged) plus helper widgets in
 * one components POST; pasteCode puts a whole document into the editor through CodeMirror's own paste path (the
 * widget has no default-value property, so content can only be typed, pasted or set by the setValue CSA);
 * editorMetrics reads the real layout + scroll state of the editor box, scroller, gutter, visible lines and line
 * numbers; tokenColor / contrastRatio read the painted syntax colours and compare them WCAG-style.
 */
import { codeEditorText } from "Texts/appBuilder/components/codeEditor";
import { codeEditorSelector } from "Selectors/appBuilder/components/codeEditor";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addCodeEditorsViaApi([{ name: 'codeeditor1', layout: { top: 40, left: 2, width: 12, height: 120 }, properties: { mode: { value: 'sql' } } }, { type: 'Text', name: 'text1', layout: {…}, properties: { text: { value: 'A' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page; sets Cypress.env('editingVersionId') for
 *           apiUpdateGlobalSettings) → POST /api/v2/apps/<appId>/versions/<v>/components. An item without `type`
 *           is a CodeEditor and gets codeEditor.js definition defaults under properties/styles/others; any other
 *           `type` posts only what is passed (the app loader fills the rest).
 */
export const addCodeEditorsViaApi = (items, appIdArg) =>
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
      const D = codeEditorText.definition;
      const diff = {};
      items.forEach((item) => {
        const isEditor = !item.type || item.type === "CodeEditor";
        const layout = {
          top: 40,
          left: 2,
          width: codeEditorText.defaultSize.width,
          height: isEditor ? codeEditorText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || "CodeEditor",
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
 * @tjBlock  userflow
 * @tjUsage  pasteCode('codeeditor1', 'const a = 1\nconst b = 2')
 * @tjDom    focuses the widget's `.cm-content`, selects all, and dispatches a paste ClipboardEvent carrying the text
 *           (CodeMirror 6 replaces the selection with clipboardData — a real user edit, so onChange fires). Asserts
 *           the last line landed (the caret ends there). Use for large documents; type short input with cy.realType.
 */
export const pasteCode = (name, text) => {
  cy.get(codeEditorSelector.content(name))
    .first()
    .click({ scrollBehavior: false })
    .type("{selectall}", { scrollBehavior: false })
    .then(($content) => {
      const win = $content[0].ownerDocument.defaultView;
      const data = new win.DataTransfer();
      data.setData("text/plain", text);
      $content[0].dispatchEvent(new win.ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
  // the caret ends on the last line and CodeMirror scrolls it into view (long documents render only a window of lines)
  const lastLine = text.split("\n").pop();
  cy.get(codeEditorSelector.line(name)).should(($lines) =>
    expect($lines.toArray().map((l) => l.textContent), "pasted document's last line rendered").to.include(lastLine)
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  editorMetrics('codeeditor1', (m) => expect(m.scroller.scrollTop).to.be.gt(0))
 * @tjDom    retries the callback with plain rects/numbers: widget (grid box), box (`.code-editor-widget` + its scroll
 *           sizes), scroller (`.cm-scroller` rect, scrollTop/Left, scroll/client sizes, overscroll-behavior-x),
 *           gutter (`.cm-gutters` rect + background), lines (visible `.cm-line` text + rect) and numbers (visible
 *           line-number elements: text, rect, scroll/client width)
 */
export const editorMetrics = (name, assertFn) =>
  cy.get(codeEditorSelector.scroller(name), { timeout: 30000 }).first().should(($sc) => {
    const sc = $sc[0];
    const doc = sc.ownerDocument;
    const win = doc.defaultView;
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height };
    };
    const widget = doc.querySelector(codeEditorSelector.draggableWidget(name));
    const box = widget.querySelector(".code-editor-widget");
    const gutter = widget.querySelector(".cm-gutters");
    assertFn({
      widget: rect(widget),
      box: { ...rect(box), scrollHeight: box.scrollHeight, clientHeight: box.clientHeight, scrollTop: box.scrollTop },
      scroller: {
        ...rect(sc),
        scrollTop: sc.scrollTop,
        scrollLeft: sc.scrollLeft,
        scrollHeight: sc.scrollHeight,
        clientHeight: sc.clientHeight,
        scrollWidth: sc.scrollWidth,
        clientWidth: sc.clientWidth,
        overscrollX: win.getComputedStyle(sc).overscrollBehaviorX,
      },
      gutter: gutter ? { ...rect(gutter), background: win.getComputedStyle(gutter).backgroundColor } : null,
      lines: Array.from(widget.querySelectorAll(".cm-line")).map((l) => ({ text: l.textContent, ...rect(l) })),
      numbers: Array.from(widget.querySelectorAll(".cm-lineNumbers .cm-gutterElement"))
        .filter((e) => e.textContent && e.getBoundingClientRect().height > 0)
        .map((e) => ({ text: e.textContent, scrollWidth: e.scrollWidth, clientWidth: e.clientWidth, ...rect(e) })),
    });
  });

/**
 * @tjBlock  styles
 * @tjUsage  tokenColors('codeeditor1').then((c) => expect(c.const).to.not.eq(c.base))
 * @tjDom    yields { <word>: painted colour of the innermost highlighted span whose trimmed text is that word,
 *           base: `.cm-content` text colour, background: `.cm-content` background, gutterBackground,
 *           lineNumber: first line-number colour, language: `.cm-content[data-language]` } — plain strings
 */
export const tokenColors = (name) =>
  cy.get(codeEditorSelector.content(name)).first().then(($c) => {
    const content = $c[0];
    const win = content.ownerDocument.defaultView;
    const widget = content.closest('[data-cy^="draggable-widget-"]');
    const out = {
      base: win.getComputedStyle(content).color,
      background: win.getComputedStyle(content).backgroundColor,
      gutterBackground: win.getComputedStyle(widget.querySelector(".cm-gutters")).backgroundColor,
      lineNumber: win.getComputedStyle(widget.querySelector(".cm-lineNumbers .cm-gutterElement:not(:empty)") || widget.querySelector(".cm-gutters")).color,
      language: content.getAttribute("data-language"),
    };
    content.querySelectorAll(".cm-line span").forEach((s) => {
      if (s.querySelector("span")) return; // innermost only
      const word = s.textContent.trim();
      if (word && !(word in out)) out[word] = win.getComputedStyle(s).color;
    });
    // a word left unwrapped by the highlighter (a bare text node of the line) paints in the base colour
    content.querySelectorAll(".cm-line").forEach((l) =>
      Array.from(l.childNodes)
        .filter((n) => n.nodeType === 3)
        .forEach((n) =>
          n.textContent.split(/\s+/).forEach((w) => {
            if (w && !(w in out)) out[w] = out.base;
          })
        )
    );
    return out;
  });

const channels = (css) => {
  const m = css.match(/rgba?\(([^)]+)\)/);
  expect(m, `parsable colour ${css}`).to.not.eq(null);
  return m[1].split(",").map((v) => parseFloat(v));
};

/** WCAG 2.x relative luminance of an `rgb()/rgba()` string. */
export const relativeLuminance = (css) => {
  const [r, g, b] = channels(css).slice(0, 3).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** alpha channel of an `rgb()/rgba()` string (1 for rgb). */
export const alphaOf = (css) => {
  const c = channels(css);
  return c.length > 3 ? c[3] : 1;
};

/**
 * @tjBlock  styles
 * @tjUsage  expect(contrastRatio('rgb(36, 41, 46)', 'rgb(255, 255, 255)')).to.be.gte(4.5)
 * @tjDom    pure: WCAG contrast ratio (L1 + 0.05) / (L2 + 0.05) of two opaque colours
 */
export const contrastRatio = (fg, bg) => {
  const [a, b] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};
