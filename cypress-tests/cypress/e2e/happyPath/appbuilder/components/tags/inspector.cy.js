/**
 * SPEC — Tags — inspector facet (scenario-scoped).
 * FOR AI: TESTING.md browser scenario (D-02, QA-owned):
 *   Tags-BRW-002 — the Editor's static-tag editor: "Add new option" appends `Tag N` with the next palette
 *                  colour; delete removes that tag; drag reorders tags on canvas; choosing an icon turns its
 *                  visibility on; a tag-visibility fx expression stays in fx mode after saving (d6af434381d).
 * Runtime: frontend/src/AppBuilder/RightSideBar/Inspector/Components/Tags.jsx. No RTL seam renders it
 * without mocking CodeHinter, so every effect is asserted on the real canvas + inspector.
 * Helpers: openEditorSidebar, addTagsViaApi, expectBadgeTitles, expectOptionTitles, openTagOption,
 * closeTagOption, pickTagIcon, iconPaths.
 */
import { fake } from "Fixtures/fake";
import { tagsSelector, tagsInspectorSelector } from "Selectors/appBuilder/components/tags";
import { tagsText } from "Texts/appBuilder/components/tags";
import { openEditorSidebar } from "Support/utils/commonWidget";
import {
    addTagsViaApi,
    expectBadgeTitles,
    expectOptionTitles,
    openTagOption,
    closeTagOption,
    pickTagIcon,
    iconPaths,
} from "Support/utils/appBuilder/components/tags";

const W = tagsText.defaultWidgetName;
const T = tagsText;
const SEL = tagsSelector;
const INS = tagsInspectorSelector;
const DEFAULTS = T.defaultTitles; // source: tags.js:189,197,205,213

// '#RRGGBB' (+ optional alpha hex) → the computed CSS colour string Chrome reports
const cssColor = (hex, alphaHex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    if (!alphaHex) return `rgb(${r}, ${g}, ${b})`;
    const a = Math.round((parseInt(alphaHex, 16) / 255) * 100) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};
const expectPaletteColours = (title, paletteIndex) => {
    const hex = T.palette[paletteIndex]; // source: Inspector Tags.jsx:78-97
    cy.get(SEL.badge(W, title))
        .should('have.css', 'color', cssColor(hex))
        .and('have.css', 'background-color', cssColor(hex, T.paletteBackgroundAlphaHex));
};
const openTagsInspector = () => {
    cy.get(SEL.container(W)).should('be.visible');
    openEditorSidebar(W);
    cy.get(INS.addOption).should('be.visible').and('contain.text', T.addNewOption);
};

