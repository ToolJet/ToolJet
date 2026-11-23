/**
 * SPEC — Key Value Pair — styles facet (scenario-scoped).
 * FOR AI: browser-only visual scenarios from frontend/ee/test/app-builder/widgets/KeyValuePair/TESTING.md:
 *   KeyValuePair-BRW-002 — with autoLabelWidth, every label takes the widest label's real rendered width, so the
 *                          value column lines up (KeyValuePair.jsx:197-225 measures `.key-value-label p` scrollWidth)
 *   KeyValuePair-BRW-004 — an `image` field renders the real image and shows a fallback when it fails to load
 *   KeyValuePair-BRW-007 — a disabled Save-changes button is greyed (--slate6 / --slate9) with cursor: not-allowed
 *                          and no hover effect (keyValuePair.scss:80-92)
 * All apps are seeded through the components API and checked in the running app.
 * Helpers: openLinkAppInViewer, resolveCssVarColor, addKeyValuePairsViaApi, kvField, editStringField,
 * moveKvMouseAway.
 */
import { fake } from "Fixtures/fake";
import { keyValuePairSelector } from "Selectors/appBuilder/components/keyValuePair";
import { keyValuePairText } from "Texts/appBuilder/components/keyValuePair";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addKeyValuePairsViaApi,
    kvField,
    editStringField,
    moveKvMouseAway,
} from "Support/utils/appBuilder/components/keyValuePair";

const T = keyValuePairText;
const S = keyValuePairSelector;
const PX = 0.75;

// label geometry of one widget: label boxes, natural text widths (<p> scrollWidth, the value KeyValuePair.jsx:214
// measures), truncation, value-cell left edges
const labelGeometry = (name, assertFn) =>
    cy.get(S.container(name)).should(($root) => {
        const labels = Array.from($root[0].querySelectorAll('.key-value-label'));
        const cells = Array.from($root[0].querySelectorAll('.key-value-render-value'));
        expect(labels.length, `${name} labels`).to.be.gt(1);
        assertFn({
            texts: labels.map((l) => l.textContent),
            boxes: labels.map((l) => l.getBoundingClientRect()),
            natural: labels.map((l) => l.querySelector('p').scrollWidth),
            truncated: labels.map((l) => l.querySelector('p').scrollWidth > l.querySelector('p').clientWidth),
            cellLefts: cells.map((c) => c.getBoundingClientRect().left),
            cellTops: cells.map((c) => c.getBoundingClientRect().top),
            rowWidth: $root[0].querySelector('.key-value-row').getBoundingClientRect().width,
        });
    });

const expectAligned = (name) =>
    labelGeometry(name, (g) => {
        const widest = Math.max(...g.natural);
        g.boxes.forEach((b, i) => {
            // KeyValuePair.jsx:221 — max natural width + 1px buffer becomes every label's min-width
            expect(b.width, `${name} "${g.texts[i]}" takes the widest label's width`).to.be.closeTo(widest + 1, 1);
            expect(b.left, `${name} "${g.texts[i]}" left edge`).to.be.closeTo(g.boxes[0].left, PX);
        });
        expect(g.truncated, `${name}: no label truncated`).to.deep.eq(g.texts.map(() => false));
        g.cellLefts.forEach((l, i) => {
            expect(l, `${name} value ${i} starts where the labels end`).to.be.closeTo(g.boxes[0].right, PX);
        });
    });

