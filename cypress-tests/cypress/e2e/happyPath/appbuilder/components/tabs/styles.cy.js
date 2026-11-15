/**
 * SPEC — Tabs — styles facet.
 * FOR AI: the TESTING.md browser scenarios owned by the Tabs style controls:
 *   Tabs-BRW-001 — Tab width: Equally split gives every visible header the same share of the header row (hidden tabs
 *                  excluded); Auto sizes each header to its title (Tabs.jsx:299-300, 371, 380).
 *   Tabs-BRW-002 — Transition: Slide animates the panes (300ms transform + opacity, Tabs.jsx:499-514) and shows no
 *                  scrollbar / sideways scroll while the panes move; None swaps panes in the
 *                  same frame with no animation (Tabs.jsx:491-498).
 *   Tabs-BRW-004 — the active header carries a 2px accent underline (none on a disabled active tab); hovering a
 *                  header paints the Hover background at 8% alpha (Tabs.jsx:372, 414-416).
 * Seeded through the components API; checked in the editor and the running app.
 * Helpers: addTabsViaApi, tabsData, openTabsAppInViewer, tabsBoxes, readTabsBoxes, resolveCssVarColor, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { tabsSelector } from "Selectors/appBuilder/components/tabs";
import { tabsText } from "Texts/appBuilder/components/tabs";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addTabsViaApi,
    tabsData,
    openTabsAppInViewer,
    tabsBoxes,
} from "Support/utils/appBuilder/components/tabs";

const T = tabsText;
const PX = 1;
const TRANSPARENT = 'rgba(0, 0, 0, 0)';

const openEditor = (waitFor) => {
    cy.openApp('', undefined, undefined, waitFor);
    cy.get('[data-cy="query-manager-toggle-button"]').click();
};

// rgba() string the runtime paints for a hex colour at the hover alpha (Tabs.jsx:415)
const hoverRgba = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${T.hoverAlpha})`;
};

describe('Tabs — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Tabs-BRW-001 — Auto vs Equally split ────────────────────────────────
    it('[Tabs-BRW-001] Equally split gives every visible header the same width across the row; Auto sizes headers to their titles', () => {
        const short = fake.firstName.slice(0, 2) || 'ab';
        const long = `${fake.fullName} ${fake.fullName}`.slice(0, 24); // dynamic: much longer than `short`
        const mid = fake.lastName.slice(0, 6) || 'middle';
        const three = [
            { title: short, id: 'a' },
            { title: long, id: 'b' },
            { title: mid, id: 'c' },
        ];
        addTabsViaApi([
            { name: 'auto', layout: { top: 30, left: 2, width: 30, height: 120 }, properties: tabsData(three, 'a') },
            {
                name: 'split',
                layout: { top: 170, left: 2, width: 30, height: 120 },
                properties: tabsData(three, 'a'),
                styles: { tabWidth: { value: T.tabWidthSplit } }, // tabs.js:248
            },
            {
                // a hidden tab does not take a share: 2 visible headers → 50% each (Tabs.jsx:299-300)
                name: 'splithidden',
                layout: { top: 310, left: 2, width: 30, height: 120 },
                properties: tabsData([three[0], { ...three[1], visible: false }, three[2]], 'a'),
                styles: { tabWidth: { value: T.tabWidthSplit } },
            },
        ]);

        const expectSplit = (name, count, where) =>
            tabsBoxes(name, (b) => {
                const tag = `${name} (${where})`;
                const hs = b.headers;
                expect(hs, `${tag}: one header per visible tab`).to.have.length(count);
                const row = b.nav.width - b.nav.paddingLeft - b.nav.paddingRight;
                const share = row / count;
                hs.forEach((h, i) => {
                    expect(h.width, `${tag}: header ${i} gets 1/${count} of the row`).to.be.closeTo(share, PX);
                    if (i > 0) expect(h.left, `${tag}: header ${i} follows header ${i - 1}`).to.be.closeTo(hs[i - 1].right, PX);
                });
                expect(hs[0].left, `${tag}: first header at the row start`).to.be.closeTo(b.nav.left + b.nav.paddingLeft, PX);
                expect(hs[count - 1].right, `${tag}: last header at the row end`).to.be.closeTo(b.nav.right - b.nav.paddingRight, PX);
                expect(b.nav.scrollWidth, `${tag}: no overflow`).to.be.lte(b.nav.clientWidth);
            });

        const expectAuto = (where) =>
            tabsBoxes('auto', (b) => {
                const tag = `auto (${where})`;
                const hs = b.headers;
                expect(hs.map((h) => h.text), `${tag}: titles`).to.deep.eq([short, long, mid]);
                hs.forEach((h, i) => {
                    expect(h.styleWidth, `${tag}: header ${i} has no forced width`).to.eq('');
                    // content-sized: the title box plus the surface's 1rem side padding (Tabs.jsx:418-419)
                    expect(h.width, `${tag}: header ${i} hugs its title`).to.be.closeTo(h.labelRect.width + 32, 6);
                    if (i > 0) expect(h.left, `${tag}: header ${i} follows header ${i - 1}`).to.be.closeTo(hs[i - 1].right, PX);
                });
                expect(hs[1].width, `${tag}: the long title gets the widest header`).to.be.gt(hs[0].width + 40);
                expect(hs[1].width, `${tag}: the long title is wider than the middle one`).to.be.gt(hs[2].width);
                const used = hs[2].right - hs[0].left;
                const row = b.nav.width - b.nav.paddingLeft - b.nav.paddingRight;
                expect(used, `${tag}: the headers do not stretch to fill the row`).to.be.lt(row - 50);
            });

        const run = (where) => {
            expectAuto(where);
            expectSplit('split', 3, where);
            expectSplit('splithidden', 2, where);
            tabsBoxes('splithidden', (b) =>
                expect(b.headers.map((h) => h.text), 'the hidden tab has no header').to.deep.eq([short, mid])
            );
        };

        openEditor(tabsSelector.headers('splithidden'));
        run('editor');
        openTabsAppInViewer(tabsSelector.headers('splithidden'));
        run('viewer');
    });

    // ── Tabs-BRW-002 — Slide vs None ────────────────────────────────────────
    it('[Tabs-BRW-002] Slide animates the pane change over 300ms without a scrollbar flash; None swaps panes in the same frame', () => {
        const tabs = [
            { title: fake.firstName.slice(0, 6) || 'one', id: 'a' },
            { title: fake.lastName.slice(0, 6) || 'two', id: 'b' },
            { title: 'Third', id: 'c' },
        ];
        const NONE_ID = crypto.randomUUID();
        addTabsViaApi([
            { id: NONE_ID, name: 'none', layout: { top: 30, left: 2, width: 20, height: 240 }, properties: tabsData(tabs, 'a') }, // transition default none (tabs.js:470)
            // control for the scroll check: overflowing content in a pane
            { type: 'Text', name: 'overflowc', parent: `${NONE_ID}-c`, layout: { top: 500, left: 2, width: 10, height: 40 } },
            {
                name: 'slide',
                layout: { top: 290, left: 2, width: 20, height: 240 },
                properties: tabsData(tabs, 'a'),
                styles: { transition: { value: T.transitionSlide } }, // tabs.js:256
            },
        ]);

        // clicks header `index` inside the page and reads, one frame later, every pane wrapper's running transitions
        // (paused at `atMs` so the in-between frame is deterministic), computed transform/opacity/visibility, and the
        // overflow of the incoming pane's canvas + the page's horizontal overflow.
        const switchAndSample = (name, index, atMs) =>
            cy.get(tabsSelector.headers(name)).eq(index).then(($li) => {
                const doc = $li[0].ownerDocument;
                const win = doc.defaultView;
                const root = doc.querySelector(tabsSelector.root(name));
                const wrappers = () => [...root.querySelectorAll('.tab-pane[activetab]')].map((p) => p.parentElement);
                $li[0].click(); // the header's onClick (Tabs.jsx:382-398)
                return new Cypress.Promise((resolve) => {
                    win.requestAnimationFrame(() => {
                        const ws = wrappers();
                        const anims = ws.map((w) => w.getAnimations());
                        anims.flat().forEach((a) => {
                            a.pause();
                            a.currentTime = atMs;
                        });
                        const width = root.querySelector('.tab-pane[activetab]').parentElement.parentElement.clientWidth;
                        const tx = (w) => new win.DOMMatrix(win.getComputedStyle(w).transform).m41;
                        // scroll state of a pane canvas: content overflow (what a scrollbar would need) and offsets
                        const scroll = (w) => {
                            const c = w.querySelector('[id^="canvas-"]');
                            return c
                                ? { overflowY: c.scrollHeight - c.clientHeight, top: c.scrollTop, left: c.scrollLeft }
                                : { overflowY: 0, top: 0, left: 0 };
                        };
                        const sample = {
                            width,
                            anims: anims.map((list) =>
                                list.map((a) => ({ prop: a.transitionProperty, duration: a.effect.getTiming().duration }))
                            ),
                            panes: ws.map((w) => ({
                                display: win.getComputedStyle(w).display,
                                position: win.getComputedStyle(w).position,
                                tx: tx(w),
                                opacity: parseFloat(win.getComputedStyle(w).opacity),
                            })),
                            scroll: ws.map(scroll),
                            panelScrollLeft: ws[0].parentElement.scrollLeft,
                            panelOverflow: win.getComputedStyle(ws[0].parentElement).overflowX,
                            pageOverflowX: doc.scrollingElement.scrollWidth - doc.scrollingElement.clientWidth,
                        };
                        anims.flat().forEach((a) => a.finish());
                        resolve(sample);
                    });
                });
            });

        const run = (where) => {
            // None: the next frame already shows only the new pane, in normal flow, with nothing animating
            switchAndSample('none', 1, 0).then((s) => {
                const tag = `none (${where})`;
                expect(s.anims.flat(), `${tag}: no transition runs`).to.have.length(0);
                expect(s.panes.map((p) => p.display), `${tag}: only the new pane is displayed`).to.deep.eq(['none', 'block', 'none']);
                expect(s.panes[1].position, `${tag}: panes stay in normal flow`).to.eq('static');
                expect(s.panes[1].tx, `${tag}: no offset`).to.eq(0);
            });
            tabsBoxes('none', (b) => expect(b.headers.map((h) => h.active), 'none: header follows').to.deep.eq([false, true, false]));

            // Slide: halfway through, the old pane is leaving left and the new one arriving from the right
            switchAndSample('slide', 1, T.transitionMs / 2).then((s) => {
                const tag = `slide (${where})`;
                [0, 1].forEach((i) => {
                    const props = s.anims[i].map((a) => a.prop);
                    expect(props, `${tag}: pane ${i} animates transform and opacity`).to.include.members(['transform', 'opacity']);
                    s.anims[i]
                        .filter((a) => a.prop !== 'visibility')
                        .forEach((a) => expect(a.duration, `${tag}: pane ${i} ${a.prop} duration`).to.eq(T.transitionMs));
                });
                const [out, inc] = s.panes;
                expect(inc.tx, `${tag}: incoming pane still right of its slot`).to.be.gt(0);
                expect(inc.tx, `${tag}: incoming pane already moving in`).to.be.lt(s.width - PX);
                expect(out.tx, `${tag}: outgoing pane moving out to the left`).to.be.lt(0);
                expect(out.tx, `${tag}: outgoing pane not gone yet`).to.be.gt(-s.width + PX);
                expect(inc.opacity, `${tag}: incoming fading in`).to.be.within(0.01, 0.99);
                expect(out.opacity, `${tag}: outgoing fading out`).to.be.within(0.01, 0.99);
                // no scroll flash: no pane grows a scrollbar while moving, the panel clips the panes, the page never widens
                s.scroll.slice(0, 2).forEach((c, i) =>
                    expect(c, `${tag}: moving pane ${i} has nothing to scroll and is not scrolled`).to.deep.eq({ overflowY: 0, top: 0, left: 0 })
                );
                expect(s.panelOverflow, `${tag}: panel clips the sliding panes`).to.eq('hidden');
                expect(s.panelScrollLeft, `${tag}: panel never scrolls sideways`).to.eq(0);
                expect(s.pageOverflowX, `${tag}: page never scrolls sideways`).to.be.lte(0);
            });
            // settled: new pane in place, old one parked one width to the left and hidden
            tabsBoxes('slide', (b) => {
                const [out, inc, next] = b.panes;
                expect(b.headers.map((h) => h.active), 'slide: header follows').to.deep.eq([false, true, false]);
                expect(inc.wrapper.transform, 'slide: incoming settled (translateX(0))').to.be.oneOf(['none', 'matrix(1, 0, 0, 1, 0, 0)']);
                expect(inc.wrapper.opacity).to.eq(1);
                expect(inc.wrapper.visibility).to.eq('visible');
                expect(out.wrapper.opacity, 'slide: outgoing faded').to.eq(0);
                expect(out.wrapper.visibility, 'slide: outgoing hidden').to.eq('hidden');
                expect(out.wrapper.left, 'slide: outgoing parked one width left').to.be.closeTo(inc.wrapper.left - inc.wrapper.width, PX);
                expect(next.wrapper.left, 'slide: next parked one width right').to.be.closeTo(inc.wrapper.left + inc.wrapper.width, PX);
            });
            // and back: the slide runs the other way (old pane leaves to the right)
            switchAndSample('slide', 0, T.transitionMs / 2).then((s) => {
                expect(s.panes[0].tx, `slide back (${where}): incoming from the left`).to.be.lt(0);
                expect(s.panes[1].tx, `slide back (${where}): outgoing to the right`).to.be.gt(0);
            });
            switchAndSample('none', 0, 0).then((s) => expect(s.panes.map((p) => p.display)).to.deep.eq(['block', 'none', 'none']));
            // control: a pane whose content overflows does report it, so the mid-slide check can fail
            switchAndSample('none', 2, 0).then((s) => expect(s.scroll[2].overflowY, `none (${where}): overflowing pane overflows`).to.be.gt(0));
        };

        openEditor(tabsSelector.headers('slide'));
        run('editor');
        openTabsAppInViewer(tabsSelector.headers('slide'));
        run('viewer');
    });

    // ── Tabs-BRW-004 — accent indicator + hover background ──────────────────
    it('[Tabs-BRW-004] The active header carries the accent underline (default and custom), never a disabled one; hover paints the hover background', () => {
        const tabs = [
            { title: fake.firstName.slice(0, 6) || 'one', id: 'a' },
            { title: fake.lastName.slice(0, 6) || 'two', id: 'b' },
            { title: 'Third', id: 'c' },
        ];
        const accent = '#d6336c'; // dynamic: custom accent
        const hover = '#0ca678'; // dynamic: custom hover background
        addTabsViaApi([
            { name: 'plain', layout: { top: 30, left: 2, width: 20, height: 150 }, properties: tabsData(tabs, 'a') },
            {
                name: 'custom',
                layout: { top: 200, left: 2, width: 20, height: 150 },
                properties: tabsData(tabs, 'a'),
                styles: { accent: { value: accent }, hoverBackground: { value: hover } }, // tabs.js:225-232, 198-206
            },
            {
                // the default tab is disabled: it is active but gets no indicator (Tabs.jsx:372)
                name: 'disabledactive',
                layout: { top: 370, left: 2, width: 20, height: 150 },
                properties: tabsData([{ ...tabs[0], disable: true }, tabs[1]], 'a'),
            },
        ]);

        const expectIndicator = (name, activeIndex, color, where) =>
            tabsBoxes(name, (b) => {
                b.headers.forEach((h, i) => {
                    const tag = `${name} header ${i} (${where})`;
                    expect(h.active, `${tag}: active`).to.eq(i === activeIndex);
                    if (i === activeIndex) {
                        expect(h.borderBottomWidth, `${tag}: underline width`).to.eq(T.accentWidth);
                        expect(h.borderBottomStyle, `${tag}: underline style`).to.eq('solid');
                        expect(h.borderBottomColor, `${tag}: underline colour`).to.eq(color);
                    } else {
                        expect(h.borderBottomWidth, `${tag}: no underline`).to.eq(0);
                    }
                });
            });
        const expectHover = (name, hoveredIndex, color, where) =>
            tabsBoxes(name, (b) =>
                b.headers.forEach((h, i) =>
                    expect(h.surfaceBg, `${name} header ${i} hover surface (${where})`).to.eq(i === hoveredIndex ? color : TRANSPARENT)
                )
            );

        const run = (where) => {
            resolveCssVarColor(T.tokenAccent, tabsSelector.root('plain')).then((brand) => {
                expectIndicator('plain', 0, brand, where);
                // the indicator follows the selection
                cy.get(tabsSelector.headers('plain')).eq(2).realClick({ scrollBehavior: false });
                expectIndicator('plain', 2, brand, `${where}, after switching`);
                cy.get(tabsSelector.headers('plain')).eq(0).realClick({ scrollBehavior: false });
                expectIndicator('plain', 0, brand, `${where}, switched back`);
            });
            expectIndicator('custom', 0, 'rgb(214, 51, 108)', where); // #d6336c
            cy.get(tabsSelector.headers('custom')).eq(1).realClick({ scrollBehavior: false });
            expectIndicator('custom', 1, 'rgb(214, 51, 108)', `${where}, after switching`);
            // active but disabled: no indicator; the header is dimmed
            tabsBoxes('disabledactive', (b) => {
                expect(b.headers[0].active, `disabled default tab is active (${where})`).to.eq(true);
                expect(b.headers[0].borderBottomWidth, `disabled active tab has no underline (${where})`).to.eq(0);
                expect(b.headers[0].opacity, 'disabled header dimmed').to.eq(T.disabledTabOpacity);
            });

            // hover — default hover background (#1B1F24, tabs.js:465) at 8% alpha on the hovered header only
            moveMouseAway();
            expectHover('plain', -1, null, `${where}, idle`);
            cy.get(tabsSelector.headers('plain')).eq(1).realHover({ scrollBehavior: false });
            expectHover('plain', 1, hoverRgba(T.defaultHoverBackground), where);
            cy.get(tabsSelector.headers('plain')).eq(2).realHover({ scrollBehavior: false });
            expectHover('plain', 2, hoverRgba(T.defaultHoverBackground), `${where}, moved`);
            // hovering the active header paints it too
            cy.get(tabsSelector.headers('custom')).eq(1).realHover({ scrollBehavior: false });
            expectHover('custom', 1, hoverRgba(hover), where);
            cy.get(tabsSelector.headers('custom')).eq(0).realHover({ scrollBehavior: false });
            expectHover('custom', 0, hoverRgba(hover), `${where}, moved`);
            moveMouseAway();
            expectHover('custom', -1, null, `${where}, left`);
            expectHover('plain', -1, null, `${where}, left`);
        };

        moveMouseAway();
        openEditor(tabsSelector.headers('disabledactive'));
        run('editor');
        moveMouseAway();
        openTabsAppInViewer(tabsSelector.headers('disabledactive'));
        run('viewer');
    });
});
