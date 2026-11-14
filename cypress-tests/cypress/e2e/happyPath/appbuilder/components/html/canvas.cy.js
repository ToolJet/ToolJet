/**
 * SPEC — HTML Viewer — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   Html-BRW-001 — dynamic height follows the real authored-content geometry in a viewed app (grows past and
 *                  shrinks back to the configured height, no clipping, no inner scrollbar, siblings reflow)
 *   Html-BRW-002 — collapse-when-hidden reclaims the widget's space in the viewer; showing restores it
 *   Html-BRW-004 — fixed-height overflow scrolls; the viewer hides the scrollbar until hover (the editor does
 *                  not); dynamic height never scrolls; inside a Flex Container the canvas owns the scrollbar colour
 * Dynamic height and collapse only run in view mode (Html.jsx:41, RenderWidget), so those apps are seeded through
 * the components API (addHtmlWidgetsViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, resolveCssVarColor, addHtmlWidgetsViaApi, htmlMetrics.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { htmlSelector } from "Selectors/appBuilder/components/html";
import { htmlText } from "Texts/appBuilder/components/html";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { addHtmlWidgetsViaApi, htmlMetrics } from "Support/utils/appBuilder/components/html";

const W = htmlText.defaultWidgetName;
const T = htmlText;
const S = htmlText.scroll;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
const authoredRect = (name, id) => {
    const el = Cypress.$(htmlSelector.authored(name, id))[0];
    expect(el, `authored #${id} in ${name}`).to.exist;
    return el.getBoundingClientRect();
};
const textInput = htmlSelector.textInput('textinput1');

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('HTML Viewer — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Html-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the definition rawHtml renders its hero section. source: html.js:132-133
            cy.get(htmlSelector.content(W)).should('contain.text', T.heroText);
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: html.js:8
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                nudgeWidget(W, 'ArrowRight', 12);
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 900, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'banner'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Html-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Html-BRW-001 ─────────────────────────────────────────────────────
        // Html.jsx:41 dynamic height only when properties.dynamicHeight && currentMode === 'view'; the scroller
        // switches to height:auto + minHeight: height (Html.jsx:193-194) and useHeightObserver/useDynamicHeight
        // resize the grid box. The authored block's height is bound to textinput1, so typing grows the content.
        it('[Html-BRW-001] Dynamic height follows the authored content: grows past, and shrinks back to, the configured height', () => {
            const configured = 200; // dynamic: authored widget height (px)
            const tall = 600; // dynamic: authored block height that overflows the configured box
            const medium = 150; // dynamic: a block that still overflows a little
            // authored geometry: a bordered block with vertical margins, then a paragraph with a bottom margin
            const rawHtml = `{{'<div id="authored-block" style="height:' + (Number(components.textinput1.value) || 10) + 'px;margin:12px 0 18px;border:2px solid #333"></div><p id="authored-tail" style="margin:0 0 14px">${fake.firstName.replace(/\W/g, '')}</p>'}}`;
            addHtmlWidgetsViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 25, width: 8, height: 40 } },
                {
                    name: 'html1',
                    layout: { top: 100, left: 2, width: 10, height: configured },
                    properties: { dynamicHeight: { value: '{{true}}' }, rawHtml: { value: rawHtml } },
                },
                { type: 'Text', name: 'text1', layout: { top: 100 + configured + GAP, left: 2, width: 10, height: 40 }, properties: { text: { value: 'A' } } },
            ]);
            openLinkAppInViewer(htmlSelector.authored('html1', 'authored-tail'));

            // nothing clipped, no inner scrollbar: the tail paragraph and its 14px margin sit inside the scroller
            const expectFitsContent = () =>
                htmlMetrics('html1', (m) => {
                    expect(m.overflowY, 'dynamic height never scrolls').to.eq(S.dynamicOverflowY); // source: html.scss:8
                    expect(m.scrollHeight, 'no inner vertical scroll').to.be.lte(m.clientHeight + 1);
                    const tail = authoredRect('html1', 'authored-tail');
                    expect(m.container.bottom - tail.bottom, 'tail + its bottom margin not clipped').to.be.gte(14 - 1);
                    expect(box('text1').top - box('html1').bottom, 'text1 keeps its gap').to.be.closeTo(GAP, PX);
                });

            // short content: the widget stays at (at least) its configured height
            expectFitsContent();
            cy.document().should(() => expect(box('html1').height, 'configured height').to.be.closeTo(configured, PX));

            // growth: the widget follows the content well past the configured height
            cy.get(textInput).type(String(tall));
            cy.document().should(() =>
                expect(authoredRect('html1', 'authored-block').height, 'authored block grew').to.be.closeTo(tall, PX)); // border-box
            expectFitsContent();
            cy.document().should(() => {
                // block + its margins + tail paragraph all inside the box
                expect(box('html1').height, 'grew with the content').to.be.gt(tall + 12 + 18 + 14);
                expect(box('html1').bottom - authoredRect('html1', 'authored-tail').bottom, 'box hugs the content').to.be.lt(14 + 8);
            });

            // shrink to a block that still overflows a little, then to the short one: back to the configured floor
            cy.get(textInput).clear().type(String(medium));
            expectFitsContent();
            cy.document().should(() => {
                expect(box('html1').height, 'shrank with the content').to.be.lt(tall);
                expect(box('html1').height, 'still above configured').to.be.gt(configured);
            });
            cy.get(textInput).clear();
            expectFitsContent();
            cy.document().should(() => expect(box('html1').height, 'back to configured height').to.be.closeTo(configured, PX));
        });

        // ── Html-BRW-002 ─────────────────────────────────────────────────────
        // RenderWidget schedules a reflow when visibility flips in view mode and properties.collapseWhenHidden
        // (html.js:38-43) is on; Html.jsx:189 hides the scroller (display:none). Lane A collapses, lane B
        // (collapse off — the html.js:137 default) is the control.
        it('[Html-BRW-002] Collapse when hidden reclaims the space in the running app; showing restores it', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to hide both widgets
            const visibility = { value: `{{components.textinput1.value !== "${hideWord}"}}` };
            const height = 120; // dynamic: authored widget height
            addHtmlWidgetsViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 30, width: 10, height: 40 } },
                {
                    name: 'html1',
                    layout: { top: 100, left: 2, width: 10, height },
                    properties: { visibility, collapseWhenHidden: { value: '{{true}}' }, rawHtml: { value: '<p id="authored-a">A</p>' } },
                },
                { type: 'Text', name: 'text1', layout: { top: 100 + height + GAP, left: 2, width: 10, height: 40 }, properties: { text: { value: 'A' } } },
                {
                    name: 'html2',
                    layout: { top: 100, left: 15, width: 10, height },
                    properties: { visibility, rawHtml: { value: '<p id="authored-b">B</p>' } },
                },
                { type: 'Text', name: 'text2', layout: { top: 100 + height + GAP, left: 15, width: 10, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openLinkAppInViewer(htmlSelector.authored('html1', 'authored-a'));

            let before;
            cy.document().should(() => {
                before = { text1: box('text1').top, text2: box('text2').top, html1Top: box('html1').top };
                expect(before.text1 - box('html1').bottom, 'text1 gap').to.be.closeTo(GAP, PX);
                expect(before.text2 - box('html2').bottom, 'text2 gap').to.be.closeTo(GAP, PX);
            });

            cy.get(textInput).type(hideWord);
            cy.get(htmlSelector.container('html1')).should('have.css', 'display', 'none');
            cy.get(htmlSelector.container('html2')).should('have.css', 'display', 'none');
            cy.document().should(() => {
                // lane A: text1 moved up into the reclaimed space (by at least the widget's height)…
                expect(before.text1 - box('text1').top, 'text1 moved up').to.be.gte(height - PX);
                // …without overlapping anything above the hidden widget's old top
                expect(box('text1').top, 'text1 not above the old top').to.be.gte(before.html1Top - PX);
                // lane B: no collapse → text2 keeps its place
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
            });

            cy.get(textInput).clear();
            cy.get(htmlSelector.container('html1')).should('have.css', 'display', 'flex');
            cy.document().should(() => {
                expect(box('text1').top, 'text1 restored').to.be.closeTo(before.text1, PX);
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
                expect(before.text1 - box('html1').bottom, 'gap restored').to.be.closeTo(GAP, PX);
                expect(box('html1').top, 'html1 back at its top').to.be.closeTo(before.html1Top, PX);
            });
            cy.get(htmlSelector.authored('html1', 'authored-a')).should('be.visible');
        });

        // ── Html-BRW-004 ─────────────────────────────────────────────────────
        // html.scss: the scroller is `overflow-y: auto` with an --interactive-selected thumb (:2-4); dynamic height
        // turns scrolling off (:7-10); a Flex Container canvas hands its own (hover-revealed) scrollbar colour down
        // (:16-18, appCanvas.scss:161-172); in the viewer the scrollbar is hidden until the widget is hovered (:21-26).
        it('[Html-BRW-004] Overflow scrolls; the viewer reveals the scrollbar only on hover; dynamic height and flex keep their scroll ownership', () => {
            const tallContent = `<div style="height:600px">${fake.firstName}</div><p id="authored-end">${fake.lastName}</p>`; // dynamic
            const flexId = crypto.randomUUID(); // dynamic: pinned so html3 can name it as its parent
            addHtmlWidgetsViaApi([
                { type: 'Text', name: 'text1', layout: { top: 10, left: 2, width: 10, height: 40 }, properties: { text: { value: 'rest' } } },
                { name: 'html1', layout: { top: 80, left: 2, width: 10, height: 120 }, properties: { rawHtml: { value: tallContent } } },
                {
                    name: 'html2',
                    layout: { top: 80, left: 15, width: 10, height: 120 },
                    properties: { rawHtml: { value: tallContent }, dynamicHeight: { value: '{{true}}' } },
                },
                { id: flexId, type: 'FlexContainer', name: 'flex1', layout: { top: 80, left: 28, width: 12, height: 300 } },
                { name: 'html3', parent: flexId, layout: { top: 0, left: 0, width: 10, height: 100 }, properties: { rawHtml: { value: tallContent } } },
            ]);
            const rest = () => cy.get(commonWidgetSelector.draggableWidget('text1')).realHover({ scrollBehavior: false });

            // authored-end starts scrolled out of view inside the fixed-height scrollers — wait for presence only
            openLinkAppInViewer(null);
            cy.get(htmlSelector.authored('html1', 'authored-end'), { timeout: 30000 }).should('exist');
            cy.get(htmlSelector.authored('html3', 'authored-end'), { timeout: 30000 }).should('exist');

            // fixed height: content overflows, the scroller scrolls, and its thumb colour is --interactive-selected
            rest();
            resolveCssVarColor(S.thumbColorVar, htmlSelector.container('html1')).then((thumb) => {
                htmlMetrics('html1', (m) => {
                    expect(m.overflowY, 'fixed height scrolls').to.eq(S.fixedOverflowY); // source: html.scss:3
                    expect(m.scrollHeight, 'content overflows').to.be.gt(m.clientHeight + 100);
                    expect(m.scrollbarColor, 'thumb colour').to.match(new RegExp(`^${Cypress._.escapeRegExp(thumb)}`)); // source: html.scss:4
                    expect(m.scrollbarWidth, 'viewer: hidden while not hovered').to.eq(S.hiddenScrollbarWidth); // source: html.scss:22
                });
            });
            cy.get(htmlSelector.container('html1')).realHover({ scrollBehavior: false });
            htmlMetrics('html1', (m) => expect(m.scrollbarWidth, 'viewer: shown on hover').to.eq(S.shownScrollbarWidth)); // source: html.scss:25
            // a real wheel over the widget scrolls its own content to the end
            cy.get(htmlSelector.container('html1')).realMouseWheel({ deltaY: 400, scrollBehavior: false });
            cy.get(htmlSelector.container('html1')).realMouseWheel({ deltaY: 400, scrollBehavior: false });
            htmlMetrics('html1', (m) => {
                expect(m.scrollTop, 'wheel scrolled the widget').to.be.gt(0);
                expect(m.scrollTop + m.clientHeight, 'reached the end').to.be.closeTo(m.scrollHeight, PX);
                const end = authoredRect('html1', 'authored-end');
                expect(end.bottom, 'last line visible').to.be.lte(m.container.bottom + 1);
                expect(end.top, 'last line visible').to.be.gte(m.container.top - 1);
            });
            rest();
            htmlMetrics('html1', (m) => expect(m.scrollbarWidth, 'hidden again off hover').to.eq(S.hiddenScrollbarWidth));

            // dynamic height: no own scrolling at all — the widget grows instead
            htmlMetrics('html2', (m) => {
                expect(m.overflowY).to.eq(S.dynamicOverflowY); // source: html.scss:8
                expect(m.scrollbarColor).to.eq(S.dynamicScrollbarColor); // source: html.scss:9
                expect(m.scrollHeight, 'nothing to scroll').to.be.lte(m.clientHeight + 1);
                expect(m.widget.height, 'grew instead').to.be.gt(600);
            });

            // flex container: html3 still scrolls, but its scrollbar colour is the flex canvas's own — transparent
            // at rest, revealed when the canvas is hovered — not the root-canvas thumb colour
            cy.get(htmlSelector.flexCanvas('flex1')).then(($fc) => {
                const fcColor = () => $fc[0].ownerDocument.defaultView.getComputedStyle($fc[0]).scrollbarColor;
                htmlMetrics('html3', (m) => {
                    expect(m.overflowY).to.eq(S.fixedOverflowY);
                    expect(m.scrollHeight, 'flex child overflows and scrolls').to.be.gt(m.clientHeight + 100);
                    expect(m.scrollbarColor, 'inherits the flex canvas colour').to.eq(fcColor());
                    expect(m.scrollbarColor, 'flex canvas hides the thumb at rest').to.eq('rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)'); // source: appCanvas.scss:165
                });
                cy.get(htmlSelector.container('html3')).realHover({ scrollBehavior: false });
                htmlMetrics('html3', (m) => {
                    expect(fcColor(), 'flex canvas reveals on hover').to.eq('auto'); // source: appCanvas.scss:169
                    expect(m.scrollbarColor, 'html3 follows the canvas').to.eq(fcColor());
                    expect(m.scrollbarWidth).to.eq(S.shownScrollbarWidth);
                });
            });

            // editor canvas: the hide-until-hover rule is viewer-only — the scrollbar is shown without hovering
            cy.then(() =>
                cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), commonWidgetSelector.draggableWidget('text1'))
            );
            rest();
            htmlMetrics('html1', (m) => {
                expect(m.scrollHeight, 'still overflows in the editor').to.be.gt(m.clientHeight + 100);
                expect(m.scrollbarWidth, 'editor: scrollbar not hidden').to.eq(S.shownScrollbarWidth);
            });
        });
    });
});
