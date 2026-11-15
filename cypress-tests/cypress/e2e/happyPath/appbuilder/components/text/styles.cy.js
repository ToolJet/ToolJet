/**
 * SPEC — Text — styles facet.
 * FOR AI: TESTING.md browser scenario only:
 *   Text-BRW-003 — horizontal (styles.textAlign) and vertical (styles.verticalAlignment) alignment place real
 *                  wrapped text where the builder configured it
 * Text.jsx:186-197: `.text-widget-section` is a flex column whose justify-content comes from verticalAlignment
 * (top/center/bottom → flex-start/center/flex-end, Text.jsx:14-18) and whose text-align is textAlign; the content
 * box inherits text-align. Each alignment is a separately saved Text (components API) opened in the viewer; every
 * wrapped line is measured with Range client rects.
 * Helpers: addTextsViaApi, textMetrics, openIconAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { textSelector } from "Selectors/appBuilder/components/text";
import { textText } from "Texts/appBuilder/components/text";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { addTextsViaApi, textMetrics } from "Support/utils/appBuilder/components/text";

const T = textText;
const PX = 1.5; // line placement tolerance (px)

describe('Text — styles facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Text-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Text-BRW-003 ─────────────────────────────────────────────────────────
    it('[Text-BRW-003] Horizontal and vertical alignment place wrapped text as configured', () => {
        // fixed text: random names could be short enough to fit on one line and make the wrap counts flaky
        const paragraph = 'Quarterly revenue grew steadily across every region while operating costs held flat, so margins improved for the third consecutive quarter and the board approved new hiring plans';
        const twoLines = 'Shipment delayed at customs pending inspection review';
        addTextsViaApi([
            // horizontal: one Text per textAlign option (text.js:160-168), vertically centred
            ...T.horizontalAlignments.map((align, i) => ({
                name: `h${align}`,
                layout: { top: 10, left: 2 + i * 10, width: 9, height: 160 },
                properties: { textFormat: { value: T.formats.plainText }, text: { value: paragraph } },
                styles: { textAlign: { value: align } },
            })),
            // vertical: one Text per verticalAlignment option (text.js:176-178), left aligned, in a tall box
            ...T.verticalAlignments.map((align, i) => ({
                name: `v${align}`,
                layout: { top: 200, left: 2 + i * 10, width: 9, height: 220 },
                properties: { textFormat: { value: T.formats.plainText }, text: { value: twoLines } },
                styles: { verticalAlignment: { value: align } },
            })),
        ]);
        openIconAppInViewer(textSelector.root('hleft'));

        // horizontal — every wrapped line hugs the configured edge / centre; justify stretches all but the last line
        const horizontal = {
            left: (l, c) => expect(l.left, 'line starts at the left edge').to.be.closeTo(c.left, PX),
            center: (l, c) =>
                expect(l.left + l.width / 2, 'line centred').to.be.closeTo(c.left + c.width / 2, PX),
            right: (l, c) => expect(l.right, 'line ends at the right edge').to.be.closeTo(c.right, PX),
        };
        Object.entries(horizontal).forEach(([align, check]) =>
            textMetrics(`h${align}`, (m) => {
                expect(m.lines.length, `${align}: wrapped`).to.be.gte(3);
                m.lines.forEach((line) => check(line, m.content));
                // short lines prove the placement is not just a full-width line
                expect(Math.min(...m.lines.map((l) => l.width)), `${align}: a short line`).to.be.lt(m.content.width - 10);
            })
        );
        textMetrics('hjustify', (m) => {
            expect(m.lines.length, 'justify: wrapped').to.be.gte(3);
            const last = m.lines[m.lines.length - 1];
            m.lines.slice(0, -1).forEach((line, i) => {
                expect(line.left, `line ${i + 1} starts at the left edge`).to.be.closeTo(m.content.left, PX);
                expect(line.right, `line ${i + 1} stretched to the right edge`).to.be.closeTo(m.content.right, PX);
            });
            expect(last.left, 'last line starts left').to.be.closeTo(m.content.left, PX);
            expect(last.right, 'last line not stretched').to.be.lt(m.content.right - 10);
        });

        // vertical — the wrapped block sits at the top / middle / bottom of the widget's content area
        textMetrics('vtop', (m) => {
            expect(m.lines.length, 'top: wrapped').to.be.gte(2);
            expect(m.lines[0].top - m.section.top, 'first line at the top').to.be.within(0, 3);
            expect(m.section.bottom - m.lines[m.lines.length - 1].bottom, 'room left below').to.be.gt(100);
        });
        textMetrics('vcenter', (m) => {
            const blockMid = (m.lines[0].top + m.lines[m.lines.length - 1].bottom) / 2;
            expect(blockMid, 'block centred').to.be.closeTo(m.section.top + m.section.height / 2, 3);
        });
        textMetrics('vbottom', (m) => {
            expect(m.section.bottom - m.lines[m.lines.length - 1].bottom, 'last line at the bottom').to.be.within(0, 3);
            expect(m.lines[0].top - m.section.top, 'room left above').to.be.gt(100);
        });
    });
});