describe('Tags — inspector facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tags-inspector-${Cypress._.uniqueId()}`);
        addTagsViaApi([{ name: W, layout: { top: 60, left: 10, width: 20, height: 60 } }]);
        cy.openApp('', undefined, undefined, SEL.container(W));
        openTagsInspector();
        expectOptionTitles(DEFAULTS);
        expectBadgeTitles(W, DEFAULTS);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Tags-BRW-002 (add) ───────────────────────────────────────────────────
    // Inspector Tags.jsx:77-131: title `Tag <n>` from options.length + 1, skipping taken titles/ids;
    // colour palette[options.length % 13], background = hex + '1A'; icon IconHome shown.
    it('[Tags-BRW-002] Add new option appends `Tag N` with the next palette colour; numbering skips a taken title', () => {
        const tag5 = T.newTagTitle(5);
        const tag6 = T.newTagTitle(6);
        const tag7 = T.newTagTitle(7);

        cy.get(INS.addOption).click();
        expectOptionTitles([...DEFAULTS, tag5]);
        expectBadgeTitles(W, [...DEFAULTS, tag5]);
        expectPaletteColours(tag5, 4); // 4 existing options → palette[4]
        cy.get(SEL.badgeIcon(W, tag5)).should('be.visible'); // iconVisibility {{true}} (Tags.jsx:114)
        cy.get(SEL.badge(W, tag5)).should('have.attr', 'aria-label', `${tag5} with icon`);

        cy.get(INS.addOption).click();
        expectBadgeTitles(W, [...DEFAULTS, tag5, tag6]);
        expectPaletteColours(tag6, 5);

        // delete Tag 5 → 5 options; the next candidate `Tag 6` is taken, so the new one is `Tag 7`
        cy.get(INS.optionRow(tag5)).realHover();
        cy.get(INS.deleteButton(tag5)).click();
        expectBadgeTitles(W, [...DEFAULTS, tag6]);
        cy.get(INS.addOption).click();
        expectOptionTitles([...DEFAULTS, tag6, tag7]);
        expectBadgeTitles(W, [...DEFAULTS, tag6, tag7]);
        expectPaletteColours(tag7, 5); // 5 options before the add → palette[5]

        // the added options are saved with the app
        cy.waitForAutoSave();
        cy.reload();
        cy.get(SEL.container(W), { timeout: 30000 }).should('be.visible');
        expectBadgeTitles(W, [...DEFAULTS, tag6, tag7]);
        expectPaletteColours(tag7, 5);
    });

    // ── Tags-BRW-002 (delete) ────────────────────────────────────────────────
    // Inspector Tags.jsx:133-136 + 361-375: the hover-only delete button removes exactly that option.
    it('[Tags-BRW-002] Delete removes that tag from the inspector list and the canvas', () => {
        const [first, victim, ...rest] = DEFAULTS;
        cy.get(INS.deleteButton(victim)).should('not.exist'); // hidden until hovered
        cy.get(INS.optionRow(victim)).realHover();
        cy.get(INS.deleteButton(victim)).should('be.visible').click();

        expectOptionTitles([first, ...rest]);
        expectBadgeTitles(W, [first, ...rest]);
        cy.get(SEL.badge(W, victim)).should('not.exist');

        cy.waitForAutoSave();
        cy.reload();
        cy.get(SEL.container(W), { timeout: 30000 }).should('be.visible');
        expectBadgeTitles(W, [first, ...rest]);
    });

    // ── Tags-BRW-002 (drag reorder) ──────────────────────────────────────────
    // Inspector Tags.jsx:63-75 + 316-326: react-beautiful-dnd onDragEnd → reorderOptions → paramUpdated.
    // Driven with rbd's keyboard sensor (focus handle, Space lift, ArrowDown, Space drop) — the same
    // onDragEnd path as a mouse drag.
    it('[Tags-BRW-002] Drag reorders the tags on the canvas', () => {
        const [a, b, ...rest] = DEFAULTS;
        cy.window().then((win) => {
            win.__tagsPageErrors = [];
            win.addEventListener('error', (e) => win.__tagsPageErrors.push(e.message));
        });

        cy.get(INS.optionItem(a)).focus();
        cy.realPress('Space'); // lift
        cy.wait(300); // rbd lift animation
        cy.realPress('ArrowDown'); // move one slot down
        cy.wait(300); // rbd move animation
        cy.realPress('Space'); // drop

        cy.window().then((win) => {
            cy.get(SEL.container(W)).should(($c) => {
                const order = Array.from($c[0].querySelectorAll('.badge')).map((el) => el.textContent);
                expect(order, `canvas order after drag (page errors: ${JSON.stringify(win.__tagsPageErrors)})`).to.deep.eq([b, a, ...rest]);
            });
        });
        expectOptionTitles([b, a, ...rest]);
    });

    // ── Tags-BRW-002 (icon) ──────────────────────────────────────────────────
    // Inspector Tags.jsx:172-184: onChangeIcon writes the icon AND iconVisibility {value:true}.
    it('[Tags-BRW-002] Choosing an icon shows it on the canvas even after the icon was hidden', () => {
        const title = DEFAULTS[1]; // 'info' — IconInfoCircle, visible (tags.js:200-201)
        const newIcon = 'IconStarFilled'; // dynamic: any Tabler icon whose name matches one grid cell

        iconPaths(SEL.badgeIcon(W, title)).as('oldIcon');
        openTagOption(title);
        cy.get(INS.iconVisibilityButton).click(); // eye → iconVisibility false (Visibility.jsx:13-16)
        cy.get(SEL.badgeIcon(W, title)).should('not.exist');
        cy.get(SEL.badge(W, title)).should('have.attr', 'aria-label', title);

        pickTagIcon(newIcon);
        cy.get(INS.iconField).should('contain.text', newIcon);
        cy.get(SEL.badgeIcon(W, title)).should('be.visible');
        cy.get(SEL.badge(W, title)).should('have.attr', 'aria-label', `${title} with icon`);
        // the canvas draws the chosen icon: same paths as the picker's preview, not the old icon
        iconPaths(INS.iconOnPanel).then((chosen) => {
            cy.get('@oldIcon').should('not.eq', chosen);
            cy.get(SEL.badgeIcon(W, title)).should(($svg) => {
                const d = Array.from($svg[0].querySelectorAll('path')).map((p) => p.getAttribute('d')).join('|');
                expect(d, 'canvas icon = chosen icon').to.eq(chosen);
            });
        });
    });

    // ── Tags-BRW-002 (tag-visibility fx — regression d6af434381d) ─────────────
    // Inspector Tags.jsx:138-154: a `visible` edit merges into the option, keeping `fxActive` (set by
    // handleOnFxPress, Tags.jsx:186-200). Before the fix the edit replaced the object and fx switched off.
    it('[Tags-BRW-002] A tag-visibility fx expression stays in fx mode after saving and reloading', () => {
        const title = DEFAULTS[1]; // 'info'
        const expr = '{{Boolean(0)}}'; // dynamic: an fx expression resolving to false

        openTagOption(title);
        cy.get(INS.tagVisibilityToggle).should('exist');
        cy.get(INS.tagVisibilityFx).click();
        cy.get(INS.tagVisibilityFx).should('have.class', 'active');
        cy.get(INS.tagVisibilityInput).clearAndTypeOnCodeMirror(expr);
        cy.get(INS.tagVisibilityInput).find('.cm-content').should('have.text', expr);

        const expectStillFx = () => {
            openTagOption(title);
            cy.get(INS.tagVisibilityFx).should('have.class', 'active');
            cy.get(INS.tagVisibilityInput).find('.cm-content').should('have.text', expr);
            cy.get(INS.tagVisibilityToggle).should('not.exist');
            expectBadgeTitles(W, DEFAULTS.filter((t) => t !== title));
        };

        // CodeHinter commits on blur: closing the popover saves the expression → the tag hides on the canvas
        closeTagOption();
        expectBadgeTitles(W, DEFAULTS.filter((t) => t !== title));
        expectStillFx(); // reopened popover: the saved edit kept fxActive

        cy.waitForAutoSave();
        cy.reload();
        cy.get(SEL.container(W), { timeout: 30000 }).should('be.visible');
        openTagsInspector();
        expectStillFx(); // saved definition
    });
});
