/**
 * SPEC — Text — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only canvas scenarios from TESTING.md:
 *   Text-BRW-001 — in a published app, dynamic height grows the Text to its real content and moves the widgets
 *                  below, including after it is hidden and re-shown
 *   Text-BRW-002 — with Scroll enabled, overflowing content scrolls and fitting content has nothing to scroll
 * Dynamic height only runs in view mode (Text.jsx:67), so those apps are seeded through the components API
 * (addTextsViaApi) and opened in the released app / viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * releaseAndMakePublic, openIconAppInViewer, addTextsViaApi, textMetrics.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { textSelector } from "Selectors/appBuilder/components/text";
import { textText } from "Texts/appBuilder/components/text";
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
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { addTextsViaApi, textMetrics } from "Support/utils/appBuilder/components/text";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = textText.defaultWidgetName;
const T = textText;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
// dynamic: words for wrapped text — letters only, capped so a row of them wraps predictably
const words = (n) => Array.from({ length: n }, () => (fake.firstName.replace(/[^A-Za-z]/g, '') || 'word').slice(0, 9)).join(' ');

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Text — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Text-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            // the drop-time HTML text greets the current user. source: text.js:303,305
            cy.get(textSelector.scroller(W)).should(($s) => {
                const shown = $s.text().trim();
                expect(shown.startsWith(T.greetingPrefix), `greeting: ${shown}`).to.eq(true);
                expect(shown.endsWith(T.greetingSuffix), `greeting: ${shown}`).to.eq(true);
            });
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
            cy.dragAndDropWidget(T.displayName, 650, 300);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'headline'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-Text-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Text-BRW-001 ─────────────────────────────────────────────────────
        // Text.jsx:67 dynamic height only when properties.dynamicHeight && currentMode === 'view'; the root switches
        // to height:auto + minHeight (Text.jsx:162-163) and useHeightObserver/useDynamicHeight resize the grid box and
        // reflow the widgets below. Hiding (visibility bound to a TextInput) with collapse on reclaims the space;
        // useDynamicHeight defers the re-measure until the widget is shown again.
        it('[Text-BRW-001] In a published app dynamic height follows the real content and reflows the widgets below, also after hide / re-show', () => {
            const configured = 60; // dynamic: authored height (px)
            const hideWord = 'hide'; // dynamic: gate value that hides the Text
            const slug = `text-dyn-${Cypress._.random(1e6, 9e6)}`; // dynamic
            // one block per requested line — the count comes from the `lines` TextInput
            const linesHtml =
                "{{Array.from({ length: Number(components.lines.value) || 1 }, (_, i) => '<div class=\"ln\">Line ' + (i + 1) + '</div>').join('')}}";
            addTextsViaApi([
                { type: 'TextInput', name: 'lines', layout: { top: 10, left: 25, width: 8, height: 40 } },
                { type: 'TextInput', name: 'gate', layout: { top: 70, left: 25, width: 8, height: 40 } },
                {
                    name: 'dyn',
                    layout: { top: 130, left: 2, width: 10, height: configured },
                    properties: {
                        textFormat: { value: T.formats.html },
                        text: { value: linesHtml },
                        dynamicHeight: { value: '{{true}}' }, // source: text.js:32-40
                        collapseWhenHidden: { value: '{{true}}' }, // source: text.js:60-65
                        visibility: { value: `{{components.gate.value !== "${hideWord}"}}` },
                    },
                },
                { name: 'below', layout: { top: 130 + configured + GAP, left: 2, width: 10, height: 40 }, properties: { text: { value: 'below' } } },
            ]);
            releaseAndMakePublic(slug);
            cy.then(() => cy.visit(`/applications/${slug}`));
            cy.get(textSelector.scroller('below'), { timeout: 30000 }).should('contain.text', 'below');

            // every line is inside the widget, nothing scrolls inside it, and `below` keeps its gap
            const expectFits = (n) =>
                textMetrics('dyn', (m) => {
                    expect(m.rootDisplay, 'shown').to.eq('flex');
                    const shown = Cypress.$(`${textSelector.root('dyn')} .ln`);
                    expect(shown.length, 'rendered lines').to.eq(n);
                    const last = shown[n - 1].getBoundingClientRect();
                    expect(last.bottom, 'last line inside the widget').to.be.lte(m.root.bottom + 0.5);
                    expect(m.scroller.scrollHeight, 'no inner scroll').to.be.lte(m.scroller.clientHeight + 1);
                    expect(box('below').top - box('dyn').bottom, 'below keeps its gap').to.be.closeTo(GAP, PX);
                });
            let start;
            expectFits(1);
            cy.document().should(() => {
                expect(box('dyn').height, 'configured height while content fits').to.be.closeTo(configured, PX);
                start = { below: box('below').top, dyn: box('dyn').top };
            });

            // grow: 12 lines are much taller than the configured box
            cy.get(textSelector.textInput('lines')).type('12');
            expectFits(12);
            cy.document().should(() => expect(box('dyn').height, 'grew with the content').to.be.gt(configured * 3));

            // hide → collapse reclaims the space
            cy.get(textSelector.textInput('gate')).type(hideWord);
            textMetrics('dyn', (m) => expect(m.rootDisplay, 'hidden').to.eq('none'));
            cy.document().should(() =>
                expect(box('below').top, 'below moved up into the reclaimed space').to.be.lt(start.below - PX));

            // content grows while hidden, then the Text is shown again: it measures the new content
            cy.get(textSelector.textInput('lines')).clear().type('20');
            cy.get(textSelector.textInput('gate')).clear();
            expectFits(20);
            cy.document().should(() => {
                expect(box('dyn').top, 'back at its top').to.be.closeTo(start.dyn, PX);
                expect(box('dyn').height, 'height for 20 lines').to.be.gt(configured * 5);
            });

            // shrink back: configured height, below back where it started
            cy.get(textSelector.textInput('lines')).clear().type('1');
            expectFits(1);
            cy.document().should(() => {
                expect(box('dyn').height, 'back to configured height').to.be.closeTo(configured, PX);
                expect(box('below').top, 'below back at its start').to.be.closeTo(start.below, PX);
            });
        });

        // ── Text-BRW-002 ─────────────────────────────────────────────────────
        // styles.isScrollRequired (text.js:149-157, default 'enabled' text.js:334): Text.jsx:194-200 gives the content
        // box overflow-y `auto` when enabled (commit 0f1f32d01d replaced `scroll`, which always paints a scrollbar on
        // classic-scrollbar platforms) and `hidden` when disabled.
        it('[Text-BRW-002] With Scroll enabled overflowing content scrolls, fitting content has nothing to scroll', () => {
            const tall = words(60); // dynamic: wraps far past a 60px box
            addTextsViaApi([
                { name: 'overflowing', layout: { top: 20, left: 2, width: 8, height: 60 }, properties: { textFormat: { value: T.formats.plainText }, text: { value: tall } } },
                { name: 'fitting', layout: { top: 20, left: 12, width: 8, height: 60 }, properties: { textFormat: { value: T.formats.plainText }, text: { value: words(1) } } },
                // control: Scroll disabled clips instead of scrolling
                {
                    name: 'noscroll',
                    layout: { top: 20, left: 22, width: 8, height: 60 },
                    properties: { textFormat: { value: T.formats.plainText }, text: { value: tall } },
                    styles: { isScrollRequired: { value: T.scrollDisabled } },
                },
            ]);
            openIconAppInViewer(textSelector.root('fitting'));

            // overflowing: scrollable content box; a real wheel scrolls it to the last line
            textMetrics('overflowing', (m) => {
                expect(m.scroller.overflowY, 'scroll enabled').to.eq(T.scrollerOverflowEnabled); // source: Text.jsx:200
                expect(m.scroller.scrollHeight, 'content overflows').to.be.gt(m.scroller.clientHeight + 40);
                expect(m.scroller.scrollTop).to.eq(0);
            });
            cy.get(textSelector.scroller('overflowing')).realMouseWheel({ deltaY: 300, scrollBehavior: false });
            cy.get(textSelector.scroller('overflowing')).realMouseWheel({ deltaY: 300, scrollBehavior: false });
            textMetrics('overflowing', (m) => {
                expect(m.scroller.scrollTop, 'wheel scrolled the content').to.be.gt(0);
                expect(m.scroller.scrollTop + m.scroller.clientHeight, 'reached the end').to.be.closeTo(m.scroller.scrollHeight, PX);
                const last = m.lines[m.lines.length - 1];
                expect(last.bottom, 'last line visible').to.be.lte(m.content.bottom + 1);
                expect(last.top, 'last line visible').to.be.gte(m.content.top - 1);
            });

            // fitting: same `auto` overflow (no always-on scrollbar), nothing to scroll, the wheel moves nothing
            textMetrics('fitting', (m) => {
                expect(m.scroller.overflowY, 'auto, never an always-on scroll').to.eq(T.scrollerOverflowEnabled); // source: Text.jsx:200
                expect(m.scroller.scrollHeight, 'nothing overflows').to.be.lte(m.scroller.clientHeight);
            });
            cy.get(textSelector.scroller('fitting')).then(($s) =>
                expect($s[0].offsetWidth - $s[0].clientWidth, 'no scrollbar gutter').to.eq(0));
            cy.get(textSelector.scroller('fitting')).realMouseWheel({ deltaY: 300, scrollBehavior: false });
            textMetrics('fitting', (m) => expect(m.scroller.scrollTop, 'nothing scrolled').to.eq(0));

            // control: Scroll disabled — the overflowing content is clipped and the wheel does not scroll it
            cy.get(textSelector.scroller('noscroll')).realMouseWheel({ deltaY: 300, scrollBehavior: false });
            textMetrics('noscroll', (m) => {
                expect(m.scroller.overflowY, 'scroll disabled').to.eq(T.scrollerOverflowDisabled); // source: Text.jsx:200
                expect(m.scroller.scrollHeight, 'content overflows').to.be.gt(m.scroller.clientHeight + 40);
                expect(m.scroller.scrollTop, 'not scrollable').to.eq(0);
                expect(m.lines[m.lines.length - 1].top, 'last line clipped below the box').to.be.gt(m.content.bottom);
            });
        });
    });
});
