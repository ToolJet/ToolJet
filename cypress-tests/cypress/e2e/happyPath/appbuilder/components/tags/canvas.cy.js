/**
 * SPEC — Tags — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the layout half of TESTING.md browser scenario:
 *   Tags-BRW-001 — wrap mode flows tags onto new rows, scroll mode scrolls horizontally, alignment visibly
 *                  positions tags (both modes), Viewer dynamic height grows the widget as rows wrap
 *                  (the computed shadow/radius half lives in styles.cy.js)
 * Seeded apps go through the components API (addTagsViaApi) and are measured with real layout boxes.
 * Tags renders `draggable-widget-<name>` twice (Tags.jsx:302), so count/move/multi-select use the Tags-scoped
 * verifyTagsWidgetCount / moveTagsWidget / multiSelectTagsWidgets instead of the shared helpers.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyTagsWidgetCount, moveTagsWidget,
 * duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget,
 * selectAllWidgets, multiSelectTagsWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addTagsViaApi, staticTags, expectTagsLayout, expectBadgeTitles, openAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tagsSelector } from "Selectors/appBuilder/components/tags";
import { tagsText } from "Texts/appBuilder/components/tags";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import {
    addTagsViaApi,
    staticTags,
    expectTagsLayout,
    expectBadgeTitles,
    verifyTagsWidgetCount,
    moveTagsWidget,
    multiSelectTagsWidgets,
} from "Support/utils/appBuilder/components/tags";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = tagsText.defaultWidgetName;
const T = tagsText;
const PX = 2; // layout tolerance (px)
const BADGE_MARGIN = 3; // Tags.jsx:263 — every badge keeps a 3px right margin

// dynamic: long single-word titles so a narrow widget must wrap/scroll
const longTitles = (n) => Array.from({ length: n }, (_, i) => `${fake.firstName.toLowerCase()}${i}xxxxxxxx`);
const box = (name) => {
    const el = Cypress.$(tagsSelector.widgetBox(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
const textBox = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Tags — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Tags-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with the four default tags', () => {
            cy.get(tagsSelector.widgetBox(W)).should('exist');
            expectBadgeTitles(W, T.defaultTitles); // source: tags.js:189,197,205,213
            verifyTagsWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                moveTagsWidget(W, 650, 450);
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
            verifyTagsWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyTagsWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyTagsWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(tagsSelector.widgetBox(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 350);
            closeQueryPanel();

            multiSelectTagsWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'statuschips'); // asserts new name internally
            cy.get(tagsSelector.widgetBox(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(tagsSelector.widgetBox(W)).should('not.exist');
            undo();
            cy.get(tagsSelector.widgetBox(W)).should('exist');
            redo();
            cy.get(tagsSelector.widgetBox(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Tags-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Tags-BRW-001 (overflow: wrap / scroll) ───────────────────────────
        // Tags.jsx:164-182: wrap → flex-wrap: wrap + overflow-x hidden / overflow-y auto; scroll → nowrap +
        // overflow-x auto. jsdom only sees the inline styles; this proves the real flow and scrolling.
        it('[Tags-BRW-001] Wrap mode flows tags onto new rows; scroll mode keeps one row and scrolls horizontally', () => {
            const titles = longTitles(8);
            addTagsViaApi([
                // overflow 'wrap' is the default (tags.js:222)
                { name: 'wraptags', layout: { top: 40, left: 2, width: 8, height: 40 }, properties: { options: { value: staticTags(titles) } } },
                {
                    name: 'scrolltags',
                    layout: { top: 40, left: 30, width: 8, height: 40 },
                    properties: { options: { value: staticTags(titles) }, overflow: { value: 'scroll' } }, // source: tags.js:38
                },
            ]);
            openAppInViewer(tagsSelector.badge('wraptags', titles[0]));
            expectBadgeTitles('wraptags', titles);
            expectBadgeTitles('scrolltags', titles);

            // wrap: several rows, every badge inside the widget's width, the extra rows scroll vertically
            expectTagsLayout('wraptags', (t) => {
                expect(t.rows, 'wrap: tags flow onto new rows').to.be.gt(2);
                t.badges.forEach((b, i) => {
                    expect(b.left, `badge ${i} left inside`).to.be.gte(t.wrapper.left - 0.5);
                    expect(b.right, `badge ${i} right inside`).to.be.lte(t.wrapper.right + 0.5);
                });
                expect(t.scrollWidth - t.clientWidth, 'wrap: no horizontal overflow').to.be.at.most(1);
                expect(t.scrollHeight, 'wrap: rows overflow the authored height').to.be.gt(t.clientHeight + 10);
            });
            cy.get(tagsSelector.wrapper('wraptags')).first().then(($w) => { $w[0].scrollTop = $w[0].scrollHeight; });
            expectTagsLayout('wraptags', (t) => {
                const last = t.badges[t.badges.length - 1];
                expect(t.el.scrollTop, 'wrap: scrolled vertically').to.be.gt(0);
                expect(last.bottom, 'wrap: last row revealed').to.be.lte(t.wrapper.bottom + 0.5);
            });

            // scroll: one row, overflowing to the right, horizontally scrollable to the last tag
            expectTagsLayout('scrolltags', (t) => {
                expect(t.rows, 'scroll: one row').to.eq(1);
                expect(t.scrollWidth, 'scroll: row wider than the widget').to.be.gt(t.clientWidth + 100);
                expect(t.scrollLeft, 'scroll: starts at the left').to.eq(0);
                expect(t.badges[0].left, 'scroll: first tag at the left edge').to.be.closeTo(t.wrapper.left, PX);
                expect(t.badges[t.badges.length - 1].left, 'scroll: last tag off to the right').to.be.gt(t.wrapper.right);
            });
            cy.get(tagsSelector.wrapper('scrolltags')).first().scrollTo('right', { ensureScrollable: true });
            expectTagsLayout('scrolltags', (t) => {
                const last = t.badges[t.badges.length - 1];
                expect(t.scrollLeft, 'scroll: scrolled horizontally').to.be.gt(100);
                expect(last.right, 'scroll: last tag revealed').to.be.lte(t.wrapper.right + 0.5);
                expect(last.left, 'scroll: last tag inside').to.be.gte(t.wrapper.left - 0.5);
                expect(t.rows, 'scroll: still one row').to.eq(1);
            });
        });

        // ── Tags-BRW-001 (alignment) ─────────────────────────────────────────
        // Tags.jsx:170,329,345: alignment left/center/right → flex-start/center/flex-end, in both overflow modes.
        it('[Tags-BRW-001] Alignment left / center / right visibly positions the tags in wrap and scroll modes', () => {
            const titles = [fake.firstName.toLowerCase(), fake.lastName.toLowerCase()]; // dynamic: two short tags that fit
            const aligns = ['left', 'center', 'right']; // source: tags.js:150-153 (alignButtons), default left tags.js:234
            const modes = ['wrap', 'scroll']; // source: tags.js:38-39
            const items = [];
            modes.forEach((mode, row) =>
                aligns.forEach((align, col) =>
                    items.push({
                        name: `${mode}${align}`,
                        layout: { top: 40 + row * 80, left: 2 + col * 32, width: 12, height: 40 },
                        properties: { options: { value: staticTags(titles) }, overflow: { value: mode } },
                        styles: { alignment: { value: align } },
                    })
                )
            );
            addTagsViaApi(items);
            openAppInViewer(tagsSelector.container('wrapleft'));

            modes.forEach((mode) => {
                const free = {};
                aligns.forEach((align) => {
                    expectTagsLayout(`${mode}${align}`, (t) => {
                        expect(t.badges, `${mode}/${align}: both tags rendered`).to.have.length(2);
                        expect(t.rows, `${mode}/${align}: one row`).to.eq(1);
                        free[align] = {
                            left: t.badges[0].left - t.wrapper.left,
                            right: t.wrapper.right - t.badges[1].right,
                        };
                    });
                });
                cy.then(() => {
                    expect(free.left.left, `${mode}/left: tags start at the left edge`).to.be.closeTo(0, PX);
                    expect(free.left.right, `${mode}/left: free space on the right`).to.be.gt(100);
                    expect(free.right.right, `${mode}/right: tags end at the right edge`).to.be.closeTo(BADGE_MARGIN, PX);
                    expect(free.right.left, `${mode}/right: free space on the left`).to.be.gt(100);
                    // centred: equal free space either side (the last badge's 3px margin counts on the right)
                    expect(free.center.left - free.center.right, `${mode}/center: centred`).to.be.closeTo(0, BADGE_MARGIN + PX);
                    expect(free.center.left, `${mode}/center: free space on the left`).to.be.gt(50);
                });
            });
        });

        // ── Tags-BRW-001 (dynamic height reflow) ─────────────────────────────
        // Tags.jsx:48-61: dynamicHeight && currentMode === 'view' → useHeightObserver + useDynamicHeight resize the
        // grid box to the wrapped rows; widgets below reflow. The editor keeps the authored height and scrolls.
        it('[Tags-BRW-001] Viewer dynamic height grows the widget as rows wrap and reflows the widget below; the editor keeps the authored height', () => {
            const authored = 40; // dynamic: authored height (px)
            const gap = 20; // dynamic: authored gap to the Text below (px)
            const word = fake.firstName.toLowerCase().slice(0, 4); // dynamic: title stem, capped so two tags fit one row
            addTagsViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 40, left: 40, width: 8, height: 40 } },
                {
                    name: W,
                    layout: { top: 40, left: 2, width: 8, height: authored },
                    properties: {
                        advanced: { value: '{{true}}' }, // tags.js:15-23 Dynamic tags
                        // tag count follows the text input (2 when empty)
                        data: { value: `{{Array.from({length: Number(components.textinput1.value) || 2}, (_, i) => ({title: '${word}' + i + 'xxxxxxxx'}))}}` },
                        dynamicHeight: { value: '{{true}}' }, // tags.js:44-49
                    },
                },
                { type: 'Text', name: 'text1', layout: { top: 40 + authored + gap, left: 2, width: 8, height: 40 }, properties: { text: { value: word } } },
            ]);
            openAppInViewer(tagsSelector.container(W));

            let small;
            expectTagsLayout(W, (t) => {
                expect(t.badges, 'two tags').to.have.length(2);
                expect(t.rows, 'two tags fit one row').to.eq(1);
                expect(textBox('text1').top - box(W).bottom, 'authored gap below').to.be.closeTo(gap, PX);
                small = box(W).height;
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).type('9');
            expectTagsLayout(W, (t) => {
                expect(t.badges, 'nine tags').to.have.length(9);
                expect(t.rows, 'tags wrap onto several rows').to.be.gt(3);
                expect(box(W).height, 'widget grew with the rows').to.be.gt(small + 60);
                // every row is shown — nothing left to scroll inside the widget
                expect(t.scrollHeight - t.clientHeight, 'no inner overflow').to.be.at.most(1);
                expect(t.badges[t.badges.length - 1].bottom, 'last row inside the widget').to.be.lte(box(W).bottom + 0.5);
                // the Text below moved down with it and keeps the authored gap
                expect(textBox('text1').top - box(W).bottom, 'gap kept after growth').to.be.closeTo(gap, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear().type('1');
            expectTagsLayout(W, (t) => {
                expect(t.badges, 'one tag').to.have.length(1);
                expect(box(W).height, 'widget shrank back').to.be.closeTo(small, PX);
                expect(textBox('text1').top - box(W).bottom, 'gap kept after shrink').to.be.closeTo(gap, PX);
            });

            // editor: no dynamic height — authored height, the wrapped rows scroll instead
            cy.openApp('', undefined, undefined, tagsSelector.container(W));
            cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear().type('9');
            expectTagsLayout(W, (t) => {
                expect(t.badges, 'nine tags').to.have.length(9);
                expect(t.rows, 'tags wrap').to.be.gt(3);
                expect(box(W).height, 'editor keeps the authored height').to.be.closeTo(authored, PX);
                expect(t.scrollHeight, 'editor scrolls the rows instead').to.be.gt(t.clientHeight + 20);
            });
        });
    });
});
