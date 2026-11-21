/**
 * SPEC — Vertical Divider — styles facet (painted colour, dash pattern, shadow).
 * FOR AI: TESTING.md browser scenario:
 *   VerticalDivider-BRW-002 — a blank/default divider colour resolves through var(--cc-default-border) in light and
 *                             dark themes; at the narrow registered width the line is a centred full-height 1px line;
 *                             an authored dashed colour paints a downward repeating 4px dash / 4px gap gradient; the
 *                             configured shadow paints without being clipped and without corrupting neighbours.
 * The dropped-widget geometry half (editor canvas, resize) lives in canvas.cy.js. Here real layout boxes are read
 * from the running app (viewer) on dividers seeded through the components API; one editor test drives the
 * Styles panel. Blank colour → RenderWidget getDefaultStyles (debuggerSlice.js) substitutes the registered default
 * var(--cc-default-border) before VerticalDivider.jsx:7-8 sees it. Dash → VerticalDivider.jsx:20-26.
 * Chrome serialises `linear-gradient(to bottom, …)` without the default `to bottom` direction.
 * Helpers: addVerticalDividersViaApi, openDividerAppInViewer, dividerBoxes, dividerHitAt, expectCenteredLine,
 * lineShadowClip, resolveCssVarColor, selectStyleSwitch, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verticalDividerSelector } from "Selectors/appBuilder/components/verticalDivider";
import { verticalDividerText } from "Texts/appBuilder/components/verticalDivider";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { resolveCssVarColor, selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer, dividerBoxes, dividerHitAt } from "Support/utils/appBuilder/components/divider";
import {
    addVerticalDividersViaApi,
    expectCenteredLine,
    lineShadowClip,
} from "Support/utils/appBuilder/components/verticalDivider";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = verticalDividerText;
const PX = 0.6; // sub-pixel layout tolerance
const RED = '#ff0000'; // dynamic: authored colour
const RED_RGB = 'rgb(255, 0, 0)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
// downward 4px dash then transparent from 4px, tiled every 8px along y (VerticalDivider.jsx:22-24);
// Chrome drops the default `to bottom` direction from the computed value
const dashedGradient = (rgb) => `linear-gradient(${rgb} ${T.dashWidth}px, ${TRANSPARENT} ${T.dashGap}px)`;
const shortText = () => fake.fullName.slice(0, 10).trim();
// one registered grid column (verticalDivider.js:7)
const NARROW = { width: T.defaultGridWidth, height: 80 }; // dynamic: test height

// testIsolation:false for cypress-real-dnd (the editor test drops a widget); each test creates its own app.
describe('Vertical Divider — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-VerticalDivider-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── VerticalDivider-BRW-002 — theme colour + narrow geometry ────────────
    it('[VerticalDivider-BRW-002] A default or blank colour paints var(--cc-default-border) as a centred full-height 1px line in light and dark mode; an authored colour paints itself', () => {
        addVerticalDividersViaApi([
            { name: 'tokendivider', layout: { top: 40, left: 4, ...NARROW } }, // source: verticalDivider.js:110
            {
                name: 'blankdivider',
                layout: { top: 40, left: 10, ...NARROW },
                styles: { dividerColor: { value: '' } }, // dynamic: blank → registered default (verticalDivider.js:57)
            },
            {
                name: 'reddivider',
                layout: { top: 40, left: 16, ...NARROW },
                styles: { dividerColor: { value: RED } },
            },
        ]);
        openDividerAppInViewer(verticalDividerSelector.root('reddivider'));

        const expectPainted = (mode) => {
            resolveCssVarColor(T.defaultBorderVar, verticalDividerSelector.root('tokendivider')).then((rgb) => {
                expect(rgb, `${mode}: token resolves`).to.match(/^rgb/);
                ['tokendivider', 'blankdivider'].forEach((name) =>
                    dividerBoxes(name, (b) => {
                        expectCenteredLine(b, `${mode}: ${name}`);
                        expect(b.lines[0].bgColor, `${mode}: ${name} paints the theme border token`).to.eq(rgb);
                        expect(b.lines[0].bgImage, `${mode}: ${name} solid`).to.eq('none');
                    })
                );
            });
            dividerBoxes('reddivider', (b) => {
                expectCenteredLine(b, `${mode}: reddivider`);
                expect(b.lines[0].bgColor, `${mode}: literal colour`).to.eq(RED_RGB);
            });
        };

        expectPainted('light');
        resolveCssVarColor(T.defaultBorderVar, verticalDividerSelector.root('tokendivider')).as('lightToken');

        // globalSettings.appMode drives the app's dark theme (AppCanvas `dark-theme`)
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(verticalDividerSelector.root('reddivider'), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
        expectPainted('dark');
        cy.get('@lightToken').then((light) => {
            ['tokendivider', 'blankdivider'].forEach((name) =>
                dividerBoxes(name, (b) => expect(b.lines[0].bgColor, `${name}: dark repaints the token`).to.not.eq(light))
            );
        });
    });

    // ── VerticalDivider-BRW-002 — dash pattern ───────────────────────────────
    it('[VerticalDivider-BRW-002] Dashed style paints the authored colour as a downward repeating 4px dash / 4px gap', () => {
        const dashed = { dividerStyle: { value: T.styleDashed }, dividerColor: { value: RED } };
        addVerticalDividersViaApi([
            { name: 'dashnarrow', layout: { top: 40, left: 4, ...NARROW }, styles: dashed },
            { name: 'dashwide', layout: { top: 40, left: 10, width: 4, height: 160 }, styles: dashed }, // dynamic: wider + taller
            { name: 'solidred', layout: { top: 40, left: 20, ...NARROW }, styles: { dividerColor: { value: RED } } },
        ]);
        openDividerAppInViewer(verticalDividerSelector.root('solidred'));

        ['dashnarrow', 'dashwide'].forEach((name) =>
            dividerBoxes(name, (b) => {
                expectCenteredLine(b, name);
                const [l] = b.lines;
                expect(l.bgImage, `${name}: downward dash gradient in the authored colour`).to.eq(dashedGradient(RED_RGB));
                expect(l.bgSize, `${name}: 1px × (4px dash + 4px gap) tile`).to.eq(`${T.lineWidth}px ${T.dashWidth + T.dashGap}px`);
                expect(l.bgRepeat, `${name}: repeats along y only`).to.eq('repeat-y');
                expect(l.bgColor, `${name}: gaps transparent`).to.eq(TRANSPARENT);
                expect(l.height, `${name}: spans several dashes`).to.be.gt((T.dashWidth + T.dashGap) * 5);
            })
        );
        dividerBoxes('solidred', (b) => {
            expect(b.lines[0].bgImage, 'solid: no gradient').to.eq('none');
            expect(b.lines[0].bgColor, 'solid: authored colour').to.eq(RED_RGB);
        });
    });

    // ── VerticalDivider-BRW-002 — shadow ─────────────────────────────────────
    it('[VerticalDivider-BRW-002] Box shadow paints on the line without being clipped, and neighbouring components keep their place, content and pointer', () => {
        const shadow = '3px 4px 6px 1px #ff0000'; // dynamic: test shadow
        const leftText = shortText();
        const rightText = shortText();
        addVerticalDividersViaApi([
            {
                type: 'Text',
                name: 'leftneighbour',
                layout: { top: 40, left: 4, width: 4, height: 40 }, // dynamic: directly left of the divider
                properties: { text: { value: leftText } },
            },
            {
                name: 'shadowed',
                layout: { top: 40, left: 4 + (4 * 100) / 43, ...NARROW }, // dynamic: next grid column
                styles: { boxShadow: { value: shadow } },
            },
            {
                type: 'Text',
                name: 'rightneighbour',
                layout: { top: 40, left: 4 + (5 * 100) / 43, width: 4, height: 40 }, // dynamic: directly right
                properties: { text: { value: rightText } },
            },
            { name: 'plain', layout: { top: 160, left: 4, ...NARROW } }, // source: verticalDivider.js:113 default
        ]);
        openDividerAppInViewer(verticalDividerSelector.root('shadowed'));

        dividerBoxes('shadowed', (b) => {
            expectCenteredLine(b, 'shadowed');
            expect(b.lines[0].boxShadow, 'line shadow').to.eq('rgb(255, 0, 0) 3px 4px 6px 1px');
        });
        dividerBoxes('plain', (b) =>
            expect(b.lines[0].boxShadow, 'default shadow paints nothing').to.eq(T.defaultShadowComputed)
        );
        // no ancestor with overflow other than visible cuts the shadow's painted extent
        lineShadowClip('shadowed').then((s) => {
            expect(s.extent.bottom, 'shadow reaches below the line').to.be.gt(s.line.bottom);
            expect(s.clippedBy, `shadow ${s.shadow} not clipped by any ancestor`).to.deep.eq([]);
        });
        // probe sensitivity: the shadow reaches past the widget box, so a clipping box would be reported
        cy.get(verticalDividerSelector.draggableWidget('shadowed')).first().invoke('css', 'overflow', 'hidden');
        lineShadowClip('shadowed').then((s) =>
            expect(s.clippedBy.map((c) => c.cy), 'probe detects a clipping box').to.include('draggable-widget-shadowed')
        );
        cy.get(verticalDividerSelector.draggableWidget('shadowed')).first().invoke('css', 'overflow', '');
        // neighbours: laid out at their own slots beside the divider, text intact, and they take the pointer
        cy.get(verticalDividerSelector.draggableWidget('shadowed')).then(($d) => {
            const dr = $d[0].getBoundingClientRect();
            cy.get(commonWidgetSelector.draggableWidget('leftneighbour')).should(($n) => {
                const nr = $n[0].getBoundingClientRect();
                expect(nr.right, 'left neighbour ends before the divider').to.be.lte(dr.left + PX);
                expect($n.text().trim(), 'left neighbour text intact').to.eq(leftText);
            });
            cy.get(commonWidgetSelector.draggableWidget('rightneighbour')).should(($n) => {
                const nr = $n[0].getBoundingClientRect();
                expect(nr.left, 'right neighbour starts after the divider').to.be.gte(dr.right - PX);
                expect($n.text().trim(), 'right neighbour text intact').to.eq(rightText);
            });
        });
        ['leftneighbour', 'rightneighbour'].forEach((name) =>
            dividerHitAt(commonWidgetSelector.draggableWidget(name), 0.5, 0.5).then((hit) =>
                expect(hit.insideSelector, `${name} receives the pointer (hit ${hit.tag})`).to.eq(true)
            )
        );
    });

    // ── VerticalDivider-BRW-002 — Styles panel drives the live editor canvas ─
    it('[VerticalDivider-BRW-002] Switching Style to Dashed in the Styles panel repaints the line live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
        resolveCssVarColor(T.defaultBorderVar, verticalDividerSelector.root(W)).then((rgb) => {
            dividerBoxes(W, (b) => {
                expectCenteredLine(b, 'default');
                expect(b.lines[0].bgImage, 'default solid').to.eq('none');
                expect(b.lines[0].bgColor, 'default token colour').to.eq(rgb);
            });

            openEditorSidebar(W);
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectStyleSwitch(T.styleDashed);
            dividerBoxes(W, (b) => {
                expectCenteredLine(b, 'dashed');
                expect(b.lines[0].bgImage, 'dashed token gradient').to.eq(dashedGradient(rgb));
                expect(b.lines[0].bgRepeat, 'dashed: repeat-y').to.eq('repeat-y');
                expect(b.lines[0].bgColor, 'dashed: gaps transparent').to.eq(TRANSPARENT);
            });
            selectStyleSwitch(T.styleSolid);
            dividerBoxes(W, (b) => {
                expect(b.lines[0].bgImage, 'back to solid').to.eq('none');
                expect(b.lines[0].bgColor, 'solid token colour').to.eq(rgb);
            });
        });
    });
});
