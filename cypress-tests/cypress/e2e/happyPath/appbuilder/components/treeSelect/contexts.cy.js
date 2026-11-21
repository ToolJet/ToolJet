/**
 * SPEC — Tree Select — contexts facet.
 * FOR AI: always-on device contexts (Show on desktop / Show on mobile vs Visibility across the editor, preview and
 * released app; the exposed `checked` / `expanded` values in each context), plus the responsive half of TESTING.md
 * browser scenario:
 *   TreeSelect-QA-001 — desktop/mobile visibility is correct in the editor and the released viewer, and dynamic
 *                       height applies only in a running app (preview + released, desktop and mobile layouts): there
 *                       the tree measures its real rows and the sibling below reflows; the editor canvas keeps the
 *                       authored height and scrolls (TreeSelect.jsx:73 `currentMode === 'view'`).
 * (Reflow / collapse / scrolling details in canvas.cy.js; padding in styles.cy.js; focus order in userflow.cy.js.)
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: TreeSelect.jsx:443 sets the `.custom-checkbox-tree` root display:none (the RenderWidget box stays).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, releaseAndMakePublic,
 * addTreeSelectsViaApi, openTreeAppInViewer, treeBoxes, expectHugsTree, expectAuthoredTree, expectStackedBelow.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { treeSelectSelector } from "Selectors/appBuilder/components/treeSelect";
import { treeSelectText } from "Texts/appBuilder/components/treeSelect";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { expectStackedBelow } from "Support/utils/appBuilder/components/timeline";
import {
    addTreeSelectsViaApi,
    openTreeAppInViewer,
    treeBoxes,
    expectHugsTree,
    expectAuthoredTree,
} from "Support/utils/appBuilder/components/treeSelect";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = treeSelectText;
const W = T.defaultWidgetName;
const OFF = { value: '{{false}}' }; // treeSelect.js:321-322 toggle values
const ON = { value: '{{true}}' };
const GAP = 10; // dynamic: authored gap between the tree and the Text under it
const AUTHORED = 150; // dynamic: authored tree height (px) — shorter than the default tree's six rows
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — treeSelect.js:11-12, defaults
// treeSelect.js:321-322; properties.visibility — treeSelect.js:83-88, default treeSelect.js:341)
const DEVICE_WIDGETS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // device flags on everywhere but visibility off: rendered on both layouts, never shown
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
    // visibility on cannot override a device flag that is off
    { name: 'visiblenomobile', others: {}, properties: { visibility: ON } },
];
// shown = rendered + displayed; hidden = rendered, root display:none; absent = not rendered at all
const EXPECTED = {
    desktop: {
        desktoponly: 'shown', mobileonly: 'absent', bothdevices: 'shown', nodevice: 'absent',
        hiddenboth: 'hidden', visiblenomobile: 'shown',
    },
    mobile: {
        desktoponly: 'absent', mobileonly: 'shown', bothdevices: 'shown', nodevice: 'absent',
        hiddenboth: 'hidden', visiblenomobile: 'absent',
    },
};
const expectState = (name, state) => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    treeBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.rootDisplay, `${name}: root displayed`).to.eq('block');
            expect(b.root.height, `${name}: root painted`).to.be.gt(0);
            expect(b.titles, `${name}: default rows`).to.deep.eq(T.defaultTopTitles);
            expect(b.nodes[0].rect.height, `${name}: first row painted`).to.be.gt(0);
        } else {
            expect(b.rootDisplay, `${name}: root hidden by visibility`).to.eq('none');
            expect(b.root.height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const probeText = (name, context, expected) =>
    cy
        .get(commonWidgetSelector.draggableWidget(name), { timeout: 30000 })
        .should(($el) => expect($el.text().trim(), `${context}: ${name}`).to.eq(expected));
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(treeSelectSelector.root('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};
const visitPhone = (slug) => {
    cy.viewport(390, 844); // dynamic: phone viewport
    cy.visit(`/applications/${slug}`, {
        onBeforeLoad(win) {
            Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
        },
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Tree Select — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TreeSelect-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Tree Select on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown');

            // Visibility off: still rendered on the desktop canvas (the device flag is on), but not shown
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');

            // Visibility back on, desktop off → gone from desktop
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown');
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still absent on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    describe('saved apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TreeSelect-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── TreeSelect-QA-001: responsive visibility ─────────────────────────
        it('[TreeSelect-QA-001] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `treeselect-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addTreeSelectsViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    // dynamic: stacked rows so each widget keeps its own slot on the narrower mobile grid too
                    layout: { top: 40 + i * 210, left: 2, width: 20, height: 200 },
                }))
            );

            // editor canvas
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('bothdevices'));
            closeQueryPanel(); // a seeded app keeps the remembered open panel, which covers the lower trees
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openTreeAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openTreeAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectDeviceSet('desktop', 'released app');
            visitPhone(slug);
            expectDeviceSet('mobile', 'released app (phone)');
        });

        // Exposed value context: TreeSelect seeds checked / expanded on mount (useTreeSelect.js:189-228) and updates
        // them on every check (useTreeSelect.js:231-245). The Text depends on nothing but the Tree Select.
        it('The exposed checked and expanded values resolve in a binding in the editor and the running app, and follow a real click', () => {
            const probe = (checked, expanded) => `${JSON.stringify(checked)}|${JSON.stringify(expanded)}`;
            addTreeSelectsViaApi([
                { name: 'tsvalue', layout: { top: 40, left: 2, width: 12, height: 200 } },
                {
                    type: 'Text',
                    name: 'treeprobe',
                    layout: { top: 260, left: 2, width: 30, height: 40 },
                    properties: {
                        text: { value: '{{JSON.stringify(components.tsvalue.checked) + "|" + JSON.stringify(components.tsvalue.expanded)}}' },
                    },
                },
            ]);
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('treeprobe'));
            probeText('treeprobe', 'editor', probe(T.defaultChecked, T.defaultExpanded));

            openTreeAppInViewer(treeSelectSelector.root('tsvalue'));
            probeText('treeprobe', 'viewer', probe(T.defaultChecked, T.defaultExpanded));
            // uncheck Japan: Japan and its ancestor Asia leave the selection (cascade, TreeSelect.jsx:205-211)
            cy.get(treeSelectSelector.nodes('tsvalue'))
                .filter((_, li) => li.querySelector(':scope > .rct-text .rct-title').textContent.trim() === 'Japan')
                .find('.rct-title > div')
                .realClick({ scrollBehavior: false });
            probeText(
                'treeprobe',
                'viewer after unchecking Japan',
                probe(T.defaultChecked.filter((v) => !['asia', 'japan'].includes(v)), T.defaultExpanded)
            );
        });

        // ── TreeSelect-QA-001: editor vs running app, desktop vs mobile ──────
        it('[TreeSelect-QA-001] Dynamic height measures the real rows in preview and the released app on desktop and mobile, while the editor canvas keeps the authored height and scrolls', () => {
            const slug = `treeselect-dynamic-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            const both = { showOnDesktop: ON, showOnMobile: ON };
            addTreeSelectsViaApi([
                {
                    name: 'tsdyn',
                    layout: { top: 40, left: 2, width: 15, height: AUTHORED },
                    mobileLayout: { width: 40 }, // dynamic: full-width on the mobile grid
                    others: both,
                    properties: { dynamicHeight: ON },
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 15, height: 40 },
                    mobileLayout: { width: 40 },
                    others: both,
                    properties: { text: { value: word() } },
                },
            ]);
            const expectGrown = (context) => {
                treeBoxes('tsdyn', (b) => {
                    expect(b.titles, `${context}: rows`).to.deep.eq(T.defaultTopTitles);
                    expectHugsTree(b, context);
                    expect(b.wrapper.height, `${context}: grew past the authored height`).to.be.gt(AUTHORED);
                });
                expectStackedBelow('tsdyn', 'below', GAP, context);
            };
            const expectAuthored = (context) => {
                treeBoxes('tsdyn', (b) => {
                    expectAuthoredTree(b, AUTHORED, context);
                    expect(b.scrollHeight, `${context}: rows scroll inside`).to.be.gt(b.clientHeight);
                });
                expectStackedBelow('tsdyn', 'below', GAP, context);
            };

            // editor canvas, both layouts: authored height, the rows scroll
            cy.openApp('', undefined, undefined, treeSelectSelector.root('tsdyn'));
            expectAuthored('editor desktop');
            switchLayout('mobile');
            expectAuthored('editor mobile');
            switchLayout('desktop');

            // preview, both layouts
            openTreeAppInViewer(treeSelectSelector.root('tsdyn'));
            expectGrown('preview desktop');
            openTreeAppInViewer(treeSelectSelector.root('tsdyn'), { query: '&layout=mobile' });
            expectGrown('preview mobile');

            // released app, desktop screen and phone
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectGrown('released desktop');
            visitPhone(slug);
            expectGrown('released phone');
        });
    });
});
