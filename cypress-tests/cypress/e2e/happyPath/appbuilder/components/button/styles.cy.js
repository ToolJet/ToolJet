/**
 * SPEC — Button — styles facet (painted look in a real browser).
 * FOR AI: TESTING.md browser scenarios (frontend/ee/test/app-builder/widgets/Button/TESTING.md):
 *   Button-BRW-001 — Solid renders filled; Outline renders transparent with a border (viewer + the Type switch in the editor)
 *   Button-BRW-002 — background/text/border/loader colours (incl. the #16637 theme-token defaults) paint as configured
 *   Button-BRW-003 — Font size and weight render on the label
 *   Button-BRW-004 — Left/Center/Right content alignment positions the label + icon (both icon directions)
 *   Button-BRW-005 — the Icon color paints on the icon
 *   Button-BRW-006 — border radius rounds the painted corners; box shadow renders on Solid only
 *   Button-BRW-007 — hover background: Auto darkens the background, Manual paints the configured colour, Solid only
 *   Button-BRW-008 — padding None removes the 2px box padding (and the button grows to fill the box)
 * Buttons are seeded through the components API (addButtonsViaApi, button.js definition defaults merged) and checked
 * in the viewer with getComputedStyle, real rects, elementFromPoint and real CDP hover. Theme tokens are resolved
 * in-page with a probe element (resolveCssVarColor), never hard-coded.
 * Helpers: addButtonsViaApi, buttonBoxes, pointerAway, openIconAppInViewer, resolveCssVarColor, expectComputedColor,
 * openEditorSidebar, selectStyleSwitch.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { buttonSelector } from "Selectors/appBuilder/components/button";
import { buttonText } from "Texts/appBuilder/components/button";
import { addButtonsViaApi, buttonBoxes, pointerAway } from "Support/utils/appBuilder/components/button";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor, expectComputedColor, selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import { openEditorSidebar } from "Support/utils/commonWidget";

const T = buttonText;
const SEL = buttonSelector;

const expectCss = (selector, expected) =>
    cy.get(selector).first().should(($el) => {
        const cs = $el[0].ownerDocument.defaultView.getComputedStyle($el[0]);
        const actual = {};
        Object.keys(expected).forEach((prop) => {
            actual[prop] = cs.getPropertyValue(prop);
        });
        expect(actual, selector).to.deep.eq(expected);
    });

// `elementFromPoint` at (dx, dy) px inside the element's top-left corner → is the hit inside the <button>?
const cornerHitsButton = (name, d) =>
    cy.get(SEL.button(name)).first().then(($b) => {
        const doc = $b[0].ownerDocument;
        const r = $b[0].getBoundingClientRect();
        const el = doc.elementFromPoint(r.left + d, r.top + d);
        return !!(el && el.closest(SEL.button(name)));
    });

const label = () => fake.firstName.slice(0, 8); // dynamic: short label so every layout fits on one line

describe('Button — styles facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Button-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Button-BRW-001 ───────────────────────────────────────────────────────
    // Button.jsx:75-82 computedBgColor: Solid → backgroundColor, Outline → 'transparent'; theme.scss:3059 `.jet-btn`
    // gives both a 1px solid border painted in borderColor (Button.jsx:113).
    it('[Button-BRW-001] Solid renders a filled button; Outline renders transparent with a border', () => {
        addButtonsViaApi([
            { name: 'solid', layout: { top: 40, left: 2 } }, // type default primary. source: button.js:326
            { name: 'outline', layout: { top: 120, left: 2 }, styles: { type: { value: T.typeOutline } } },
        ]);
        openIconAppInViewer(SEL.button('outline'));
        pointerAway();

        resolveCssVarColor(T.brandTokenVar, SEL.button('solid')).then((brandRgb) => {
            expect(brandRgb, 'brand token is an opaque colour').to.match(/^rgb\(/);
            // Solid: filled with the brand colour, 1px solid brand border
            expectCss(SEL.button('solid'), {
                'background-color': brandRgb,
                'border-top-style': 'solid',
                'border-top-width': `${T.borderWidth}px`,
                'border-top-color': brandRgb,
            });
            // Outline: no fill, the same 1px solid brand border
            expectCss(SEL.button('outline'), {
                'background-color': T.transparent,
                'border-top-style': 'solid',
                'border-top-width': `${T.borderWidth}px`,
                'border-top-color': brandRgb,
            });
        });
    });

    it('[Button-BRW-001] The Type switch in the editor flips the canvas button between filled and outlined', () => {
        addButtonsViaApi([{ name: 'button1', layout: { top: 40, left: 2 } }]);
        cy.openApp('', undefined, undefined, SEL.button('button1'));

        pointerAway();
        resolveCssVarColor(T.brandTokenVar, SEL.button('button1')).then((brandRgb) => {
            expectComputedColor(SEL.button('button1'), 'background-color', brandRgb);

            openEditorSidebar('button1');
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectStyleSwitch(T.typeOutline); // source: button.js:80
            cy.forceClickOnCanvas();
            expectCss(SEL.button('button1'), {
                'background-color': T.transparent,
                'border-top-style': 'solid',
                'border-top-color': brandRgb,
            });

            openEditorSidebar('button1');
            cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
            selectStyleSwitch(T.typeSolid); // source: button.js:79
            cy.forceClickOnCanvas();
            pointerAway(); // selecting the widget leaves the real pointer on it → :hover paint
            expectComputedColor(SEL.button('button1'), 'background-color', brandRgb);
        });
    });

    // ── Button-BRW-002 ───────────────────────────────────────────────────────
    // Defaults (#16637, git fa8cd0dca0): background + border = --cc-primary-brand, text + loader = --cc-surface1-surface
    // (button.js:312-317). Loader: Button.jsx:290 <Loader color> → Loader.jsx:20 svg `color` attribute.
    it('[Button-BRW-002] Default colours paint the #16637 theme tokens on the button, label and loader', () => {
        addButtonsViaApi([
            { name: 'button1', layout: { top: 40, left: 2 } },
            { name: 'loading', layout: { top: 120, left: 2 }, properties: { loadingState: { value: '{{true}}' } } },
        ]);
        openIconAppInViewer(SEL.button('button1'));
        pointerAway();

        resolveCssVarColor(T.brandTokenVar, SEL.button('button1')).then((brandRgb) => {
            resolveCssVarColor(T.surfaceTokenVar, SEL.button('button1')).then((surfaceRgb) => {
                expect(surfaceRgb, 'text token contrasts with the brand fill').not.to.eq(brandRgb);
                expectCss(SEL.button('button1'), { 'background-color': brandRgb, 'border-top-color': brandRgb });
                expectComputedColor(SEL.label('button1'), 'color', surfaceRgb);
                cy.get(SEL.loaderSvg('loading')).should('have.length', 1);
                expectComputedColor(SEL.loaderSvg('loading'), 'color', surfaceRgb);
                expectCss(SEL.button('loading'), { 'background-color': brandRgb });
            });
        });
    });

    it('[Button-BRW-002] Configured background, text, border and loader colours paint as authored', () => {
        // dynamic: four distinct test colours (none is a legacy sentinel — Button.jsx:64-82)
        const bg = '#2e7d32';
        const text = '#ffeb3b';
        const border = '#d81b60';
        const loader = '#00acc1';
        const colours = {
            backgroundColor: { value: bg },
            textColor: { value: text },
            borderColor: { value: border },
            loaderColor: { value: loader },
        };
        addButtonsViaApi([
            { name: 'button1', layout: { top: 40, left: 2 }, properties: { text: { value: label() } }, styles: colours },
            {
                name: 'loading',
                layout: { top: 120, left: 2 },
                properties: { loadingState: { value: '{{true}}' } },
                styles: colours,
            },
        ]);
        openIconAppInViewer(SEL.button('button1'));
        pointerAway();

        expectCss(SEL.button('button1'), {
            'background-color': 'rgb(46, 125, 50)',
            'border-top-color': 'rgb(216, 27, 96)',
            'border-bottom-color': 'rgb(216, 27, 96)',
        });
        expectComputedColor(SEL.label('button1'), 'color', 'rgb(255, 235, 59)');
        // the loader paints the loader colour, not the text colour it would otherwise inherit
        expectComputedColor(SEL.loaderSvg('loading'), 'color', 'rgb(0, 172, 193)');
        expectCss(SEL.button('loading'), { 'background-color': 'rgb(46, 125, 50)' });
    });

    it('[Button-BRW-002] A pre-#16637 saved text colour #FFFFFF follows the theme: on-solid for Solid, primary text for Outline', () => {
        // the pre-#16637 default (git fa8cd0dca0) is a sentinel: Button.jsx:70-71
        const legacyText = { textColor: { value: '#FFFFFF' } };
        addButtonsViaApi([
            { name: 'solid', layout: { top: 40, left: 2 }, styles: legacyText },
            { name: 'outline', layout: { top: 120, left: 2 }, styles: { ...legacyText, type: { value: T.typeOutline } } },
        ]);
        openIconAppInViewer(SEL.button('outline'));

        resolveCssVarColor('--text-on-solid', SEL.button('solid')).then((onSolid) =>
            expectComputedColor(SEL.label('solid'), 'color', onSolid)
        );
        resolveCssVarColor('--cc-primary-text', SEL.button('outline')).then((primaryText) => {
            expect(primaryText, 'outline text is not white-on-transparent').not.to.eq('rgb(255, 255, 255)');
            expectComputedColor(SEL.label('outline'), 'color', primaryText);
        });
    });

    // ── Button-BRW-003 ───────────────────────────────────────────────────────
    // Button.jsx:90-95,258-261: font-size = textSize px, line-height = 1.42 × size, weight `medium` → 500.
    it('[Button-BRW-003] Font size and weight render on the label', () => {
        const text = label();
        const cases = [
            { name: 'normal', size: T.defaultTextSize, weight: 'normal', expectWeight: T.fontWeights.normal },
            { name: 'medium', size: 20, weight: 'medium', expectWeight: T.fontWeights.medium }, // dynamic: size
            { name: 'bold', size: 20, weight: 'bold', expectWeight: T.fontWeights.bold }, // dynamic: size
            { name: 'small', size: 10, weight: 'normal', expectWeight: T.fontWeights.normal }, // dynamic: size
        ];
        addButtonsViaApi(
            cases.map((c, i) => ({
                name: c.name,
                layout: { top: 40 + i * 70, left: 2, width: 12, height: 60 },
                properties: { text: { value: text } },
                styles: { textSize: { value: `{{${c.size}}}` }, fontWeight: { value: c.weight } },
            }))
        );
        openIconAppInViewer(SEL.label('small'));

        cases.forEach((c) => {
            expectCss(SEL.label(c.name), {
                'font-size': `${c.size}px`,
                'line-height': `${+(c.size * T.lineHeightRatio).toFixed(2)}px`,
                'font-weight': c.expectWeight,
            });
        });
        // Glyph widths are only comparable once every label paints in its own web-font face. The faces are
        // font-display: swap (theme.scss @font-face), so a weight the page has not used yet (700 here) paints in the
        // fallback font until its file arrives — on a cold CI browser the bold label was measured in that narrower
        // fallback. Load each label's exact face first, then measure (retrying).
        const labelFonts = ($labels) => [...$labels].map((el) => el.ownerDocument.defaultView.getComputedStyle(el).font);
        cy.get(cases.map((c) => SEL.label(c.name)).join(', ')).then(($labels) => {
            const fonts = labelFonts($labels);
            return Promise.all(fonts.map((font) => $labels[0].ownerDocument.fonts.load(font)));
        });
        cy.get(cases.map((c) => SEL.label(c.name)).join(', ')).should(($labels) => {
            const fonts = $labels[0].ownerDocument.fonts;
            labelFonts($labels).forEach((font) => expect(fonts.check(font), `web font loaded for "${font}"`).to.eq(true));
        });
        // the rendered glyphs follow: same text is wider at 20px than at 14px, and wider in bold than medium
        cy.document().should((doc) => {
            const rect = (name) => doc.querySelector(SEL.label(name)).getBoundingClientRect();
            const w = (name) => rect(name).width;
            expect(w('medium'), '20px label wider than 14px').to.be.gt(w('normal'));
            expect(w('normal'), '14px label wider than 10px').to.be.gt(w('small'));
            expect(w('bold'), 'bold wider than medium at the same size').to.be.gt(w('medium'));
            expect(rect('medium').height, '20px line box').to.be.closeTo(20 * T.lineHeightRatio, 0.5);
        });
    });

    // ── Button-BRW-004 ───────────────────────────────────────────────────────
    // Button.jsx:96-102,240-247: content row is `row-reverse` for direction left (icon first), and alignment maps
    // left/right to flex-end/flex-start accordingly so the group still sits on the visual left/right. Content box =
    // button minus 1px border + 12px padding (Button.jsx:115).
    it('[Button-BRW-004] Content alignment positions the label and icon group (icon left, icon right, no icon)', () => {
        const text = label();
        const aligns = [T.alignLeft, T.alignCenter, T.alignRight];
        const variants = [
            { key: 'iconleft', styles: { iconVisibility: { value: true }, direction: { value: T.directionLeft } } },
            { key: 'iconright', styles: { iconVisibility: { value: true }, direction: { value: T.directionRight } } },
            { key: 'noicon', styles: {} },
        ];
        const items = [];
        variants.forEach((v, row) =>
            aligns.forEach((align, col) =>
                items.push({
                    name: `${v.key}${align}`,
                    layout: { top: 40 + row * 70, left: 1 + col * 14, width: 12, height: 40 },
                    properties: { text: { value: text } },
                    styles: { ...v.styles, contentAlignment: { value: align } },
                })
            )
        );
        addButtonsViaApi(items);
        openIconAppInViewer(SEL.icon('iconrightright'));

        const inset = T.borderWidth + T.horizontalPadding;
        const mid = (a, b) => (a + b) / 2;
        variants.forEach((v) =>
            aligns.forEach((align) => {
                const name = `${v.key}${align}`;
                buttonBoxes(name, (b) => {
                    expect(b.label, `${name}: label rendered`).to.not.equal(null);
                    const parts = v.key === 'noicon' ? [b.label] : [b.icon, b.label];
                    if (v.key !== 'noicon') {
                        expect(b.icon, `${name}: icon rendered`).to.not.equal(null);
                        if (v.key === 'iconleft') expect(b.icon.right, `${name}: icon before label`).to.be.lte(b.label.left + 0.5);
                        if (v.key === 'iconright') expect(b.label.right, `${name}: label before icon`).to.be.lte(b.icon.left + 0.5);
                    } else {
                        expect(b.icon, `${name}: no icon`).to.equal(null);
                    }
                    const groupLeft = Math.min(...parts.map((p) => p.left));
                    const groupRight = Math.max(...parts.map((p) => p.right));
                    if (align === T.alignLeft) {
                        expect(groupLeft, `${name}: group at the content start`).to.be.closeTo(b.button.left + inset, 1.5);
                    }
                    if (align === T.alignCenter) {
                        expect(mid(groupLeft, groupRight), `${name}: group centred`).to.be.closeTo(mid(b.button.left, b.button.right), 1.5);
                    }
                    if (align === T.alignRight) {
                        expect(groupRight, `${name}: group at the content end`).to.be.closeTo(b.button.right - inset, 1.5);
                    }
                });
            })
        );
    });

    // ── Button-BRW-005 ───────────────────────────────────────────────────────
    // Button.jsx:64-65,275-281: TablerIcon style.color = iconColor (stroke="currentColor"); default token
    // --cc-surface1-surface (#16637, button.js:320); the legacy #FFFFFF on Outline falls back to --icons-strong.
    it('[Button-BRW-005] The configured icon colour paints on the rendered icon', () => {
        const iconColor = '#8e24aa'; // dynamic: test colour → rgb(142, 36, 170)
        const iconOn = { iconVisibility: { value: true } };
        addButtonsViaApi([
            { name: 'default', layout: { top: 40, left: 2 }, styles: iconOn },
            { name: 'custom', layout: { top: 120, left: 2 }, styles: { ...iconOn, iconColor: { value: iconColor } } },
            {
                name: 'outline',
                layout: { top: 200, left: 2 },
                styles: { ...iconOn, iconColor: { value: iconColor }, type: { value: T.typeOutline } },
            },
            {
                name: 'legacy',
                layout: { top: 280, left: 2 },
                styles: { ...iconOn, iconColor: { value: '#FFFFFF' }, type: { value: T.typeOutline } },
            },
        ]);
        openIconAppInViewer(SEL.icon('legacy'));

        const expectIconPaint = (name, rgb) => {
            expectComputedColor(SEL.icon(name), 'color', rgb);
            // the glyph strokes in currentColor → the painted stroke is the icon colour
            expectComputedColor(`${SEL.icon(name)} path:not([stroke="none"])`, 'stroke', rgb);
        };
        resolveCssVarColor(T.surfaceTokenVar, SEL.button('default')).then((surfaceRgb) => {
            expectIconPaint('default', surfaceRgb);
        });
        expectIconPaint('custom', 'rgb(142, 36, 170)');
        expectIconPaint('outline', 'rgb(142, 36, 170)');
        resolveCssVarColor('--icons-strong', SEL.button('legacy')).then((strongRgb) => {
            expect(strongRgb, 'legacy outline icon is not white-on-transparent').not.to.eq('rgb(255, 255, 255)');
            expectIconPaint('legacy', strongRgb);
        });
    });

    // ── Button-BRW-006 ───────────────────────────────────────────────────────
    // Button.jsx:108 borderRadius px; Button.jsx:114 boxShadow only when type == 'primary'.
    it('[Button-BRW-006] Border radius rounds the painted corners', () => {
        addButtonsViaApi([
            { name: 'square', layout: { top: 40, left: 2, height: 60 }, styles: { borderRadius: { value: '{{0}}' } } },
            { name: 'round', layout: { top: 120, left: 2, height: 60 }, styles: { borderRadius: { value: '{{20}}' } } },
        ]);
        openIconAppInViewer(SEL.button('round'));
        pointerAway();

        expectCss(SEL.button('square'), { 'border-top-left-radius': '0px', 'border-bottom-right-radius': '0px' });
        expectCss(SEL.button('round'), { 'border-top-left-radius': '20px', 'border-bottom-right-radius': '20px' });
        // control: the square button's corner pixel belongs to the button …
        cornerHitsButton('square', 2).should('eq', true);
        // … the rounded button's corner pixel is cut away, while its centre-left edge is still the button
        cornerHitsButton('round', 2).should('eq', false);
        cy.get(SEL.button('round')).then(($b) => {
            const r = $b[0].getBoundingClientRect();
            const el = $b[0].ownerDocument.elementFromPoint(r.left + 2, r.top + r.height / 2);
            expect(!!(el && el.closest(SEL.button('round'))), 'edge midpoint is the button').to.eq(true);
        });
    });

    it('[Button-BRW-006] Box shadow renders on Solid and is dropped on Outline', () => {
        const shadow = { boxShadow: { value: '4px 6px 0px 0px #ff0000' } }; // dynamic: x/y/blur/spread + colour
        addButtonsViaApi([
            { name: 'solid', layout: { top: 40, left: 2 }, styles: shadow },
            { name: 'outline', layout: { top: 120, left: 2 }, styles: { ...shadow, type: { value: T.typeOutline } } },
        ]);
        openIconAppInViewer(SEL.button('outline'));

        expectCss(SEL.button('solid'), { 'box-shadow': 'rgb(255, 0, 0) 4px 6px 0px 0px' });
        expectCss(SEL.button('outline'), { 'box-shadow': 'none' });
    });

    // ── Button-BRW-007 ───────────────────────────────────────────────────────
    // Button.jsx:84-89,110: --tblr-btn-color-darker = Manual ? hoverBackgroundColor : getModifiedColor(bg, 'hover')
    // (8% darker, utils.js:31); Outline → transparent. theme.scss:3063 `.jet-btn:hover { background: var(...) !important }`.
    it('[Button-BRW-007] Hover background — Auto darkens the background, Manual paints the configured colour (Solid only)', () => {
        const bg = '#3366ff'; // dynamic: rest colour rgb(51, 102, 255)
        const autoHover = 'rgb(10, 71, 255)'; // #0a47ff — #3366ff darkened 8% (getModifiedColor 'hover')
        const manual = '#ff8800'; // dynamic: manual hover colour rgb(255, 136, 0)
        addButtonsViaApi([
            { name: 'autobrand', layout: { top: 40, left: 2 } },
            { name: 'autocustom', layout: { top: 110, left: 2 }, styles: { backgroundColor: { value: bg } } },
            {
                name: 'manual',
                layout: { top: 180, left: 2 },
                styles: {
                    backgroundColor: { value: bg },
                    hoverBackgroundMode: { value: T.hoverManual },
                    hoverBackgroundColor: { value: manual },
                },
            },
            {
                name: 'outline',
                layout: { top: 250, left: 2 },
                styles: {
                    type: { value: T.typeOutline },
                    hoverBackgroundMode: { value: T.hoverManual },
                    hoverBackgroundColor: { value: manual },
                },
            },
        ]);
        openIconAppInViewer(SEL.button('outline'));
        pointerAway();

        const hoverAndExpect = (name, rest, hover) => {
            expectComputedColor(SEL.button(name), 'background-color', rest);
            cy.get(SEL.button(name)).realHover({ scrollBehavior: false });
            cy.get(SEL.button(name)).should(($b) => expect($b[0].matches(':hover'), `${name} :hover`).to.eq(true));
            expectComputedColor(SEL.button(name), 'background-color', hover);
            pointerAway();
            expectComputedColor(SEL.button(name), 'background-color', rest);
        };

        hoverAndExpect('autocustom', 'rgb(51, 102, 255)', autoHover);
        hoverAndExpect('manual', 'rgb(51, 102, 255)', 'rgb(255, 136, 0)');
        hoverAndExpect('outline', T.transparent, T.transparent);

        // Auto on the default brand token: a darker shade of the brand, not black and not unchanged
        resolveCssVarColor(T.brandTokenVar, SEL.button('autobrand')).then((brandRgb) => {
            expectComputedColor(SEL.button('autobrand'), 'background-color', brandRgb);
            cy.get(SEL.button('autobrand')).realHover({ scrollBehavior: false });
            cy.get(SEL.button('autobrand')).should(($b) => {
                const hover = $b[0].ownerDocument.defaultView.getComputedStyle($b[0]).backgroundColor;
                const sum = (rgb) => rgb.match(/\d+/g).slice(0, 3).map(Number).reduce((a, c) => a + c, 0);
                expect(hover, 'auto hover differs from the brand rest colour').not.to.eq(brandRgb);
                expect(sum(hover), 'auto hover is darker than the brand colour').to.be.lt(sum(brandRgb));
                expect(sum(hover), 'auto hover is not black').to.be.gt(0);
            });
            pointerAway();
        });
    });

    // ── Button-BRW-008 ───────────────────────────────────────────────────────
    // RenderWidget.jsx:343 box padding = padding none ? 0 : BOX_PADDING (2px); Button.jsx:109 the button grows by
    // 4px to fill the box when padding is none (36px → 40px at the default 40px row height).
    it('[Button-BRW-008] Padding None removes the box padding and the button fills the widget box', () => {
        const P = T.boxPadding;
        addButtonsViaApi([
            { name: 'pad40', layout: { top: 40, left: 2, height: 40 } }, // padding default. source: button.js:322
            { name: 'none40', layout: { top: 110, left: 2, height: 40 }, styles: { padding: { value: T.paddingNone } } },
            { name: 'pad60', layout: { top: 180, left: 2, height: 60 } },
            { name: 'none60', layout: { top: 270, left: 2, height: 60 }, styles: { padding: { value: T.paddingNone } } },
        ]);
        openIconAppInViewer(SEL.button('none60'));

        const expectInset = (name, inset, height) =>
            buttonBoxes(name, (b) => {
                expect(b.boxStyle.paddingTop, `${name}: box padding`).to.eq(`${inset}px`);
                expect(b.button.left - b.box.left, `${name}: left inset`).to.be.closeTo(inset, 0.5);
                expect(b.box.right - b.button.right, `${name}: right inset`).to.be.closeTo(inset, 0.5);
                expect(b.button.top - b.box.top, `${name}: top inset`).to.be.closeTo(inset, 0.5);
                expect(b.button.height, `${name}: button height`).to.be.closeTo(height, 0.5);
                expect(b.box.bottom - b.button.bottom, `${name}: bottom inset`).to.be.closeTo(inset, 0.5);
            });

        expectInset('pad40', P, 40 - 2 * P);
        expectInset('none40', 0, 40);
        expectInset('pad60', P, 60 - 2 * P);
        expectInset('none60', 0, 60);
    });
});
