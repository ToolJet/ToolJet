/**
 * SPEC — Bounded Box — properties facet.
 * FOR AI: TESTING.md browser scenario only (property behaviour of `imageUrl`, boundedBox.js:15-22):
 *   BoundedBox-BRW-004 — same-origin and remote HTTP images and documented base64 image data render; malformed or
 *                        script-bearing sources fail without executing anything and without corrupting annotations;
 *                        the widget stays usable after switching back to a good source.
 * The remote URL is the registered default (served locally by cy.intercept — the browser still loads it as a
 * cross-origin <img>); the same-origin image is a real frontend asset. The dev server sends no CSP header, so
 * only the browser's built-in URL handling is exercised.
 * Helpers: stubDefaultImageSource, openIconAppInViewer, addBoundedBoxesViaApi, annotationsProbe, expectAnnotations,
 * bboxState, waitForImage, drawRectangle, chooseLabel, svgDataUri.
 */
import { fake } from "Fixtures/fake";
import { boundedBoxSelector as S } from "Selectors/appBuilder/components/boundedBox";
import { boundedBoxText as T } from "Texts/appBuilder/components/boundedBox";
import { stubDefaultImageSource } from "Support/utils/appBuilder/components/image";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import {
    addBoundedBoxesViaApi,
    annotationsProbe,
    expectAnnotations,
    bboxState,
    waitForImage,
    drawRectangle,
    chooseLabel,
    svgDataUri,
} from "Support/utils/appBuilder/components/boundedBox";

const EMPTY_DEFAULT = { value: '{{[]}}' };
const EXEC_FLAG = '__bboxExecuted';

// sources that must never run code: a javascript: URL, an attribute break-out attempt, an HTML data URL with a
// script, and base64 that is not an image. Each would set window.__bboxExecuted if it ever executed.
const HOSTILE = {
    jsurl: `javascript:window.parent.${EXEC_FLAG}=1;window.${EXEC_FLAG}=1`,
    breakout: `x" onerror="window.${EXEC_FLAG}=2" data-x="`,
    htmldata: `data:text/html,<script>window.parent.${EXEC_FLAG}=3</script>`,
    badbase64: 'data:image/png;base64,%%%not-an-image%%%',
};

const wellFormed = (list) => {
    expect(list, 'annotations is a list').to.be.an('array');
    list.forEach((a) =>
        ['x', 'y', 'width', 'height'].forEach((k) => {
            expect(Number.isFinite(a[k]), `${k} is a finite number`).to.eq(true);
            expect(a[k], k).to.be.within(0, 100);
        })
    );
};

