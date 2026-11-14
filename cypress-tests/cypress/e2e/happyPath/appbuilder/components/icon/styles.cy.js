/**
 * SPEC — Icon — styles facet (painted geometry + colour).
 * FOR AI: TESTING.md browser scenario:
 *   Icon-BRW-002 — left/center/right alignment, default/none padding, slot aspect ratio and box shadow produce
 *                  the documented visible layout without clipping or overflow. The painted cursor (D-05,
 *                  Icon-EVT-002) and painted theme-token colour (D-08, Icon-STY-002) are assigned to the
 *                  same BRW-002 family by the Engineering scenarios, so they are measured here too.
 * Real layout boxes from the running app (viewer) on Icons seeded through the components API; one editor test
 * drives the Styles panel alignment buttons and measures the live canvas.
 * Sizing (Icon.jsx:123-124): wide slot (height-4 < width) → svg width:auto height:100%; tall slot → svg width =
 * widget width, height:auto, shrunk to the root by flex. Alignment → justify-content (Icon.jsx:106),
 * vertical centring align-items:center (D-06). Padding → RenderWidget inner box 2px / 0px (RenderWidget.jsx:343).
 * Helpers: addIconsViaApi, openIconAppInViewer, iconBoxes, hitTarget, counterEvent, resolveCssVarColor,
 * selectStyleSwitch, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { iconSelector } from "Selectors/appBuilder/components/icon";
import { iconText } from "Texts/appBuilder/components/icon";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { resolveCssVarColor, selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import {
    addIconsViaApi,
    openIconAppInViewer,
    iconBoxes,
    hitTarget,
    counterEvent,
} from "Support/utils/appBuilder/components/icon";

const T = iconText;
const PX = 0.6; // sub-pixel layout tolerance
const mid = (r, axis) => (axis === 'x' ? r.left + r.width / 2 : r.top + r.height / 2);

// glyph fully inside the RenderWidget box and the root never scrolls (no clipping / overflow)
const expectNoOverflow = (b, label) => {
    expect(b.svg.left, `${label}: svg left inside`).to.be.gte(b.box.left - PX);
    expect(b.svg.right, `${label}: svg right inside`).to.be.lte(b.box.right + PX);
    expect(b.svg.top, `${label}: svg top inside`).to.be.gte(b.box.top - PX);
    expect(b.svg.bottom, `${label}: svg bottom inside`).to.be.lte(b.box.bottom + PX);
    expect(b.rootScroll.sw, `${label}: no horizontal overflow`).to.be.lte(b.rootScroll.cw);
    expect(b.rootScroll.sh, `${label}: no vertical overflow`).to.be.lte(b.rootScroll.ch);
};

// testIsolation:false for cypress-real-dnd (the editor test drops a widget); each test creates its own app.
describe('Icon — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Icon-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Icon-BRW-002 — alignment in a wide slot ──────────────────────────────
    it('[Icon-BRW-002] Left / center / right alignment places the glyph at the matching edge of a wide slot', () => {
        const wide = { width: 10, height: 48 }; // dynamic: height-4 < width → wide branch (Icon.jsx:123)
        addIconsViaApi([
            { name: 'iconleft', layout: { top: 20, ...wide }, styles: { iconAlign: { value: T.alignLeft } } },
            { name: 'iconcenter', layout: { top: 100, ...wide } }, // default center. source: icon.js:161
            { name: 'iconright', layout: { top: 180, ...wide }, styles: { iconAlign: { value: T.alignRight } } },
        ]);
        openIconAppInViewer(iconSelector.svg('iconright'));

        const fillsHeight = (b, label) => {
            // height:100% of the root, width:auto → a square glyph as tall as the content box
            expect(b.svg.height, `${label}: fills the slot height`).to.be.closeTo(b.root.height, PX);
            expect(b.svg.width, `${label}: square glyph`).to.be.closeTo(b.svg.height, PX);
            expect(b.svg.top, `${label}: top-aligned with the root`).to.be.closeTo(b.root.top, PX);
            expect(b.root.width, `${label}: wide slot`).to.be.gt(b.svg.width * 3);
            expectNoOverflow(b, label);
        };
        iconBoxes('iconleft', (b) => {
            fillsHeight(b, 'left');
            expect(b.svg.left, 'left: glyph on the left edge').to.be.closeTo(b.root.left, PX);
        });
        iconBoxes('iconcenter', (b) => {
            fillsHeight(b, 'center');
            expect(mid(b.svg, 'x'), 'center: glyph centred').to.be.closeTo(mid(b.root, 'x'), PX);
        });
        iconBoxes('iconright', (b) => {
            fillsHeight(b, 'right');
            expect(b.svg.right, 'right: glyph on the right edge').to.be.closeTo(b.root.right, PX);
        });
    });

    // ── Icon-BRW-002 — tall slot (aspect branch) ─────────────────────────────
    it('[Icon-BRW-002] A tall slot sizes the glyph to the slot width, centres it vertically and never overflows', () => {
        const tall = { width: 2, height: 200 }; // dynamic: height-4 ≥ width → tall branch (Icon.jsx:123-124)
        addIconsViaApi([
            { name: 'talldefault', layout: { top: 20, left: 2, ...tall } },
            { name: 'tallright', layout: { top: 20, left: 8, ...tall }, styles: { iconAlign: { value: T.alignRight } } },
            { name: 'tallnone', layout: { top: 20, left: 14, ...tall }, styles: { padding: { value: T.paddingNone } } },
        ]);
        openIconAppInViewer(iconSelector.svg('tallnone'));

        ['talldefault', 'tallright', 'tallnone'].forEach((name) => {
            iconBoxes(name, (b) => {
                expect(b.root.height, `${name}: tall slot`).to.be.gt(b.root.width * 2);
                expect(b.svg.width, `${name}: glyph as wide as the content box`).to.be.closeTo(b.root.width, PX);
                expect(b.svg.height, `${name}: square glyph`).to.be.closeTo(b.svg.width, PX);
                expect(mid(b.svg, 'y'), `${name}: vertically centred (D-06)`).to.be.closeTo(mid(b.root, 'y'), PX);
                expect(b.svg.top - b.root.top, `${name}: free space above`).to.be.gt(20);
                expectNoOverflow(b, name);
            });
        });
    });

    // ── Icon-BRW-002 — padding ───────────────────────────────────────────────
    it('[Icon-BRW-002] Default padding insets the glyph by the box padding; none lets it touch the widget edge', () => {
        const layout = { width: 10, height: 48 }; // dynamic
        addIconsViaApi([
            { name: 'paddefault', layout: { top: 20, ...layout }, styles: { iconAlign: { value: T.alignLeft } } },
            {
                name: 'padnone',
                layout: { top: 100, ...layout },
                styles: { iconAlign: { value: T.alignLeft }, padding: { value: T.paddingNone } }, // source: icon.js:109
            },
        ]);
        openIconAppInViewer(iconSelector.svg('padnone'));

        iconBoxes('paddefault', (b) => {
            expect(b.boxPadding, 'default: box padding').to.eq(T.boxPadding);
            expect(b.svg.left - b.box.left, 'default: inset left').to.be.closeTo(T.boxPadding, PX);
            expect(b.svg.top - b.box.top, 'default: inset top').to.be.closeTo(T.boxPadding, PX);
            expect(b.svg.height, 'default: glyph = height − 2 × padding').to.be.closeTo(b.box.height - 2 * T.boxPadding, PX);
            expectNoOverflow(b, 'default');
        });
        iconBoxes('padnone', (b) => {
            expect(b.boxPadding, 'none: box padding').to.eq(0);
            expect(b.svg.left, 'none: glyph touches the left edge').to.be.closeTo(b.box.left, PX);
            expect(b.svg.top, 'none: glyph touches the top edge').to.be.closeTo(b.box.top, PX);
            expect(b.svg.height, 'none: glyph = full widget height').to.be.closeTo(b.box.height, PX);
            expectNoOverflow(b, 'none');
        });
    });

    // ── Icon-BRW-002 — box shadow ────────────────────────────────────────────
    it('[Icon-BRW-002] Box shadow paints on the Icon root and no ancestor box clips it', () => {
        const shadow = '4px 6px 8px 2px #ff0000'; // dynamic: test shadow
        addIconsViaApi([
            { name: 'shadowed', layout: { top: 40, left: 4 }, styles: { boxShadow: { value: shadow } } },
            { name: 'plain', layout: { top: 140, left: 4 } }, // default 0px 0px 0px 0px #00000040. source: icon.js:163
        ]);
        openIconAppInViewer(iconSelector.svg('shadowed'));

        iconBoxes('shadowed', (b) => {
            expect(b.boxShadow, 'configured shadow').to.eq('rgb(255, 0, 0) 4px 6px 8px 2px');
        });
        iconBoxes('plain', (b) => {
            expect(b.boxShadow, 'default shadow paints nothing').to.eq('rgba(0, 0, 0, 0.25) 0px 0px 0px 0px');
        });
        // the shadow spills outside the root: the RenderWidget box and the grid wrapper must not clip it
        cy.get(iconSelector.draggableWidget('shadowed')).should(($box) => {
            const win = $box[0].ownerDocument.defaultView;
            [$box[0], $box[0].parentElement].forEach((el, i) => {
                expect(win.getComputedStyle(el).overflow, `ancestor ${i} overflow`).to.eq('visible');
            });
        });
    });

    // ── Icon-BRW-002 family — painted colour (D-08 / Icon-STY-002) ───────────
    it('[Icon-BRW-002] The theme-token default paints the theme icon colour in light and dark mode; a literal colour paints itself', () => {
        addIconsViaApi([
            { name: 'tokenicon', layout: { top: 40, left: 4 } }, // var(--cc-default-icon). source: icon.js:160
            { name: 'redicon', layout: { top: 140, left: 4 }, styles: { iconColor: { value: '#ff0000' } } }, // dynamic
        ]);
        openIconAppInViewer(iconSelector.svg('tokenicon'));

        const expectPainted = (mode) => {
            resolveCssVarColor(T.defaultIconColorVar, iconSelector.root('tokenicon')).then((rgb) => {
                expect(rgb, `${mode}: token resolves`).to.match(/^rgb/);
                iconBoxes('tokenicon', (b) => {
                    expect(b.svgStrokeAttr, `${mode}: token never forwarded to stroke`).to.eq('currentColor');
                    expect(b.svgColor, `${mode}: svg colour = theme token`).to.eq(rgb);
                    expect(b.svgStroke, `${mode}: painted stroke = theme token`).to.eq(rgb);
                });
            });
            iconBoxes('redicon', (b) => {
                expect(b.svgStroke, `${mode}: literal colour painted`).to.eq('rgb(255, 0, 0)');
            });
        };

        expectPainted('light');
        resolveCssVarColor(T.defaultIconColorVar, iconSelector.root('tokenicon')).as('lightToken');

        // globalSettings.appMode drives the app's dark theme (AppCanvas `dark-theme`)
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(iconSelector.svg('tokenicon'), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
        expectPainted('dark');
        cy.get('@lightToken').then((light) => {
            iconBoxes('tokenicon', (b) => expect(b.svgStroke, 'dark repaints the token').to.not.eq(light));
        });
    });

    // ── Icon-BRW-002 family — painted cursor (D-05 / Icon-EVT-002) ───────────
    it('[Icon-BRW-002] A real pointer over an Icon with onClick shows the pointer cursor; an onHover-only Icon does not', () => {
        addIconsViaApi([
            { name: 'clickable', layout: { top: 40, left: 4 }, events: [counterEvent(T.eventOnClick, 'clicks')] },
            { name: 'hoveronly', layout: { top: 140, left: 4 }, events: [counterEvent(T.eventOnHover, 'hovers')] },
            { name: 'noevents', layout: { top: 240, left: 4 } },
        ]);
        openIconAppInViewer(iconSelector.svg('clickable'));

        const expectCursorAtGlyph = (name, cursor) =>
            hitTarget(iconSelector.svg(name)).then(({ el, cursor: painted }) => {
                expect(el.closest(iconSelector.root(name)), `${name}: pointer lands on the Icon`).to.not.eq(null);
                expect(painted, `${name}: cursor`).to.eq(cursor);
            });
        expectCursorAtGlyph('clickable', 'pointer');
        expectCursorAtGlyph('hoveronly', 'auto');
        expectCursorAtGlyph('noevents', 'auto');
        // the whole box beside the glyph shows it too (D-07 click target = root)
        iconBoxes('clickable', (b) => expect(b.cursor, 'root cursor').to.eq('pointer'));
    });

    // ── Icon-BRW-002 — alignment through the Styles panel (editor canvas) ────
    it('[Icon-BRW-002] Alignment picked in the Styles panel moves the glyph live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        cy.get(iconSelector.svg(W)).should('be.visible');

        iconBoxes(W, (b) => {
            expect(b.root.width, 'default drop is a wide slot').to.be.gt(b.svg.width * 2); // icon.js:7-8 5 × 48
            expect(mid(b.svg, 'x'), 'default center').to.be.closeTo(mid(b.root, 'x'), PX);
        });

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        // CodeBuilder AlignButtons → Radix toggle items `togglr-button-<left|center|right>`
        const pick = (align) => selectStyleSwitch(align);

        pick(T.alignRight);
        iconBoxes(W, (b) => {
            expect(b.justify, 'right → flex-end').to.eq('flex-end');
            expect(b.svg.right, 'right edge').to.be.closeTo(b.root.right, PX);
        });
        pick(T.alignLeft);
        iconBoxes(W, (b) => {
            expect(b.justify, 'left → flex-start').to.eq('flex-start');
            expect(b.svg.left, 'left edge').to.be.closeTo(b.root.left, PX);
        });
        pick(T.alignCenter);
        iconBoxes(W, (b) => expect(mid(b.svg, 'x'), 'back to centre').to.be.closeTo(mid(b.root, 'x'), PX));
    });
});
