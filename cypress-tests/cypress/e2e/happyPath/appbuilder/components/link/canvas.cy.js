/**
 * SPEC — Link — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only canvas scenarios from TESTING.md:
 *   Link-BRW-001 — collapse when hidden reclaims canvas space in the running app, showing restores it
 *   Link-BRW-003 — dynamic height grows the widget with wrapping text in view mode; the editor does not
 *   Link-BRW-007 — overflowing text scrolls from the first line under top/centre/bottom alignment; fitting
 *                  text keeps its centre/bottom placement
 * Collapse-when-hidden and dynamic height only run in view mode (RenderWidget.jsx:303, Link.jsx:38), so those
 * apps are seeded through the components API (addLinksViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addLinksViaApi, openLinkAppInViewer, expectBoxes, scrollLinkTo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { linkSelector } from "Selectors/appBuilder/components/link";
import { linkText } from "Texts/appBuilder/components/link";
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
import {
    addLinksViaApi,
    openLinkAppInViewer,
    expectBoxes,
    scrollLinkTo,
} from "Support/utils/appBuilder/components/link";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = linkText.defaultWidgetName;
const T = linkText;
const PX = 2; // layout tolerance (px)

// dynamic: a sentence that wraps to many lines in a narrow Link
const LONG_TEXT = Array.from({ length: 14 }, () => fake.firstName).join(' ');
const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
const isShown = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    return !!el && el.getBoundingClientRect().height > 0 && !el.querySelector('.link-widget.d-none');
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Link — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Link-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            cy.get(linkSelector.linkText(W)).should('have.text', T.defaultLinkText); // source: link.js:232
            cy.get(linkSelector.anchor(W)).should('have.attr', 'href', T.defaultLinkTarget); // source: link.js:231
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
            renameWidgetFromMenu(W, 'docslink'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-Link-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Link-BRW-001 ─────────────────────────────────────────────────────
        // RenderWidget.jsx:295-311 schedules a reflow when visibility flips in view mode and
        // properties.collapseWhenHidden (link.js:69-74) is on; gridSlice.js:375-381 then drops the hidden
        // widget's height. Lane A collapses, lane B (collapse off) is the control.
        it('[Link-BRW-001] Collapse when hidden reclaims the space in the running app; showing restores it', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to hide both Links
            const visibility = { value: `{{components.textinput1.value !== "${hideWord}"}}` };
            addLinksViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 30, width: 10, height: 40 } },
                {
                    name: 'link1',
                    layout: { top: 100, left: 2, width: 10, height: 60 },
                    properties: { visibility, collapseWhenHidden: { value: '{{true}}' } },
                },
                { type: 'Text', name: 'text1', layout: { top: 180, left: 2, width: 10, height: 40 }, properties: { text: { value: 'A' } } },
                {
                    name: 'link2',
                    layout: { top: 100, left: 15, width: 10, height: 60 },
                    properties: { visibility }, // collapseWhenHidden stays {{false}} (link.js:237)
                },
                { type: 'Text', name: 'text2', layout: { top: 180, left: 15, width: 10, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openLinkAppInViewer(linkSelector.linkText('link1'));

            let before;
            cy.document().should(() => {
                before = { text1: box('text1').top, text2: box('text2').top, link1Top: box('link1').top };
                // authored gap of 20px below both Links
                expect(before.text1 - box('link1').bottom, 'text1 gap').to.be.closeTo(20, PX);
                expect(before.text2 - box('link2').bottom, 'text2 gap').to.be.closeTo(20, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).type(hideWord);
            cy.get(linkSelector.wrapper('link1')).should('have.class', 'd-none');
            cy.get(linkSelector.wrapper('link2')).should('have.class', 'd-none');
            cy.document().should(() => {
                expect(isShown('link1'), 'link1 hidden').to.be.false;
                // lane A: text1 moved up into the reclaimed space (by at least the Link's 60px height)
                expect(before.text1 - box('text1').top, 'text1 moved up').to.be.gte(60 - PX);
                expect(box('text1').top, 'text1 not above the Link\'s old top').to.be.gte(before.link1Top - PX);
                // lane B: no collapse → text2 keeps its place
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear();
            cy.get(linkSelector.wrapper('link1')).should('not.have.class', 'd-none');
            cy.document().should(() => {
                expect(box('text1').top, 'text1 restored').to.be.closeTo(before.text1, PX);
                expect(box('text2').top, 'text2 unchanged').to.be.closeTo(before.text2, PX);
                expect(before.text1 - box('link1').bottom, 'gap restored').to.be.closeTo(20, PX);
            });
        });

        // ── Link-BRW-003 ─────────────────────────────────────────────────────
        // Link.jsx:38-51: dynamic height only when properties.dynamicHeight && currentMode === 'view'; the
        // wrapper switches to height:auto + minHeight (Link.jsx:57-58) and useDynamicHeight resizes the box.
        it('[Link-BRW-003] Dynamic height grows the box with wrapping text in view mode; the editor keeps the authored height', () => {
            const authored = 30; // dynamic: authored height (px)
            addLinksViaApi([
                {
                    name: 'link1',
                    layout: { top: 40, left: 2, width: 5, height: authored },
                    properties: { linkText: { value: LONG_TEXT }, dynamicHeight: { value: '{{true}}' } },
                },
                {
                    name: 'link2',
                    layout: { top: 40, left: 20, width: 10, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' } }, // short default text fits
                },
            ]);

            openLinkAppInViewer(linkSelector.linkText('link1'));
            cy.document().should(() => {
                expect(box('link1').height, 'grew past the authored height').to.be.gt(authored + 30);
                expect(box('link2').height, 'fitting text keeps the authored height').to.be.closeTo(authored, PX);
            });
            // the grown box shows every line — nothing left to scroll
            expectBoxes('link1', (b) => {
                expect(b.lines.length, 'text wraps').to.be.gt(2);
                expect(b.scrollHeight - b.clientHeight, 'no overflow').to.be.at.most(1);
                expect(b.lines[b.lines.length - 1].bottom, 'last line inside the box').to.be.lte(box('link1').bottom + 0.5);
            });

            cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), commonWidgetSelector.draggableWidget('link1'));
            cy.document().should(() => {
                expect(box('link1').height, 'editor keeps the authored height').to.be.closeTo(authored, PX);
            });
            expectBoxes('link1', (b) => {
                expect(b.scrollHeight, 'editor overflows (scrolls) instead of growing').to.be.gt(b.clientHeight + 10);
            });
        });

        // ── Link-BRW-007 ─────────────────────────────────────────────────────
        // D-12 / Link.jsx:177: auto margins on the anchor (`auto 0` centre, `auto 0 0` bottom) never go
        // negative, so overflow starts at the top of the `overflow: auto` wrapper (theme.scss .link-widget).
        it('[Link-BRW-007] Overflowing text scrolls from the first line under every vertical alignment; fitting text keeps its placement', () => {
            const aligns = [T.alignTop, T.alignCenter, T.alignBottom]; // source: link.js:140-142
            const links = [];
            aligns.forEach((align, i) => {
                links.push({
                    name: `over${align}`,
                    layout: { top: 40, left: 2 + i * 14, width: 5, height: 40 },
                    properties: { linkText: { value: LONG_TEXT } },
                    styles: { verticalAlignment: { value: align }, iconVisibility: { value: true } },
                });
                links.push({
                    name: `fit${align}`,
                    layout: { top: 200, left: 2 + i * 14, width: 10, height: 80 },
                    styles: { verticalAlignment: { value: align } },
                });
            });
            addLinksViaApi(links);
            openLinkAppInViewer(linkSelector.linkText('overtop'));

            aligns.forEach((align) => {
                const name = `over${align}`;
                cy.log(`overflow — ${align}`);
                scrollLinkTo(name, 'top');
                expectBoxes(name, (b) => {
                    expect(b.scrollHeight, `${align}: text taller than the widget`).to.be.gt(b.clientHeight + 20);
                    expect(b.scrollTop, `${align}: at the top`).to.eq(0);
                    // the whole first line and the icon are reachable at scrollTop 0
                    expect(b.lines[0].top, `${align}: first line not clipped above`).to.be.gte(b.wrapper.top - 0.5);
                    expect(b.icon.top, `${align}: icon not clipped above`).to.be.gte(b.wrapper.top - 0.5);
                    expect(b.icon.bottom, `${align}: icon inside the box`).to.be.lte(b.wrapper.bottom + 0.5);
                });
                scrollLinkTo(name, 'bottom');
                expectBoxes(name, (b) => {
                    expect(b.scrollTop, `${align}: scrolled`).to.be.gt(0);
                    const last = b.lines[b.lines.length - 1];
                    expect(last.bottom, `${align}: last line revealed`).to.be.lte(b.wrapper.bottom + 0.5);
                    expect(last.top, `${align}: last line inside the box`).to.be.gte(b.wrapper.top - 0.5);
                });
            });

            // fitting text: placement exactly as align-items top / center / flex-end (Link.jsx:55)
            expectBoxes(`fit${T.alignTop}`, (b) => {
                expect(b.scrollHeight - b.clientHeight, 'top: fits').to.be.at.most(1);
                expect(b.anchor.top, 'top: anchor at the top').to.be.closeTo(b.wrapper.top, 0.5);
            });
            expectBoxes(`fit${T.alignCenter}`, (b) => {
                const mid = (r) => (r.top + r.bottom) / 2;
                expect(b.scrollHeight - b.clientHeight, 'center: fits').to.be.at.most(1);
                expect(mid(b.anchor), 'center: anchor centred').to.be.closeTo(mid(b.wrapper), 0.5);
                expect(b.anchor.top, 'center: free space above').to.be.gt(b.wrapper.top + 10);
            });
            expectBoxes(`fit${T.alignBottom}`, (b) => {
                expect(b.scrollHeight - b.clientHeight, 'bottom: fits').to.be.at.most(1);
                expect(b.anchor.bottom, 'bottom: anchor at the bottom').to.be.closeTo(b.wrapper.bottom, 0.5);
                expect(b.anchor.top, 'bottom: free space above').to.be.gt(b.wrapper.top + 10);
            });
        });
    });
});
