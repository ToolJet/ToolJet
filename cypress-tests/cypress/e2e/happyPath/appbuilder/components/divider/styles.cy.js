/**
 * SPEC — Horizontal Divider — styles facet (painted colour, dash pattern, constrained-width label layout, shadow).
 * FOR AI: TESTING.md browser scenario:
 *   Divider-BRW-002 — a blank/default divider colour resolves through var(--cc-default-border) in light and dark
 *                     themes; an authored dashed colour paints a rightward repeating 4px dash / 4px gap gradient;
 *                     long labels wrap or ellipsize per mode/alignment without overlapping the lines; lines keep
 *                     their 10% minimum width; overflow is clipped inside the widget; the configured shadow paints
 *                     on the label and line pieces without corrupting neighbouring components.
 * All inputs are styles (dividerColor / dividerStyle / labelAlignment / textWrap / boxShadow), so the whole
 * scenario lives here (constrained-width geometry included). Real layout boxes are read from the running app
 * (viewer) on dividers seeded through the components API; one editor test drives the Styles panel.
 * Blank colour → RenderWidget getDefaultStyles (debuggerSlice.js:74-85) substitutes the registered default
 * var(--cc-default-border) before Divider.jsx:10-11 sees it. Dash → Divider.jsx:21-29. Label → Divider.jsx:37-52.
 * Helpers: addDividersViaApi, openDividerAppInViewer, dividerBoxes, dividerHitAt, resolveCssVarColor,
 * selectStyleSwitch, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dividerSelector } from "Selectors/appBuilder/components/divider";
import { dividerText } from "Texts/appBuilder/components/divider";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { resolveCssVarColor, selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import {
    addDividersViaApi,
    openDividerAppInViewer,
    dividerBoxes,
    dividerHitAt,
} from "Support/utils/appBuilder/components/divider";

const T = dividerText;
const PX = 0.6; // sub-pixel layout tolerance
const RED = '#ff0000'; // dynamic: authored colour
const RED_RGB = 'rgb(255, 0, 0)';
const TRANSPARENT = 'rgba(0, 0, 0, 0)';
// rightward 4px dash then transparent from 4px, tiled every 8px along x (Divider.jsx:23-25)
const dashedGradient = (rgb) => `linear-gradient(to right, ${rgb} ${T.dashWidth}px, ${TRANSPARENT} ${T.dashGap}px)`;
const mid = (r) => r.left + r.width / 2;
// ≥ 12 words — always longer than a narrow slot can hold on one line
const longLabel = () => Array.from({ length: 4 }, () => fake.randomSentence).join(' ');
const shortText = () => fake.fullName.slice(0, 10).trim();

// every painted piece inside the root horizontally; label and lines side by side, never overlapping
const expectNoOverlap = (b, label) => {
    const pieces = [...b.lines, b.label].sort((x, y) => x.left - y.left);
    pieces.forEach((p, i) => {
        expect(p.left, `${label}: piece ${i} left inside root`).to.be.gte(b.root.left - PX);
        expect(p.right, `${label}: piece ${i} right inside root`).to.be.lte(b.root.right + PX);
        if (i > 0) expect(p.left, `${label}: piece ${i} starts after piece ${i - 1}`).to.be.gte(pieces[i - 1].right - PX);
    });
};
// every line keeps min-width 10% of its flex container (Divider.jsx:20)
const expectLineMinWidth = (b, label) => {
    expect(b.lines.length, `${label}: lines`).to.be.gte(1);
    b.lines.forEach((l, i) => {
        expect(l.width, `${label}: line ${i} ≥ 10%`).to.be.gte(l.parentWidth * T.lineMinWidthShare - PX);
        expect(l.height, `${label}: line ${i} hairline`).to.eq(1);
    });
};

// testIsolation:false for cypress-real-dnd (the editor test drops a widget); each test creates its own app.
describe('Horizontal Divider — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Divider-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Divider-BRW-002 — theme colour ───────────────────────────────────────
    it('[Divider-BRW-002] A default or blank divider colour paints var(--cc-default-border) in light and dark mode; an authored colour paints itself', () => {
        addDividersViaApi([
            { name: 'tokendivider', layout: { top: 40, left: 4, width: 10, height: 20 } }, // source: divider.js:154
            {
                name: 'blankdivider',
                layout: { top: 100, left: 4, width: 10, height: 20 },
                styles: { dividerColor: { value: '' } }, // dynamic: blank → registered default (divider.js:64)
            },
            {
                name: 'reddivider',
                layout: { top: 160, left: 4, width: 10, height: 20 },
                styles: { dividerColor: { value: RED } },
            },
        ]);
        openDividerAppInViewer(dividerSelector.root('reddivider'));

        const expectPainted = (mode) => {
            resolveCssVarColor(T.defaultBorderVar, dividerSelector.root('tokendivider')).then((rgb) => {
                expect(rgb, `${mode}: token resolves`).to.match(/^rgb/);
                ['tokendivider', 'blankdivider'].forEach((name) =>
                    dividerBoxes(name, (b) => {
                        expect(b.lines, `${name}: one line`).to.have.length(1);
                        expect(b.lines[0].bgColor, `${mode}: ${name} paints the theme border token`).to.eq(rgb);
                    })
                );
            });
            dividerBoxes('reddivider', (b) => expect(b.lines[0].bgColor, `${mode}: literal colour`).to.eq(RED_RGB));
        };

        expectPainted('light');
        resolveCssVarColor(T.defaultBorderVar, dividerSelector.root('tokendivider')).as('lightToken');

        // globalSettings.appMode drives the app's dark theme (AppCanvas `dark-theme`)
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        cy.reload();
        cy.get(dividerSelector.root('reddivider'), { timeout: 30000 }).should('be.visible');
        cy.get('.dark-theme').should('exist');
        expectPainted('dark');
        cy.get('@lightToken').then((light) => {
            ['tokendivider', 'blankdivider'].forEach((name) =>
                dividerBoxes(name, (b) => expect(b.lines[0].bgColor, `${name}: dark repaints the token`).to.not.eq(light))
            );
        });
    });

    // ── Divider-BRW-002 — dash pattern ───────────────────────────────────────
    it('[Divider-BRW-002] Dashed style paints the authored colour as a rightward repeating 4px dash / 4px gap on every line', () => {
        const dashed = { dividerStyle: { value: T.styleDashed }, dividerColor: { value: RED } };
        addDividersViaApi([
            { name: 'dashplain', layout: { top: 40, left: 4, width: 12, height: 20 }, styles: dashed },
            {
                name: 'dashlabel',
                layout: { top: 100, left: 4, width: 12, height: 30 },
                properties: { label: { value: shortText() } },
                styles: dashed, // default center → two lines (divider.js:155)
            },
            { name: 'solidred', layout: { top: 160, left: 4, width: 12, height: 20 }, styles: { dividerColor: { value: RED } } },
        ]);
        openDividerAppInViewer(dividerSelector.root('solidred'));

        ['dashplain', 'dashlabel'].forEach((name) =>
            dividerBoxes(name, (b) => {
                expect(b.lines, `${name}: line count`).to.have.length(name === 'dashlabel' ? 2 : 1);
                b.lines.forEach((l, i) => {
                    expect(l.bgImage, `${name} line ${i}: rightward dash gradient`).to.eq(dashedGradient(RED_RGB));
                    expect(l.bgSize, `${name} line ${i}: 4px dash + 4px gap tile`).to.eq(`${T.dashWidth + T.dashGap}px 1px`);
                    expect(l.bgRepeat, `${name} line ${i}: repeats along x only`).to.eq('repeat-x');
                    expect(l.bgColor, `${name} line ${i}: gaps transparent`).to.eq(TRANSPARENT);
                    expect(l.width, `${name} line ${i}: spans several dashes`).to.be.gt((T.dashWidth + T.dashGap) * 3);
                });
            })
        );
        dividerBoxes('solidred', (b) => {
            expect(b.lines[0].bgImage, 'solid: no gradient').to.eq('none');
            expect(b.lines[0].bgColor, 'solid: authored colour').to.eq(RED_RGB);
        });
    });

    // ── Divider-BRW-002 — long label, wrap mode ──────────────────────────────
    it('[Divider-BRW-002] Wrap mode wraps a long label onto several lines beside the divider lines for left, center and right', () => {
        const long = longLabel();
        const narrow = { width: 6, height: 40 }; // dynamic: constrained width
        addDividersViaApi(
            [T.alignLeft, T.alignCenter, T.alignRight].map((align, i) => ({
                name: `wrap${align}`,
                layout: { top: 40 + i * 80, left: 4, ...narrow },
                properties: { label: { value: long } },
                styles: { labelAlignment: { value: align }, textWrap: { value: T.wrap } },
            }))
        );
        openDividerAppInViewer(dividerSelector.label(`wrap${T.alignRight}`));

        dividerBoxes(`wrap${T.alignLeft}`, (b) => {
            expect(b.label.whiteSpace, 'left: wraps').to.eq('normal');
            expect(b.label.lineCount, 'left: several text lines').to.be.gt(1);
            expect(b.label.left, 'left: label at the left edge').to.be.closeTo(b.root.left, PX);
            expect(b.lines[0].right, 'left: line runs to the right edge').to.be.closeTo(b.root.right, PX);
            expectNoOverlap(b, 'left');
            expectLineMinWidth(b, 'left');
        });
        dividerBoxes(`wrap${T.alignCenter}`, (b) => {
            expect(b.label.lineCount, 'center: several text lines').to.be.gt(1);
            expect(b.lines, 'center: a line on each side').to.have.length(2);
            expect(mid(b.label), 'center: label centred').to.be.closeTo(mid(b.root), 1);
            expectNoOverlap(b, 'center');
            expectLineMinWidth(b, 'center');
        });
        dividerBoxes(`wrap${T.alignRight}`, (b) => {
            expect(b.label.lineCount, 'right: several text lines').to.be.gt(1);
            expect(b.label.right, 'right: label at the right edge').to.be.closeTo(b.root.right, PX);
            expect(b.lines[0].left, 'right: line starts at the left edge').to.be.closeTo(b.root.left, PX);
            expectNoOverlap(b, 'right');
            expectLineMinWidth(b, 'right');
        });
    });

    // ── Divider-BRW-002 — long label, no-wrap mode ───────────────────────────
    it('[Divider-BRW-002] No-wrap mode keeps a long label on one ellipsized line capped at 90% (side) / 80% (center)', () => {
        const long = longLabel();
        const narrow = { width: 6, height: 40 }; // dynamic: constrained width
        addDividersViaApi(
            [T.alignLeft, T.alignCenter, T.alignRight].map((align, i) => ({
                name: `nowrap${align}`,
                layout: { top: 40 + i * 80, left: 4, ...narrow },
                properties: { label: { value: long } },
                styles: { labelAlignment: { value: align }, textWrap: { value: T.noWrap } },
            }))
        );
        openDividerAppInViewer(dividerSelector.label(`nowrap${T.alignRight}`));

        [
            [T.alignLeft, T.noWrapMaxShareSide],
            [T.alignCenter, T.noWrapMaxShareCenter],
            [T.alignRight, T.noWrapMaxShareSide],
        ].forEach(([align, share]) =>
            dividerBoxes(`nowrap${align}`, (b) => {
                expect(b.label.whiteSpace, `${align}: no wrap`).to.eq('nowrap');
                expect(b.label.textOverflow, `${align}: ellipsis`).to.eq('ellipsis');
                expect(b.label.overflow, `${align}: label clips its text`).to.eq('hidden');
                expect(b.label.lineCount, `${align}: single text line`).to.eq(1);
                expect(b.label.height, `${align}: one 16px line box`).to.eq(T.labelLineHeight);
                expect(b.label.scrollWidth, `${align}: text truncated`).to.be.gt(b.label.clientWidth);
                expect(b.label.width, `${align}: capped at ${share * 100}%`).to.be.closeTo(b.label.parentWidth * share, 1);
                expectNoOverlap(b, align);
                expectLineMinWidth(b, align);
            })
        );
    });

    // ── Divider-BRW-002 — clipping + neighbours ──────────────────────────────
    // KNOWN PRODUCT BUG: in wrap mode a single word wider than the narrow slot (here `exercitationem`) is not broken,
    // so the label and divider lines spill past the widget's edges instead of staying inside it.
    it('[Divider-BRW-002] A wrapped label taller than the widget is clipped inside it and never covers the neighbouring component', () => {
        const long = 'Ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam'; // dynamic: fixed label with one long word
        addDividersViaApi([
            {
                name: 'cliplabel',
                layout: { top: 40, left: 4, width: 3, height: 20 }, // dynamic: narrow + short slot
                properties: { label: { value: long } },
            },
            {
                type: 'Text',
                name: 'neighbour',
                layout: { top: 64, left: 4, width: 3, height: 40 }, // dynamic: right below the divider
                properties: { text: { value: shortText() } },
            },
        ]);
        openDividerAppInViewer(dividerSelector.label('cliplabel'));

        dividerBoxes('cliplabel', (b) => {
            expect(b.rootOverflow, 'root clips').to.eq('hidden');
            expect(b.label.lineCount, 'label wraps').to.be.gt(2);
            expect(b.label.bottom, 'label box extends past the widget').to.be.gt(b.box.bottom);
            expectNoOverlap(b, 'clip');
            expectLineMinWidth(b, 'clip');
        });
        // the overflowing part of the label is not painted / hit outside the widget: the neighbour stays on top
        dividerHitAt(commonWidgetSelector.draggableWidget('neighbour'), 0.5, 0.2).then((hit) => {
            expect(hit.insideSelector, `neighbour receives the pointer (hit ${hit.tag} "${hit.text}")`).to.eq(true);
        });
        // and just above the divider nothing of it is hit either
        cy.get(dividerSelector.draggableWidget('cliplabel')).then(($box) => {
            const r = $box[0].getBoundingClientRect();
            const doc = $box[0].ownerDocument;
            const el = doc.elementFromPoint(r.left + r.width / 2, r.top - 4);
            expect(!!el && $box[0].contains(el), 'nothing of the label above the widget').to.eq(false);
        });
    });

    // ── Divider-BRW-002 — shadow ─────────────────────────────────────────────
    it('[Divider-BRW-002] Box shadow paints on the label and both lines, and a neighbouring component keeps its place and content', () => {
        const shadow = '4px 6px 8px 2px #ff0000'; // dynamic: test shadow
        const neighbourText = shortText();
        addDividersViaApi([
            {
                name: 'shadowed',
                layout: { top: 40, left: 4, width: 12, height: 30 },
                properties: { label: { value: shortText() } },
                styles: { boxShadow: { value: shadow } },
            },
            { name: 'plain', layout: { top: 120, left: 4, width: 12, height: 30 } }, // source: divider.js:160 default
            {
                type: 'Text',
                name: 'neighbour',
                layout: { top: 72, left: 4, width: 12, height: 40 }, // dynamic: directly below the shadowed divider
                properties: { text: { value: neighbourText } },
            },
        ]);
        openDividerAppInViewer(dividerSelector.label('shadowed'));

        dividerBoxes('shadowed', (b) => {
            expect(b.lines, 'center label → two lines').to.have.length(2);
            expect(b.label.boxShadow, 'label shadow').to.eq('rgb(255, 0, 0) 4px 6px 8px 2px');
            b.lines.forEach((l, i) => expect(l.boxShadow, `line ${i} shadow`).to.eq('rgb(255, 0, 0) 4px 6px 8px 2px'));
            expectNoOverlap(b, 'shadow');
        });
        dividerBoxes('plain', (b) =>
            expect(b.lines[0].boxShadow, 'default shadow paints nothing').to.eq('rgba(0, 0, 0, 0.25) 0px 0px 0px 0px')
        );
        // neighbour: laid out at its own slot, text intact, and it — not the divider — takes the pointer
        cy.get(dividerSelector.draggableWidget('shadowed')).then(($d) => {
            const dr = $d[0].getBoundingClientRect();
            cy.get(commonWidgetSelector.draggableWidget('neighbour')).should(($n) => {
                const nr = $n[0].getBoundingClientRect();
                expect(nr.top, 'neighbour below the divider').to.be.gte(dr.bottom - PX);
                expect($n.text().trim(), 'neighbour text intact').to.eq(neighbourText);
            });
        });
        dividerHitAt(commonWidgetSelector.draggableWidget('neighbour'), 0.5, 0.5).then((hit) =>
            expect(hit.insideSelector, `neighbour receives the pointer (hit ${hit.tag})`).to.eq(true)
        );
    });

    // ── Divider-BRW-002 — Styles panel drives the live editor canvas ─────────
    it('[Divider-BRW-002] Switching Style to Dashed in the Styles panel repaints the line live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        resolveCssVarColor(T.defaultBorderVar, dividerSelector.root(W)).then((rgb) => {
            dividerBoxes(W, (b) => {
                expect(b.lines[0].bgImage, 'default solid').to.eq('none');
                expect(b.lines[0].bgColor, 'default token colour').to.eq(rgb);
            });

            openEditorSidebar(W);
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectStyleSwitch(T.styleDashed);
            dividerBoxes(W, (b) => {
                expect(b.lines[0].bgImage, 'dashed token gradient').to.eq(dashedGradient(rgb));
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