describe('Bounded Box — properties facet', () => {
    let labels;
    let pageErrors;

    beforeEach(() => {
        labels = [fake.firstName.slice(0, 8) || 'alpha', fake.lastName.slice(0, 8) || 'beta']; // dynamic label texts
        if (labels[0] === labels[1]) labels[1] = `${labels[1]}2`;
        pageErrors = [];
        // support/e2e.js swallows uncaught exceptions — record them so a crash cannot pass silently
        cy.on('uncaught:exception', (err) => {
            pageErrors.push(err.message);
            return false;
        });
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-BoundedBox-properties-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.get('body').realMouseMove(0, 0, { position: 'topLeft', scrollBehavior: false });
        cy.apiDeleteApp();
    });

    it('[BoundedBox-BRW-004] Same-origin, remote HTTP and base64 image sources load inside the widget and can be annotated', () => {
        stubDefaultImageSource(T.defaultImageUrlGlob);
        const sources = {
            sameorigin: T.sameOriginImage, // source: frontend/assets/images/logo-color.svg
            remote: T.defaultImageUrl, // source: boundedBox.js:121
            base64: T.base64Png,
        };
        addBoundedBoxesViaApi([
            ...Object.entries(sources).map(([name, url], i) => ({
                name,
                layout: { top: 40, left: 2 + i * 13, width: 12, height: 300 },
                properties: {
                    imageUrl: { value: url },
                    defaultValue: EMPTY_DEFAULT,
                    labels: { value: `{{${JSON.stringify(labels)}}}` },
                },
            })),
            annotationsProbe('probe', 'base64', { top: 360, left: 2 }),
        ]);
        openIconAppInViewer(S.root('base64'));

        Object.entries(sources).forEach(([name, url]) => {
            cy.get(S.img(name)).should('have.attr', 'src', url);
            // decoded with a real size and laid out (fitting inside the box is BRW-001's concern, canvas.cy.js)
            waitForImage(name);
        });
        // base64 decodes at its real pixel size (80x40 PNG)
        bboxState('base64', (s) => expect(s.natural).to.include({ width: T.base64PngSize.width, height: T.base64PngSize.height }));

        // annotating works on the base64 image
        drawRectangle('base64', [0.2, 0.2], [0.6, 0.7]);
        chooseLabel(S.editorControl('base64'), labels[0]);
        expectAnnotations('probe', (list) => {
            wellFormed(list);
            expect(list).to.have.length(1);
            expect(list[0].text).to.eq(labels[0]);
        });
        cy.then(() => expect(pageErrors, 'no page errors').to.deep.eq([]));
    });

    it('[BoundedBox-BRW-004] Malformed and script-bearing sources fail safely: nothing executes and annotations stay well-formed', () => {
        addBoundedBoxesViaApi([
            ...Object.entries(HOSTILE).map(([name, url], i) => ({
                name,
                layout: { top: 40 + Math.floor(i / 2) * 320, left: 2 + (i % 2) * 13, width: 12, height: 300 },
                // the registered two-rectangle default stays configured: a failed image must not install it with
                // broken geometry
                properties: { imageUrl: { value: url } },
            })),
            ...Object.keys(HOSTILE).map((name, i) =>
                annotationsProbe(`probe${name}`, name, { top: 40 + i * 70, left: 28, width: 12, height: 60 })
            ),
        ]);
        openIconAppInViewer(S.root('jsurl'));
        cy.wait(1500); // dynamic: give every source time to load / fail / (not) execute

        Object.entries(HOSTILE).forEach(([name, url]) => {
            bboxState(name, (s) => {
                // the URL is kept verbatim as one attribute value — no injected attributes
                expect(s.imgSrc, `${name}: src verbatim`).to.eq(url);
                expect(s.imgAttributes.filter((a) => a.startsWith('on') || a === 'data-x'), `${name}: no injected attributes`).to.deep.eq([]);
                expect(s.natural.width, `${name}: not decoded as an image`).to.eq(0);
                expect(s.highlights, `${name}: no overlays from a failed image`).to.have.length(0);
            });
            cy.get(`[data-cy="draggable-widget-probe${name}"]`).should(($el) => {
                const text = $el.text().trim();
                if (text) wellFormed(JSON.parse(text));
            });
        });
        cy.window().should((win) => {
            expect(win[EXEC_FLAG], 'no source executed in the app window').to.eq(undefined);
            expect(win.parent[EXEC_FLAG], 'no source executed in the parent window').to.eq(undefined);
        });
        cy.then(() => expect(pageErrors, 'no page errors').to.deep.eq([]));
    });

    it('[BoundedBox-BRW-004] Switching to a rejected source and back leaves the widget usable with well-formed annotations', () => {
        const good = svgDataUri(400, 200);
        // source key typed into a TextInput picks the bound image URL
        const urlMap = { bad: HOSTILE.badbase64, js: HOSTILE.jsurl };
        addBoundedBoxesViaApi([
            {
                name: 'switching',
                properties: {
                    imageUrl: { value: `{{(${JSON.stringify(urlMap)})[components.textinput1.value] || ${JSON.stringify(good)}}}` },
                    defaultValue: EMPTY_DEFAULT,
                    labels: { value: `{{${JSON.stringify(labels)}}}` },
                },
            },
            { type: 'TextInput', name: 'textinput1', layout: { top: 40, left: 16, width: 8, height: 40 } },
            annotationsProbe('probe', 'switching', { top: 100, left: 16 }),
        ]);
        openIconAppInViewer(S.root('switching'));
        waitForImage('switching');
        drawRectangle('switching', [0.1, 0.1], [0.4, 0.5]);
        chooseLabel(S.editorControl('switching'), labels[0]);
        expectAnnotations('probe', (list) => expect(list).to.have.length(1));

        ['bad', 'js'].forEach((key) => {
            cy.get('[data-cy="draggable-widget-textinput1"] input').first().clear().type(key);
            bboxState('switching', (s) => {
                expect(s.imgSrc).to.eq(urlMap[key]);
                expect(s.natural.width, `${key}: not an image`).to.eq(0);
            });
            expectAnnotations('probe', wellFormed);
        });

        // back to the good source: the image loads again and a new annotation commits with sane geometry
        cy.get('[data-cy="draggable-widget-textinput1"] input').first().clear();
        waitForImage('switching');
        drawRectangle('switching', [0.5, 0.3], [0.8, 0.8]);
        chooseLabel(S.editorControl('switching'), labels[1]);
        expectAnnotations('probe', (list) => {
            wellFormed(list);
            expect(list.map((a) => a.text), 'new annotation committed').to.include(labels[1]);
            const added = list.find((a) => a.text === labels[1]);
            expect(added.x).to.be.closeTo(50, 2);
            expect(added.width).to.be.closeTo(30, 2);
        });
        cy.window().should((win) => expect(win[EXEC_FLAG], 'nothing executed').to.eq(undefined));
        cy.then(() => expect(pageErrors, 'no page errors').to.deep.eq([]));
    });
});