describe('Key Value Pair — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-KeyValuePair-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
        cy.apiDeleteApp();
    });

    // ── KeyValuePair-BRW-002 ─────────────────────────────────────────────────
    it('[KeyValuePair-BRW-002] Auto label width aligns every label to the widest label\'s real rendered width', () => {
        // dynamic label sets: kvwide has a long label, kvnarrow only short ones → different measured widths
        const wideLabels = ['Id', 'Name', 'Primary contact email address'];
        const narrowLabels = ['Id', 'Age', 'Town'];
        const build = (labels) => ({
            data: { value: `{{ ${JSON.stringify(Object.fromEntries(labels.map((l, i) => [`k${i}`, fake.firstName.slice(0, 8)])))} }}` },
            fields: { value: labels.map((l, i) => kvField(`k${i}`, { name: l })) },
        });
        addKeyValuePairsViaApi([
            // autoLabelWidth defaults to {{true}} with side alignment. source: keyValuePair.js:502,504
            { name: 'kvwide', layout: { top: 40, left: 2, width: 16, height: 200 }, properties: build(wideLabels) },
            { name: 'kvnarrow', layout: { top: 260, left: 2, width: 16, height: 200 }, properties: build(narrowLabels) },
            // controls: fixed 33% label width (autoLabelWidth off) and top alignment (no measurement)
            { name: 'kvfixed', layout: { top: 40, left: 20, width: 16, height: 200 }, properties: build(wideLabels), styles: { autoLabelWidth: { value: '{{false}}' } } },
            { name: 'kvtop', layout: { top: 260, left: 20, width: 16, height: 280 }, properties: build(wideLabels), styles: { alignment: { value: 'top' } } },
        ]);
        openLinkAppInViewer(S.rows('kvtop'));
        cy.document().its('fonts.status').should('eq', 'loaded');

        expectAligned('kvwide');
        expectAligned('kvnarrow');
        // the measurement is real: the long label set yields a wider label column
        labelGeometry('kvwide', (wide) => {
            const narrow = Cypress.$(S.labels('kvnarrow')).get().map((l) => l.getBoundingClientRect().width);
            expect(wide.boxes[0].width, 'wide set measures wider than the narrow set').to.be.gt(narrow[0] + 40);
        });

        // control: autoLabelWidth off → every label is labelWidth% of the row (keyValuePair.js:505 default 33)
        labelGeometry('kvfixed', (g) => {
            g.boxes.forEach((b, i) =>
                expect(b.width, `fixed "${g.texts[i]}" = ${T.defaultLabelWidthPercent}% of the row`).to.be.closeTo((g.rowWidth * T.defaultLabelWidthPercent) / 100, 2));
            expect(Math.max(...g.natural) + 1, 'fixed width is not the measured width').not.to.be.closeTo(g.boxes[0].width, 2);
        });
        // control: top alignment stacks the label above its value instead of measuring a column
        labelGeometry('kvtop', (g) => {
            g.boxes.forEach((b, i) => expect(b.bottom, `top "${g.texts[i]}" above its value`).to.be.lte(g.cellTops[i] + PX));
        });

        // a narrower window re-runs the measurement (widgetWidth dependency) — labels stay aligned to the widest
        cy.viewport(1100, 900);
        cy.get(S.container('kvwide')).should(($r) => expect($r[0].getBoundingClientRect().width).to.be.lt(16 * 31));
        expectAligned('kvwide');
        expectAligned('kvnarrow');
    });

    // ── KeyValuePair-BRW-004 ─────────────────────────────────────────────────
    // ImageFieldAdapter → ImageRenderer: an <img src=value> (no load-error handling).
    describe('image field', () => {
        const GOOD = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="red"/></svg>')}`; // dynamic: 40x30 image
        const BROKEN = 'data:image/png;base64,bm90LWFuLWltYWdl'; // dynamic: undecodable image data → load error

        beforeEach(() => {
            addKeyValuePairsViaApi([
                {
                    name: 'kvimg',
                    layout: { top: 40, left: 2, width: 14, height: 200 },
                    properties: {
                        data: { value: `{{ ${JSON.stringify({ good: GOOD, broken: BROKEN })} }}` },
                        fields: { value: [kvField('good', { fieldType: 'image' }), kvField('broken', { fieldType: 'image' })] },
                    },
                },
            ]);
            openLinkAppInViewer(S.rows('kvimg'));
        });

        it('[KeyValuePair-BRW-004] An image field renders the real image', () => {
            cy.get(S.image('kvimg')).should('have.length', 2);
            cy.get(S.image('kvimg')).first().should(($img) => {
                const img = $img[0];
                expect(img.complete && img.naturalWidth, 'image decoded').to.eq(40);
                expect(img.naturalHeight, 'natural height').to.eq(30);
                const r = img.getBoundingClientRect();
                expect(r.width, 'painted width').to.be.gt(0);
                expect(r.height, 'painted height').to.be.gt(0);
                const cell = img.closest('.key-value-render-value').getBoundingClientRect();
                expect(r.left >= cell.left - PX && r.right <= cell.right + PX && r.top >= cell.top - PX && r.bottom <= cell.bottom + PX, 'image inside its cell').to.eq(true);
                const hit = img.ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                expect(hit, 'image is on top at its centre').to.eq(img);
            });
        });

        it('[KeyValuePair-BRW-004] A broken image URL shows a visible fallback instead of an empty cell', () => {
            cy.get(S.image('kvimg')).eq(1).should(($img) => {
                expect($img[0].complete, 'load attempt finished').to.eq(true);
                expect($img[0].naturalWidth, 'load failed').to.eq(0);
            });
            // a fallback is anything visible in the cell: the image box itself (broken-image glyph) or another node
            cy.get(S.valueCells('kvimg')).eq(1).should(($cell) => {
                const cell = $cell[0];
                const visible = Array.from(cell.querySelectorAll('*'))
                    .filter((el) => el.children.length === 0 || el.tagName === 'IMG')
                    .map((el) => ({ tag: el.tagName, text: el.textContent.trim(), w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height }))
                    .filter((n) => n.w > 0 && n.h > 0);
                expect(visible, 'visible fallback inside the failed image cell').to.not.be.empty;
            });
        });
    });

    // ── KeyValuePair-BRW-007 ─────────────────────────────────────────────────
    it('[KeyValuePair-BRW-007] A disabled Save-changes button is greyed out with a not-allowed cursor and no hover effect', () => {
        const props = (disabled) => ({
            data: { value: `{{ ${JSON.stringify({ a: fake.firstName.slice(0, 6) })} }}` },
            fields: { value: [kvField('a', { isEditable: '{{true}}' })] },
            disableSaveChanges: { value: `{{${disabled}}}` }, // source: keyValuePair.js:74-81
        });
        addKeyValuePairsViaApi([
            { name: 'kvon', layout: { top: 40, left: 2, width: 12, height: 160 }, properties: props(true) },
            { name: 'kvoff', layout: { top: 40, left: 16, width: 12, height: 160 }, properties: props(false) },
            // < 200px → docked icon-only Save (KeyValuePair.jsx:133-134)
            { name: 'kvonicon', layout: { top: 240, left: 2, width: 4, height: 160 }, properties: props(true) },
        ]);
        openLinkAppInViewer(S.rows('kvonicon'));
        ['kvon', 'kvoff', 'kvonicon'].forEach((name) => editStringField(name, 0, 'X'));
        moveKvMouseAway();

        const D = T.disabledSave;
        const E = T.enabledSave;
        resolveCssVarColor(D.backgroundVar, S.container('kvon')).then((slate6) =>
            resolveCssVarColor(D.colorVar, S.container('kvon')).then((slate9) =>
                resolveCssVarColor(E.backgroundVar, S.container('kvoff')).then((primary) => {
                    expect(slate6, 'grey differs from the blue CTA').not.to.eq(primary);
                    const look = (name) =>
                        cy.get(S.saveButton(name)).then(($b) => {
                            const cs = $b[0].ownerDocument.defaultView.getComputedStyle($b[0]);
                            return { disabled: $b[0].disabled, background: cs.backgroundColor, border: cs.borderTopColor, color: cs.color, cursor: cs.cursor, opacity: cs.opacity };
                        });
                    ['kvon', 'kvonicon'].forEach((name) =>
                        look(name).should('deep.eq', { disabled: true, background: slate6, border: slate6, color: slate9, cursor: D.cursor, opacity: '1' }));
                    look('kvoff').then((l) => {
                        expect(l.disabled, 'enabled').to.eq(false);
                        expect(l.background, 'enabled: blue CTA').to.eq(primary);
                        expect(l.cursor, 'enabled cursor').to.eq(E.cursor);
                    });

                    // hover: the enabled button dims, the disabled one does not (:hover:not(:disabled))
                    cy.get(S.saveButton('kvoff')).realHover({ scrollBehavior: false });
                    cy.get(S.saveButton('kvoff')).should('have.css', 'opacity', E.hoverOpacity);
                    cy.get(S.saveButton('kvon')).realHover({ scrollBehavior: false });
                    cy.get(S.saveButton('kvon')).should('have.css', 'opacity', '1').and('have.css', 'cursor', D.cursor);
                    cy.get(S.saveButton('kvon')).should('have.css', 'background-color', slate6);
                    moveKvMouseAway();

                    // and it is inert: clicking it keeps the pending edit
                    cy.get(S.saveButton('kvon')).click({ force: true });
                    cy.get(S.saveButton('kvon')).should('be.disabled');
                    cy.get(S.changesetContent('kvon')).should('be.visible');
                })));
    });
});
