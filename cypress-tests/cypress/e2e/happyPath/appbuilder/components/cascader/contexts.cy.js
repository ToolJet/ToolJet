/**
 * SPEC — Cascader — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenarios:
 *   Cascader-BRW-002 — editor canvas, preview, released app and public app expose the same selection
 *                      (value / pathString), fire the same onSelect / onFocus, and run the same setValue / clearValue
 *   Cascader-BRW-003 — a saved app reloads its static tree + default leaf + separator and its dynamic schema + `default`
 *                      leaf + separator, in the editor (also after a reload and an inspector edit) and the viewer
 * KNOWN PRODUCT BUG (kept red): a saved static options tree loads index-merged with the default tree (BRW-003 static).
 * Seeded apps are built through the components API (addCascadersViaApi) so the saved shapes are exact.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, releaseAndMakePublic, counterEvent, counterText,
 * expectCounter, visitDropdownApp, setToggleExpression, moveMouseAway, addCascadersViaApi, cascaderOption, schemaOption,
 * dynamicOptions,
 * openCascaderMenu, pickCascaderPath, expectCascaderDisplay, cascaderState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { cascaderSelector as S } from "Selectors/appBuilder/components/cascader";
import { cascaderText as T } from "Texts/appBuilder/components/cascader";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { visitDropdownApp } from "Support/utils/appBuilder/components/dropdownV2";
import { setToggleExpression } from "Support/utils/appBuilder/components/spinner";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addCascadersViaApi,
    cascaderOption,
    schemaOption,
    dynamicOptions,
    openCascaderMenu,
    pickCascaderPath,
    expectCascaderDisplay,
    cascaderState,
} from "Support/utils/appBuilder/components/cascader";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;
// dynamic: distinct option labels (fake.firstName is lowercase a-z only — safe inside a JSON string)
const words = (n) =>
    Cypress._.uniq(Array.from({ length: n * 5 }, () => fake.firstName).filter((w) => w.length >= 4)).slice(0, n);
const rowTexts = (s) => s.menu.options.map((o) => o.text);
const closeMenu = (name) => {
    cy.realPress('Escape'); // Cascader.tsx:246-249 — focus is on the combobox while the menu is open
    cascaderState(name, (s) => expect(s.menu, 'menu closed').to.eq(null));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Cascader — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Cascader-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — label, pathString and isValid observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'label', type: 'String', value: `"${T.defaultLabel}"` }, // source: cascader.js:417
                { key: 'pathString', type: 'String', value: '""' }, // no default leaf. source: cascader.js:367,419
                { key: 'isValid', type: 'Boolean', value: 'true' }, // source: cascader.js:372
            ], verifyNodeData);
        });
    });

    // ── Cascader-BRW-002 ─────────────────────────────────────────────────────
    // Cascader.tsx / useCascader.ts have no currentMode branch: UI select (selectLeafFromUI → onSelect), UI clear
    // (clearFromUI → onSelect), setValue(valid leaf → onSelect) and clearValue (no onSelect) — useCascader.ts:155-194.
    describe('editor ↔ viewer parity', () => {
        afterEach(() => {
            cy.apiLogin(); // the public pass logs out
            cy.apiDeleteApp();
        });

        it('[Cascader-BRW-002] Editor, preview, released app and public app agree on selection, events and actions', () => {
            const label = fake.firstName.slice(0, 10); // dynamic: widget label
            const slug = `cascader-parity-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            const D = T.defaultTree;
            const sep = T.defaultSeparator;
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Cascader-contexts-${Cypress._.uniqueId()}`);
            addCascadersViaApi([
                {
                    name: 'cs',
                    layout: { top: 40, left: 2, width: 14, height: 40 },
                    properties: { label: { value: label } },
                    events: [counterEvent(T.events.onSelect, 'selects'), counterEvent(T.events.onFocus, 'focuses')], // source: cascader.js:160-161
                },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 120, left: 2, width: 24, height: 40 },
                    properties: { text: { value: '{{JSON.stringify([components.cs.value, components.cs.pathString, components.cs.pathArray])}}' } },
                },
                counterText('selectcount', 'selects', { top: 180, left: 2 }),
                counterText('focuscount', 'focuses', { top: 180, left: 12 }),
                {
                    type: 'Button',
                    name: 'setbtn',
                    layout: { top: 40, left: 20, width: 6, height: 40 },
                    events: [
                        {
                            eventId: 'onClick',
                            actionId: 'control-component',
                            componentName: 'cs',
                            componentSpecificActionHandle: T.actions.setValue, // source: cascader.js:377
                            componentSpecificActionParams: [{ handle: 'value', value: 'japan' }], // default tree leaf. source: cascader.js:452
                        },
                    ],
                },
                {
                    type: 'Button',
                    name: 'clrbtn',
                    layout: { top: 40, left: 28, width: 6, height: 40 },
                    events: [
                        {
                            eventId: 'onClick',
                            actionId: 'control-component',
                            componentName: 'cs',
                            componentSpecificActionHandle: T.actions.clearValue, // source: cascader.js:382
                            componentSpecificActionParams: [],
                        },
                    ],
                },
            ]);

            const expectProbe = (value, pathString, pathArray) =>
                cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                    expect($el.text().trim(), 'exposed value, pathString, pathArray').to.eq(JSON.stringify([value, pathString, pathArray])));

            const expectParity = (context) => {
                cy.log(`parity — ${context}`);
                cy.get(S.label('cs')).should('contain.text', label);
                expectCascaderDisplay('cs', T.defaultPlaceholder); // source: cascader.js:418
                expectProbe(null, '', []);
                expectCounter('selectcount', 'selects', 0);
                expectCounter('focuscount', 'focuses', 0);

                // UI drilldown select → value / pathString, onFocus once, onSelect once
                openCascaderMenu('cs');
                expectCounter('focuscount', 'focuses', 1);
                pickCascaderPath(['asia', 'china', 'shanghai']); // source: cascader.js:436-450
                const shanghai = ['Asia', 'China', 'Shanghai'];
                expectCascaderDisplay('cs', shanghai.join(sep));
                expectProbe('shanghai', shanghai.join(sep), ['asia', 'china', 'shanghai']);
                expectCounter('selectcount', 'selects', 1);

                // UI clear → empty selection, onSelect again
                cy.get(S.clearButton('cs')).click();
                expectCascaderDisplay('cs', T.defaultPlaceholder);
                expectProbe(null, '', []);
                expectCounter('selectcount', 'selects', 2);

                // setValue CSA (valid leaf) → selection + onSelect
                cy.get(`${commonWidgetSelector.draggableWidget('setbtn')} button`).click();
                expectCascaderDisplay('cs', `${D.asia}${sep}${D.japan}`);
                expectProbe('japan', `${D.asia}${sep}${D.japan}`, ['asia', 'japan']);
                expectCounter('selectcount', 'selects', 3);

                // clearValue CSA → empty selection, no onSelect
                cy.get(`${commonWidgetSelector.draggableWidget('clrbtn')} button`).click();
                expectCascaderDisplay('cs', T.defaultPlaceholder);
                expectProbe(null, '', []);
                expectCounter('selectcount', 'selects', 3);
            };

            cy.openApp('', undefined, undefined, S.control('cs'));
            expectParity('editor canvas');

            visitDropdownApp(S.control('cs'));
            expectParity('preview');

            cy.then(() => releaseAndMakePublic(slug)); // its default appId argument must be read after the create
            visitDropdownApp(S.control('cs'), { path: `/applications/${slug}` });
            expectParity('released app');

            cy.apiLogout();
            cy.clearCookies();
            visitDropdownApp(S.control('cs'), { path: `/applications/${slug}` });
            expectParity('public app (signed out)');
        });
    });

    // ── Cascader-BRW-003 ─────────────────────────────────────────────────────
    // Static: properties.options tree + properties.value leaf (Cascader.tsx:107-121, advanced false); dynamic:
    // properties.data schema whose first visible `default: true` leaf is the selection (utils.ts:146-163
    // findDefaultValue, advanced true). Both join pathLabels with the saved pathSeparator (utils.ts:115-139).
    // The drilldown reopens on the selected leaf's level with an ` / ` breadcrumb (CascaderMenu.tsx:40-47,161-163).
    describe('saved app round-trip', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Cascader-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            moveMouseAway();
            cy.apiDeleteApp();
        });

        // KNOWN PRODUCT BUG (kept red): on load, a saved static `options` tree comes back index-merged with the
        // widget's default tree (cascader.js:434-479) — a saved node at the position of a default parent gains that
        // parent's children (here a1 gains Beijing/Shanghai) and default root nodes past the saved length are appended
        // (here Africa). The API GET of the app already returns the merged tree, so editor and viewer both show it.
        it('[Cascader-BRW-003] A saved static tree reloads exactly as saved with its default leaf and separator', () => {
            const [a, a1, a2, a2x, a2y, b] = words(6);
            const sep = ' > '; // dynamic: saved separator (multi-character, spaced)
            const staticTree = [
                cascaderOption(a, 'a', [cascaderOption(a1, 'a1'), cascaderOption(a2, 'a2', [cascaderOption(a2x, 'a2x'), cascaderOption(a2y, 'a2y')])]),
                cascaderOption(b, 'b'),
            ];
            addCascadersViaApi([
                {
                    name: 'csstatic',
                    layout: { top: 40, left: 2, width: 16, height: 40 },
                    properties: {
                        options: { value: staticTree },
                        value: { value: 'a2y' }, // nested default leaf. source: cascader.js:419 (Default value)
                        pathSeparator: { value: sep }, // source: cascader.js:420
                    },
                },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 120, left: 2, width: 30, height: 40 },
                    properties: { text: { value: '{{JSON.stringify([components.csstatic.value, components.csstatic.pathString])}}' } },
                },
            ]);

            const expectSaved = (context) => {
                cy.log(`saved static tree — ${context}`);
                expectCascaderDisplay('csstatic', [a, a2, a2y].join(sep));
                cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                    expect($el.text().trim(), 'exposed selection').to.eq(JSON.stringify(['a2y', [a, a2, a2y].join(sep)])));
                openCascaderMenu('csstatic');
                cascaderState('csstatic', (s) => {
                    expect(s.menu.header, 'breadcrumb to the default leaf').to.eq(`${a} / ${a2}`);
                    expect(rowTexts(s), 'default leaf level').to.deep.eq([a2x, a2y]);
                });
                cy.get(S.menuBack).click();
                cascaderState('csstatic', (s) => {
                    expect(rowTexts(s), 'second level').to.deep.eq([a1, a2]);
                    expect(s.menu.options.map((o) => o.isParent), 'a1 is a leaf, a2 a parent').to.deep.eq([false, true]);
                });
                cy.get(S.menuBack).click();
                cascaderState('csstatic', (s) => {
                    expect(rowTexts(s), 'saved roots only').to.deep.eq([a, b]);
                    expect(s.menu.options.map((o) => o.isParent), 'b is a leaf').to.deep.eq([true, false]);
                });
                closeMenu('csstatic');
            };

            cy.openApp('', undefined, undefined, S.control('csstatic'));
            expectSaved('editor canvas');
            visitDropdownApp(S.control('csstatic'));
            expectSaved('viewer');
        });

        it('[Cascader-BRW-003] A saved dynamic schema reloads with its default leaf and separator, and an inspector separator edit survives a reload', () => {
            const [d, d1, d2, e] = words(4);
            const sep = ' | '; // dynamic: saved separator
            const editedSep = '::'; // dynamic: separator typed in the inspector
            const schema = [
                schemaOption(d, 'd', [schemaOption(d1, 'd1'), schemaOption(d2, 'd2', null, { isDefault: true })]),
                schemaOption(e, 'e'),
            ];
            addCascadersViaApi([
                {
                    name: 'csdyn',
                    layout: { top: 40, left: 2, width: 16, height: 40 },
                    properties: {
                        ...dynamicOptions(schema), // Dynamic options + Schema. source: cascader.js:421-425
                        pathSeparator: { value: sep }, // source: cascader.js:420
                    },
                },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 120, left: 2, width: 30, height: 40 },
                    properties: { text: { value: '{{JSON.stringify([components.csdyn.value, components.csdyn.pathString])}}' } },
                },
            ]);

            const expectSaved = (context, s0 = sep) => {
                cy.log(`saved dynamic schema — ${context}`);
                expectCascaderDisplay('csdyn', [d, d2].join(s0));
                cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                    expect($el.text().trim(), 'exposed selection').to.eq(JSON.stringify(['d2', [d, d2].join(s0)])));
                openCascaderMenu('csdyn');
                cascaderState('csdyn', (s) => {
                    expect(s.menu.header, 'breadcrumb to the default leaf').to.eq(d);
                    expect(rowTexts(s), 'default leaf level').to.deep.eq([d1, d2]);
                });
                cy.get(S.menuBack).click();
                cascaderState('csdyn', (s) => {
                    expect(rowTexts(s), 'saved roots').to.deep.eq([d, e]);
                    expect(s.menu.options.map((o) => o.isParent)).to.deep.eq([true, false]);
                });
                closeMenu('csdyn');
                moveMouseAway();
            };

            cy.openApp('', undefined, undefined, S.control('csdyn'));
            expectSaved('editor canvas');
            cy.reload();
            cy.get(S.control('csdyn'), { timeout: 30000 }).should('be.visible');
            expectSaved('editor canvas after reload');
            visitDropdownApp(S.control('csdyn'));
            expectSaved('viewer');

            // an inspector edit of the separator is saved and survives a reload in the editor and the viewer
            cy.openApp('', undefined, undefined, S.control('csdyn'));
            cy.get(S.label('csdyn')).click();
            setToggleExpression('Path separator', editedSep); // source: cascader.js:64 displayName
            expectCascaderDisplay('csdyn', [d, d2].join(editedSep));
            cy.waitForAutoSave();
            cy.reload();
            cy.get(S.control('csdyn'), { timeout: 30000 }).should('be.visible');
            expectSaved('editor canvas after the separator edit', editedSep);
            visitDropdownApp(S.control('csdyn'));
            expectSaved('viewer after the separator edit', editedSep);
        });
    });
});
