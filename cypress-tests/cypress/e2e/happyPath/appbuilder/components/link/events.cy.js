/**
 * SPEC — Link — events facet (native navigation).
 * FOR AI: TESTING.md browser scenarios:
 *   Link-BRW-004 — New Tab opens the href in a new browsing context; Same Tab navigates the current tab
 *   Link-BRW-005 — a real click on the icon neither navigates nor fires onClick; a click on `.link-text` does both
 * Run in the viewer (the running app) on Links seeded through the components API, clicked with real CDP
 * mouse events (realClick) so the browser's own hit-testing decides the target (link.scss: `a` has
 * `pointer-events: none`, only `.link-text` has `pointer-events: all`).
 * New Tab: Cypress cannot drive a second tab, so trackAnchorClicks records the native activation (href,
 * target `_blank`, not cancelled by the widget) and then cancels it; the current tab must stay put.
 * Same Tab: the href is this app's own viewer URL with a unique query, so a real full navigation is observable
 * (new URL + a fresh window object).
 * Helpers: addLinksViaApi, openLinkAppInViewer, viewerPath, trackAnchorClicks, anchorClicks, markWindow,
 * expectWindowMarked.
 */
import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { linkSelector } from "Selectors/appBuilder/components/link";
import { linkText } from "Texts/appBuilder/components/link";
import {
    addLinksViaApi,
    openLinkAppInViewer,
    viewerPath,
    trackAnchorClicks,
    anchorClicks,
    markWindow,
    expectWindowMarked,
} from "Support/utils/appBuilder/components/link";

const T = linkText;

describe('Link — events facet', () => {
    let navKey;
    let externalUrl;
    let sameTabUrl;

    beforeEach(() => {
        navKey = `linknav=${Cypress._.uniqueId()}${Date.now()}`; // dynamic: unique query marker
        externalUrl = `https://example.com/${fake.firstName.toLowerCase()}`; // dynamic: external href
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Link-events-${Cypress._.uniqueId()}`);
        cy.then(() => {
            sameTabUrl = `${Cypress.config('baseUrl')}${viewerPath(Cypress.env('appId'), `&${navKey}`)}`;
        });
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Link-BRW-004 ─────────────────────────────────────────────────────────
    // Link.jsx:160-161: href = linkTarget; target={targetType === 'new' && '_blank'} (link.js:33-37, D-05).
    it('[Link-BRW-004] New Tab opens the href in a new browsing context and leaves the current tab', () => {
        addLinksViaApi([
            { name: 'link1', properties: { linkTarget: { value: externalUrl }, targetType: { value: T.targetNew } } },
        ]);
        openLinkAppInViewer(linkSelector.linkText('link1'));
        cy.get(linkSelector.anchor('link1'))
            .should('have.attr', 'target', T.blankTarget)
            .and('have.attr', 'href', externalUrl);

        cy.location('href').then((startHref) => {
            markWindow();
            trackAnchorClicks();
            cy.get(linkSelector.linkText('link1')).realClick();
            anchorClicks().should((clicks) => {
                expect(clicks, 'one native link activation').to.have.length(1);
                expect(clicks[0].href, 'opens the authored href').to.eq(externalUrl);
                expect(clicks[0].target, 'in a new browsing context').to.eq(T.blankTarget);
                expect(clicks[0].prevented, 'widget does not cancel the navigation').to.eq(false);
            });
            cy.location('href').should('eq', startHref);
            expectWindowMarked(true);
        });
    });

    it('[Link-BRW-004] Same Tab navigates the current tab to the href', () => {
        cy.then(() =>
            addLinksViaApi([
                { name: 'link1', properties: { linkTarget: { value: sameTabUrl }, targetType: { value: T.targetSame } } },
            ])
        );
        openLinkAppInViewer(linkSelector.linkText('link1'));
        cy.get(linkSelector.anchor('link1')).should('not.have.attr', 'target'); // D-05: target={false} omitted
        cy.location('search').should('not.contain', navKey);

        markWindow();
        cy.get(linkSelector.linkText('link1')).realClick();
        cy.location('search', { timeout: 20000 }).should('contain', navKey);
        cy.location('pathname').should('contain', Cypress.env('appId'));
        expectWindowMarked(false); // a real document navigation, not an in-app route change
    });

    // ── Link-BRW-005 ─────────────────────────────────────────────────────────
    // link.scss: `a { pointer-events: none }`, `.link-text { pointer-events: all }`; the icon box is a sibling
    // of `.link-text` (Link.jsx:197-213), so a real pointer hit on the icon lands on the wrapper (D-07).
    it('[Link-BRW-005] Clicking the icon does not navigate (same tab); clicking the text does', () => {
        cy.then(() =>
            addLinksViaApi([
                {
                    name: 'link1',
                    properties: { linkTarget: { value: sameTabUrl }, targetType: { value: T.targetSame } },
                    styles: { iconVisibility: { value: true } },
                },
            ])
        );
        openLinkAppInViewer(linkSelector.icon('link1'));

        markWindow();
        cy.get(linkSelector.icon('link1')).should('be.visible').realClick();
        cy.wait(1500); // dynamic: give a (wrong) navigation time to start
        cy.location('search').should('not.contain', navKey);
        expectWindowMarked(true);

        cy.get(linkSelector.linkText('link1')).realClick();
        cy.location('search', { timeout: 20000 }).should('contain', navKey);
        expectWindowMarked(false);
    });

    it('[Link-BRW-005] Clicking the icon neither activates the link nor fires onClick; clicking the text does both', () => {
        const message = `${fake.firstName} onClick`; // dynamic: Show-alert message
        addLinksViaApi([
            {
                name: 'link1',
                properties: { linkTarget: { value: externalUrl }, targetType: { value: T.targetNew } },
                styles: { iconVisibility: { value: true } },
                events: [{ eventId: 'onClick', message }], // link.js:101
            },
        ]);
        openLinkAppInViewer(linkSelector.icon('link1'));
        trackAnchorClicks();

        cy.get(linkSelector.icon('link1')).should('be.visible').realClick();
        cy.wait(1500); // dynamic: time for a (wrong) alert to render
        anchorClicks().should('have.length', 0);
        cy.get('body').should('not.contain.text', message);

        cy.get(linkSelector.linkText('link1')).realClick();
        anchorClicks().should((clicks) => {
            expect(clicks, 'text click activates the link').to.have.length(1);
            expect(clicks[0].href).to.eq(externalUrl);
            expect(clicks[0].prevented, 'navigation not cancelled').to.eq(false);
        });
        cy.verifyToastMessage(commonSelectors.toastMessage, message, false);
    });
});
