/**
 * SPEC — Link — styles facet (painted look in a real browser).
 * FOR AI: TESTING.md browser scenarios:
 *   Link-BRW-006 — On-hover underline and the darkened hover colour paint as authored
 *   Link-BRW-008 — a disabled Link shows no hover colour, no underline and no pointer cursor; enabled still does
 *   Link-BRW-009 — the icon stays visible and centred on the first line across text sizes, wrapping and alignment
 * Links are seeded through the components API (addLinksViaApi) and checked in the viewer with real CDP hover
 * (realHover), so `:hover` and pointer hit-testing are the browser's own.
 * Helpers: addLinksViaApi, openLinkAppInViewer, expectBoxes, hitAtCenter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { linkSelector } from "Selectors/appBuilder/components/link";
import { linkText } from "Texts/appBuilder/components/link";
import {
    addLinksViaApi,
    openLinkAppInViewer,
    expectBoxes,
    hitAtCenter,
} from "Support/utils/appBuilder/components/link";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";

const T = linkText;

const expectDecoration = (name, line) =>
    cy.get(linkSelector.anchor(name)).should(($a) => {
        const actual = $a[0].ownerDocument.defaultView.getComputedStyle($a[0]).textDecorationLine;
        expect(actual, `${name} anchor text-decoration-line`).to.eq(line);
    });

// moves the real pointer off every Link (top-left corner of the page)
const pointerAway = () => cy.get('body').realHover({ position: 'topLeft' });

describe('Link — styles facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Link-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Link-BRW-006 ─────────────────────────────────────────────────────────
    // Link.jsx:64 `--link-hover-color: getModifiedColor(textColor, 'hover')` (8% darken, D-18); link.scss
    // `.link-text:hover { color: var(--link-hover-color) !important }`; underline 'on-hover' (link.js:246) → the
    // anchor is underlined only while hovered.
    it('[Link-BRW-006] On-hover underline and the darkened hover colour paint as authored', () => {
        const picked = '#3366ff'; // dynamic: picked text colour
        const pickedRgb = 'rgb(51, 102, 255)';
        const pickedHoverRgb = 'rgb(10, 71, 255)'; // #0a47ff — 8% darker (TESTING.md Link-STY-004)
        addLinksViaApi([
            { name: 'link1', layout: { top: 40 } }, // default var(--cc-primary-brand) + on-hover
            { name: 'link2', layout: { top: 120 }, styles: { textColor: { value: picked } } },
        ]);
        openLinkAppInViewer(linkSelector.linkText('link1'));

        // theme token: rest colour is the resolved brand token, hover colour its 8% darken
        resolveCssVarColor(T.brandTokenVar, linkSelector.wrapper('link1')).then((brandRgb) => {
            resolveCssVarColor(T.hoverColorVar, linkSelector.wrapper('link1')).then((hoverRgb) => {
                expect(hoverRgb, 'hover colour differs from the rest colour').not.to.eq(brandRgb);
                const sum = (rgb) => rgb.match(/\d+/g).slice(0, 3).map(Number).reduce((a, b) => a + b, 0);
                expect(sum(hoverRgb), 'hover colour is darker, not black').to.be.lt(sum(brandRgb)).and.gt(0);

                expectComputedColor(linkSelector.linkText('link1'), 'color', brandRgb);
                expectDecoration('link1', 'none');

                cy.get(linkSelector.linkText('link1')).realHover();
                expectComputedColor(linkSelector.linkText('link1'), 'color', hoverRgb);
                expectDecoration('link1', 'underline');

                pointerAway();
                expectComputedColor(linkSelector.linkText('link1'), 'color', brandRgb);
                expectDecoration('link1', 'none');
            });
        });

        // picked colour
        expectComputedColor(linkSelector.linkText('link2'), 'color', pickedRgb);
        expectDecoration('link2', 'none');
        cy.get(linkSelector.linkText('link2')).realHover();
        expectComputedColor(linkSelector.linkText('link2'), 'color', pickedHoverRgb);
        expectDecoration('link2', 'underline');
        // the underline is painted in the authored text colour (Link.jsx:176 textDecorationColor)
        expectComputedColor(linkSelector.anchor('link2'), 'text-decoration-color', pickedRgb);
        pointerAway();
        expectDecoration('link2', 'none');
    });

    // ── Link-BRW-008 ─────────────────────────────────────────────────────────
    // D-13 / Link.jsx:61-62,211-213: disabled → wrapper `pointer-events: none` and inline `pointer-events: none`
    // on `.link-text`, so it is never the hover/hit target and `:hover` never matches.
    it('[Link-BRW-008] A disabled Link shows no hover feedback; an enabled Link still does', () => {
        addLinksViaApi([
            { name: 'enabled', layout: { top: 40 } },
            { name: 'disabled', layout: { top: 120 }, properties: { disabledState: { value: '{{true}}' } } },
        ]);
        openLinkAppInViewer(linkSelector.linkText('disabled'));

        resolveCssVarColor(T.brandTokenVar, linkSelector.wrapper('enabled')).then((restRgb) => {
            resolveCssVarColor(T.hoverColorVar, linkSelector.wrapper('enabled')).then((hoverRgb) => {
                // enabled: colour change + underline + pointer cursor
                hitAtCenter(linkSelector.linkText('enabled')).then(({ el, cursor }) => {
                    expect(el && el.classList.contains('link-text'), 'enabled text is the hit target').to.eq(true);
                    expect(cursor, 'pointer cursor').to.eq('pointer');
                });
                cy.get(linkSelector.linkText('enabled')).realHover();
                expectComputedColor(linkSelector.linkText('enabled'), 'color', hoverRgb);
                expectDecoration('enabled', 'underline');
                pointerAway();

                // disabled: nothing changes under the pointer
                cy.get(linkSelector.anchor('disabled')).should('have.attr', 'aria-disabled', 'true');
                hitAtCenter(linkSelector.linkText('disabled')).then(({ el, cursor }) => {
                    expect(el && el.closest('.link-text'), 'disabled text is not the hit target').to.eq(null);
                    expect(cursor, 'no pointer cursor').not.to.eq('pointer');
                });
                cy.get(linkSelector.linkText('disabled')).realHover();
                cy.get(linkSelector.linkText('disabled')).should(($t) => expect($t[0].matches(':hover'), ':hover').to.eq(false));
                expectComputedColor(linkSelector.linkText('disabled'), 'color', restRgb);
                expectDecoration('disabled', 'none');
            });
        });
    });

    // ── Link-BRW-009 ─────────────────────────────────────────────────────────
    // D-15/D-16/D-17, Link.jsx:195-215: the icon box is inline-flex (zero-width space + icon, align-items centre)
    // ahead of `.link-text` in a `display: block` container; `.link-text` has `overflow-wrap: anywhere`;
    // horizontal alignment comes only from the wrapper's text-align.
    it('[Link-BRW-009] The icon stays visible, centred on the first line and beside the first word', () => {
        const sentence = Array.from({ length: 24 }, () => fake.firstName).join(' '); // dynamic: wraps
        const unbroken = 'x'.repeat(90); // dynamic: one 90-char word with no break opportunity
        const shortLabel = fake.firstName; // dynamic: fits on one line
        const sizes = [10, 14, 28]; // dynamic: small, default (link.js:245), large
        const aligns = ['left', 'center', 'right']; // horizontalAlignment values (Link.jsx:56)
        const withIcon = (extra) => ({ iconVisibility: { value: true }, verticalAlignment: { value: T.alignTop }, ...extra });
        const links = [];
        sizes.forEach((size, i) =>
            links.push({
                name: `size${size}`,
                layout: { top: 20, left: 1 + i * 14, width: 8, height: 160 },
                properties: { linkText: { value: sentence } },
                styles: withIcon({ textSize: { value: `{{${size}}}` } }),
            })
        );
        aligns.forEach((align, i) => {
            links.push({
                name: `wrap${align}`,
                layout: { top: 200, left: 1 + i * 14, width: 8, height: 120 },
                properties: { linkText: { value: sentence } },
                styles: withIcon({ horizontalAlignment: { value: align } }),
            });
            links.push({
                name: `long${align}`,
                layout: { top: 340, left: 1 + i * 14, width: 8, height: 120 },
                properties: { linkText: { value: unbroken } },
                styles: withIcon({ horizontalAlignment: { value: align } }),
            });
            links.push({
                name: `short${align}`,
                layout: { top: 480, left: 1 + i * 14, width: 12, height: 40 },
                properties: { linkText: { value: shortLabel } },
                styles: withIcon({ horizontalAlignment: { value: align } }),
            });
        });
        addLinksViaApi(links);
        openLinkAppInViewer(linkSelector.icon('size10'));

        const mid = (top, bottom) => (top + bottom) / 2;
        const iconVisible = (b, label) => {
            expect(b.icon, `${label}: icon rendered`).to.not.equal(null);
            expect(b.icon.width, `${label}: icon has size`).to.be.gt(0);
            expect(b.icon.left, `${label}: icon inside (left)`).to.be.gte(b.wrapper.left - 0.5);
            expect(b.icon.right, `${label}: icon inside (right)`).to.be.lte(b.wrapper.right + 0.5);
            expect(b.icon.top, `${label}: icon inside (top)`).to.be.gte(b.wrapper.top - 0.5);
        };
        const centredOnFirstLine = (b, label, size) => {
            const tolerance = Math.max(1.5, size * 0.1);
            expect(mid(b.icon.top, b.icon.bottom), `${label}: icon centred on line 1`)
                .to.be.closeTo(mid(b.lines[0].top, b.lines[0].bottom), tolerance);
            // the icon box sits on the first line, not between later lines
            expect(b.icon.bottom, `${label}: icon above line 2`).to.be.lte(b.lines[1] ? b.lines[1].top + tolerance : Infinity);
        };
        const besideFirstWord = (b, label) => {
            // icon immediately before the first word: 4px gap (Link.jsx:197 marginRight)
            expect(b.lines[0].left - b.icon.right, `${label}: icon hugs the first word`).to.be.closeTo(T.iconGap, 1.5);
            expect(mid(b.icon.top, b.icon.bottom), `${label}: on the first line`).to.be.within(b.lines[0].top, b.lines[0].bottom);
        };

        // text sizes (wrapping, left): centred on the first line, later lines start under the icon
        sizes.forEach((size) => {
            const label = `size ${size}`;
            expectBoxes(`size${size}`, (b) => {
                expect(b.lines.length, `${label}: wraps`).to.be.gt(1);
                expect(b.icon.height, `${label}: icon = text size + 2`).to.be.closeTo(size + T.iconSizeExtra, 0.5);
                iconVisible(b, label);
                centredOnFirstLine(b, label, size);
                besideFirstWord(b, label);
                expect(b.lines[1].left, `${label}: line 2 starts under the icon`).to.be.closeTo(b.icon.left, 1.5);
            });
        });

        // alignment with wrapping text: the icon stays before the first word of the first line
        aligns.forEach((align) => {
            expectBoxes(`wrap${align}`, (b) => {
                expect(b.lines.length, `${align}: wraps`).to.be.gt(1);
                iconVisible(b, `wrap ${align}`);
                centredOnFirstLine(b, `wrap ${align}`, 14);
                besideFirstWord(b, `wrap ${align}`);
                if (align === 'left') {
                    expect(b.lines[1].left, 'left: line 2 starts under the icon').to.be.closeTo(b.icon.left, 1.5);
                }
            });
        });

        // long unbroken label: it wraps inside the widget and the icon stays visible
        aligns.forEach((align) => {
            expectBoxes(`long${align}`, (b) => {
                expect(b.lines.length, `long ${align}: the unbroken word wraps`).to.be.gt(1);
                expect(b.el.scrollWidth - b.el.clientWidth, `long ${align}: no horizontal overflow`).to.be.at.most(1);
                iconVisible(b, `long ${align}`);
                // every wrapped piece stays inside the widget. The browser takes the ordinary break after the
                // inline icon box before an `anywhere` break inside the word, so the word starts on the line
                // below the icon — the guarantee here is "wraps + icon visible", not "beside the first word".
                b.lines.forEach((line, i) => {
                    expect(line.left, `long ${align}: line ${i + 1} inside (left)`).to.be.gte(b.wrapper.left - 0.5);
                    expect(line.right, `long ${align}: line ${i + 1} inside (right)`).to.be.lte(b.wrapper.right + 0.5);
                });
            });
        });

        // short label: icon + label move together to start / centre / end
        aligns.forEach((align) => {
            expectBoxes(`short${align}`, (b) => {
                const label = `short ${align}`;
                expect(b.lines.length, `${label}: one line`).to.eq(1);
                iconVisible(b, label);
                besideFirstWord(b, label);
                const groupLeft = b.icon.left;
                const groupRight = b.lines[0].right;
                if (align === 'left') expect(groupLeft, `${label}: at the start`).to.be.closeTo(b.wrapper.left, 1.5);
                if (align === 'center') {
                    expect(mid(groupLeft, groupRight), `${label}: centred`).to.be.closeTo(mid(b.wrapper.left, b.wrapper.right), 1.5);
                }
                if (align === 'right') expect(groupRight, `${label}: at the end`).to.be.closeTo(b.wrapper.right, 1.5);
            });
        });
    });
});
