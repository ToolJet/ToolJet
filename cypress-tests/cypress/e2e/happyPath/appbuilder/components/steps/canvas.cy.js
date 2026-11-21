/**
 * SPEC — Steps — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + the geometry part of TESTING.md browser scenario:
 *   Steps-BRW-002 — empty, single and many-step lists across all variants produce correct connector length,
 *                   centring and label ellipsis without overflow at supported sizes; here: a seeded matrix in the
 *                   editor and the running app, and a resize that re-lays connectors and label truncation.
 * Colours, disabled opacity/cursor, tooltip placement and the focus ring live in styles.cy.js; theme colours in
 * contexts.cy.js.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * resizeWidgetBy, addStepsViaApi, openStepsAppInViewer, stepsBoxes, readStepsBoxes, expectStepsGeometry.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { stepsSelector } from "Selectors/appBuilder/components/steps";
import { stepsText } from "Texts/appBuilder/components/steps";
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
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import {
    addStepsViaApi,
    openStepsAppInViewer,
    stepsBoxes,
    readStepsBoxes,
    expectStepsGeometry,
} from "Support/utils/appBuilder/components/steps";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = stepsText.defaultWidgetName;
const T = stepsText;
const PREFIX = T.widgetPrefix;
const VARIANTS = [T.variantLabel, T.variantNumber, T.variantPlain];

// list shapes for the BRW-002 matrix; names cut short so the "long" captions are long but deterministic
const longCaption = () => `${fake.fullName} ${fake.fullName} ${fake.fullName}`.slice(0, 36);
const LISTS = () => ({
    empty: [],
    single: [{ name: fake.firstName.slice(0, 8) || 'one', id: 1 }],
    long: [
        { name: longCaption(), id: 1 },
        { name: fake.firstName.slice(0, 3) || 'two', id: 2 },
        { name: longCaption(), id: 3 },
    ],
    many: Array.from({ length: 20 }, (_, i) => ({ name: `Step ${i + 1} ${fake.firstName.slice(0, 4)}`, id: i + 1 })), // dynamic: 20 steps
});

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its own app.
describe('Steps — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Steps-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places five labelled steps with step 3 current', () => {
            cy.get(stepsSelector.root(W)).should('be.visible');
            // definition defaults: 5 steps, currentStep {{3}}, variant titles (steps.js:217-231)
            expectStepsGeometry(W, { context: 'dropped' });
            stepsBoxes(W, (b) => {
                expect(b.milestones.map((m) => m.ariaCurrent)).to.deep.eq([null, null, T.ariaCurrentStep, null, null]);
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
            cy.dragAndDropWidget(T.displayName, 650, 350);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'checkoutsteps'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-Steps-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Steps-BRW-002 — list size × variant geometry ─────────────────────
        it('[Steps-BRW-002] Empty, single, long-label and 20-step lists lay out without overflow in every variant, in the editor and the running app', () => {
            const lists = LISTS();
            const cases = [];
            VARIANTS.forEach((variant, v) => {
                Object.entries(lists).forEach(([shape, steps], s) => {
                    cases.push({
                        name: `${variant}${shape}`,
                        variant,
                        count: steps.length,
                        // the long first/last captions only truncate in the Label variant
                        truncated:
                            shape === 'long' ? [true, false, true] : shape === 'many' ? steps.map(() => true) : steps.map(() => false),
                        item: {
                            name: `${variant}${shape}`,
                            layout: { top: 30 + (v * 4 + s) * 60, left: 2, width: shape === 'long' ? 10 : 22, height: 38 }, // dynamic: stacked slots
                            properties: {
                                variant: { value: variant },
                                steps: { value: steps },
                                currentStep: { value: `{{${Math.min(2, steps.length)}}}` }, // dynamic: second step (or the only one)
                            },
                        },
                    });
                });
            });
            addStepsViaApi(cases.map((c) => c.item));

            const checkAll = (where) =>
                cases.forEach(({ name, variant, count, truncated }) =>
                    expectStepsGeometry(name, { variant, count, truncated, context: `${name} (${where})` })
                );

            cy.openApp('', undefined, undefined, stepsSelector.milestones(`${T.variantPlain}many`));
            closeQueryPanel();
            checkAll('editor');

            // the active milestone is the configured one, whatever the list size
            stepsBoxes(`${T.variantNumber}long`, (b) =>
                expect(b.milestones.map((m) => m.ariaCurrent)).to.deep.eq([null, T.ariaCurrentStep, null])
            );
            stepsBoxes(`${T.variantLabel}single`, (b) => expect(b.milestones[0].ariaCurrent).to.eq(T.ariaCurrentStep));
            // empty list: no milestones, nothing painted, no crash — the root is still there
            stepsBoxes(`${T.variantLabel}empty`, (b) => {
                expect(b.milestones).to.have.length(0);
                expect(b.line.height, 'empty line has no height').to.eq(0);
            });

            openStepsAppInViewer(stepsSelector.milestones(`${T.variantPlain}many`));
            checkAll('viewer');
        });

        it('[Steps-BRW-002] Resizing re-lays connectors and switches label truncation on and off, in the editor and the running app', () => {
            const steps = [
                { name: longCaption(), id: 1 },
                { name: fake.firstName.slice(0, 3) || 'two', id: 2 },
                { name: longCaption(), id: 3 },
            ];
            addStepsViaApi([
                { name: 'flow', layout: { top: 40, left: 2, width: 30, height: 38 }, properties: { steps: { value: steps } } }, // dynamic: wide
            ]);
            cy.openApp('', undefined, undefined, stepsSelector.milestones('flow'));
            closeQueryPanel();

            // wide: every caption fits
            expectStepsGeometry('flow', { count: 3, truncated: [false, false, false], context: 'wide' });
            readStepsBoxes('flow').then((wide) => {
                resizeWidgetBy('flow', -wide.box.width * 0.55, 0); // dynamic: about half the width
                stepsBoxes('flow', (b) => {
                    expect(b.box.width, 'narrower').to.be.lt(wide.box.width * 0.6);
                    expect(b.connectors[0].width, 'connectors shrink with the widget').to.be.lt(wide.connectors[0].width);
                    expect(b.milestones[0].label.maxWidth, 'label budget shrinks').to.be.lt(wide.milestones[0].label.maxWidth);
                });
                // narrow: the long first/last captions are cut with an ellipsis, the short one is not
                expectStepsGeometry('flow', { count: 3, truncated: [true, false, true], context: 'narrow (editor)' });

                // and back to wide: the captions are whole again (no stale truncation)
                readStepsBoxes('flow').then((narrow) => {
                    resizeWidgetBy('flow', wide.box.width - narrow.box.width, 0);
                    expectStepsGeometry('flow', { count: 3, truncated: [false, false, false], context: 'wide again (editor)' });
                });
            });

            // the saved size gives the same layout in the running app
            openStepsAppInViewer(stepsSelector.milestones('flow'));
            expectStepsGeometry('flow', { count: 3, truncated: [false, false, false], context: 'viewer' });
        });
    });
});
