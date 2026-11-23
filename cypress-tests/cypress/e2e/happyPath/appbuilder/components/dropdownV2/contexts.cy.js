/**
 * SPEC — Dropdown (DropdownV2) — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenarios:
 *   DropdownV2-BRW-001 — editor canvas, preview, released app and public app agree on the saved configuration,
 *                        selection, search, validation, events and actions
 *   DropdownV2-BRW-003 — saved showOnDesktop / showOnMobile gate the widget independently in the editor's
 *                        desktop/mobile canvases and the viewer's desktop/mobile layouts
 *   DropdownV2-BRW-007 — a saved styles.justifyContent (runtime-only, no inspector control) still aligns the
 *                        selected value in the editor and the viewer
 * Seeded apps are built through the components API (addDropdownsViaApi) so the saved shapes are exact.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, switchLayout, releaseAndMakePublic,
 * counterEvent, counterText, expectCounter, addDropdownsViaApi, dropdownOptions, visitDropdownApp,
 * getDropdownComponentId, openDropdownMenu, closeDropdownMenu, pickDropdownOption, searchDropdownMenu,
 * expectDropdownValue, dropdownState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dropdownV2Selector as S } from "Selectors/appBuilder/components/dropdownV2";
import { dropdownV2Text as T } from "Texts/appBuilder/components/dropdownV2";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addDropdownsViaApi,
    dropdownOptions,
    visitDropdownApp,
    getDropdownComponentId,
    openDropdownMenu,
    closeDropdownMenu,
    pickDropdownOption,
    searchDropdownMenu,
    expectDropdownValue,
    dropdownState,
} from "Support/utils/appBuilder/components/dropdownV2";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;
const ON = { value: '{{true}}' };
const OFF = { value: '{{false}}' };
// dynamic: distinct option labels (fake.firstName is lowercase a-z only)
const words = (n) =>
    Cypress._.uniq(Array.from({ length: n * 4 }, () => fake.firstName).filter((w) => w.length >= 4)).slice(0, n);

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Dropdown (DropdownV2) — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-contexts-${Cypress._.uniqueId()}`);
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

        it('exposed-value context — value and label observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'value', type: 'String', value: '"2"' }, // default option2 value. source: dropdownV2.js:420
                { key: 'label', type: 'String', value: '"Select"' }, // source: dropdownV2.js:436
            ], verifyNodeData);
        });
    });

    // ── DropdownV2-BRW-001 ───────────────────────────────────────────────────
    // RenderWidget passes currentMode through; DropdownV2.jsx has no mode branch, so selection (onChange
    // :578-591), search (filterOption :593-600), mandatory validation (componentsSlice validate), onSelect and the
    // selectOption action (:170-176) must behave the same in every execution surface.
    describe('editor ↔ viewer parity', () => {
        afterEach(() => {
            cy.apiLogin(); // the public pass logs out
            cy.apiDeleteApp();
        });

        it('[DropdownV2-BRW-001] Editor, preview, released app and public app agree on selection, search, validation, events and actions', () => {
            const labels = words(3);
            const label = fake.firstName.slice(0, 10); // dynamic: widget label
            const slug = `ddv2-parity-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-contexts-${Cypress._.uniqueId()}`);
            addDropdownsViaApi([
                {
                    name: 'dd',
                    layout: { top: 40, left: 2, width: 12, height: 40 },
                    properties: { label: { value: label }, options: dropdownOptions(labels, labels[0]) },
                    validation: { mandatory: ON }, // source: dropdownV2.js:15
                    events: [counterEvent('onSelect', 'selects')], // source: dropdownV2.js:160
                },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 120, left: 2, width: 20, height: 40 },
                    properties: { text: { value: '{{JSON.stringify([components.dd.value, components.dd.searchText, components.dd.isValid])}}' } },
                },
                counterText('selectcount', 'selects', { top: 180, left: 2 }),
                {
                    type: 'Button',
                    name: 'pickbtn',
                    layout: { top: 40, left: 20, width: 6, height: 40 },
                    events: [
                        {
                            eventId: 'onClick',
                            actionId: 'control-component',
                            componentName: 'dd',
                            componentSpecificActionHandle: 'selectOption', // source: dropdownV2.js:369
                            componentSpecificActionParams: [{ handle: 'select', value: labels[2] }],
                        },
                    ],
                },
            ]);

            const expectProbe = (value, search, valid) =>
                cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                    expect($el.text().trim(), 'exposed value, searchText, isValid').to.eq(JSON.stringify([value, search, valid])));

            const expectParity = (context) => {
                cy.log(`parity — ${context}`);
                cy.get(S.label('dd')).should('contain.text', label).and('contain.text', '*');
                // saved default
                expectDropdownValue('dd', labels[0]);
                expectProbe(labels[0], '', true);
                expectCounter('selectcount', 'selects', 0);

                // search filters by label and exposes searchText
                const needle = labels[1];
                openDropdownMenu('dd');
                searchDropdownMenu(needle);
                expectProbe(labels[0], needle, true);
                dropdownState('dd', (s) => {
                    expect(s.menu.options.map((o) => o.text), 'filtered options').to.deep.eq(labels.filter((l) => l.includes(needle)));
                });
                // selection → value, onSelect, search reset (D-14)
                pickDropdownOption(labels[1]);
                expectDropdownValue('dd', labels[1]);
                expectProbe(labels[1], '', true);
                expectCounter('selectcount', 'selects', 1);

                // clearing a mandatory Dropdown → validation error
                cy.get(S.clearButton('dd')).click();
                cy.get('body').then(($body) => {
                    if ($body.find(S.menuList).length) closeDropdownMenu('dd');
                });
                expectDropdownValue('dd', T.defaultPlaceholder); // source: dropdownV2.js:439
                expectProbe(null, '', false);
                expectCounter('selectcount', 'selects', 2);
                getDropdownComponentId('dd').then((id) => {
                    cy.get(S.validationError(id)).should('have.text', T.errorMandatory);
                });
                cy.get(S.combobox('dd')).should('have.attr', 'aria-invalid', 'true');

                // selectOption action → value, onSelect, valid again
                cy.get(`${commonWidgetSelector.draggableWidget('pickbtn')} button`).click();
                expectDropdownValue('dd', labels[2]);
                expectProbe(labels[2], '', true);
                expectCounter('selectcount', 'selects', 3);
                cy.get(S.combobox('dd')).should('have.attr', 'aria-invalid', 'false');
                getDropdownComponentId('dd').then((id) => {
                    cy.get('body').should(($body) => {
                        const err = $body.find(S.validationError(id));
                        expect(err.length ? err.text() : '', 'validation error cleared').to.eq('');
                    });
                });
            };

            cy.openApp('', undefined, undefined, S.field('dd'));
            expectParity('editor canvas');

            visitDropdownApp(S.field('dd'));
            expectParity('preview');

            cy.then(() => releaseAndMakePublic(slug)); // its default appId argument must be read after the create
            visitDropdownApp(S.field('dd'), { path: `/applications/${slug}` });
            expectParity('released app');

            cy.apiLogout();
            cy.clearCookies();
            visitDropdownApp(S.field('dd'), { path: `/applications/${slug}` });
            expectParity('public app (signed out)');
        });
    });

    // ── DropdownV2-BRW-003 ───────────────────────────────────────────────────
    // WidgetWrapper reads the resolved others.showOnDesktop / showOnMobile (dropdownV2.js:11-12, defaults :395-396)
    // and renders nothing when the flag for the active layout is falsy.
    describe('saved device combinations', () => {
        const DEVICES = [
            { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
            { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
            { name: 'bothdevices', others: { showOnMobile: ON } },
            { name: 'nodevice', others: { showOnDesktop: OFF } },
        ];
        const EXPECTED = {
            desktop: { desktoponly: true, mobileonly: false, bothdevices: true, nodevice: false },
            mobile: { desktoponly: false, mobileonly: true, bothdevices: true, nodevice: false },
        };
        const expectDeviceSet = (layout, context) => {
            cy.log(`device gates — ${context} (${layout})`);
            cy.get(S.field('bothdevices'), { timeout: 30000 }).should('be.visible');
            Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
                if (shown) {
                    cy.get(S.field(name)).should('be.visible');
                    expectDropdownValue(name, T.option2); // default option2. source: dropdownV2.js:424
                } else {
                    cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
                }
            });
            // the gated widget still works on this layout
            openDropdownMenu('bothdevices');
            pickDropdownOption(T.option3);
            expectDropdownValue('bothdevices', T.option3);
        };

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-contexts-${Cypress._.uniqueId()}`);
            addDropdownsViaApi(
                DEVICES.map(({ name, others }, i) => ({
                    name,
                    others,
                    layout: { top: 40 + i * 60, left: 2, width: 12, height: 40 }, // dynamic: stacked slots
                }))
            );
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[DropdownV2-BRW-003] Saved device flags gate the Dropdown independently on the editor and viewer desktop and mobile layouts', () => {
            cy.openApp('', undefined, undefined, S.field('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            visitDropdownApp(S.field('bothdevices'));
            expectDeviceSet('desktop', 'viewer');
            visitDropdownApp(S.field('bothdevices'), { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'viewer');
        });
    });

    // ── DropdownV2-BRW-007 ───────────────────────────────────────────────────
    // DropdownV2.jsx:96,421-428 spreads styles.justifyContent into the react-select ValueContainer although the
    // current registration (dropdownV2.js:180-360) has no such style (D-15: keep it for saved apps, e.g. the
    // ones Form generation wrote — FormUtils.js:155-157).
    describe('saved value alignment', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-contexts-${Cypress._.uniqueId()}`);
            addDropdownsViaApi([
                { name: 'ddend', layout: { top: 40, left: 2, width: 14, height: 40 }, styles: { justifyContent: { value: 'flex-end' } } },
                { name: 'ddcenter', layout: { top: 100, left: 2, width: 14, height: 40 }, styles: { justifyContent: { value: 'center' } } },
                { name: 'ddplain', layout: { top: 160, left: 2, width: 14, height: 40 } }, // no saved key → start
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const contentBox = (v) => ({ left: v.container.left + v.paddingLeft, right: v.container.right - v.paddingRight });
        const expectAligned = (context) => {
            cy.log(`alignment — ${context}`);
            dropdownState('ddend', (s) => {
                expect(s.value.justifyContent, 'ddend justify-content').to.eq('flex-end');
                expect(s.value.inner.right, 'ddend value hugs the right edge').to.be.closeTo(contentBox(s.value).right, 1);
                expect(s.value.inner.left, 'ddend value is not at the left edge').to.be.gt(contentBox(s.value).left + 20);
            });
            dropdownState('ddcenter', (s) => {
                const c = contentBox(s.value);
                expect(s.value.justifyContent, 'ddcenter justify-content').to.eq('center');
                expect((s.value.inner.left + s.value.inner.right) / 2, 'ddcenter value centred').to.be.closeTo((c.left + c.right) / 2, 1);
            });
            dropdownState('ddplain', (s) => {
                expect(s.value.inner.left, 'ddplain value starts at the left edge').to.be.closeTo(contentBox(s.value).left, 1);
            });
        };

        it('[DropdownV2-BRW-007] A saved justifyContent still aligns the selected value in the editor and the viewer', () => {
            cy.openApp('', undefined, undefined, S.field('ddend'));
            expectAligned('editor canvas, default selection');
            // a different (wider/narrower) selection keeps the saved alignment
            openDropdownMenu('ddend');
            pickDropdownOption(T.option1);
            openDropdownMenu('ddcenter');
            pickDropdownOption(T.option3);
            expectAligned('editor canvas, new selection');

            visitDropdownApp(S.field('ddend'));
            expectAligned('viewer, default selection');
            openDropdownMenu('ddend');
            pickDropdownOption(T.option3);
            expectAligned('viewer, new selection');
        });
    });
});
