/**
 * SPEC — Bounded Box — userflow facet.
 * FOR AI: TESTING.md browser scenario:
 *   BoundedBox-BRW-005 — rectangle drag and point selection work with a real pointer and real touch at real
 *                        geometry; the keyboard baseline (D-04 recommendation: native, named, keyboard-operable
 *                        label and delete controls) is operable and focus is not trapped.
 * Real input only: cypress-real-events (CDP mouse/keyboard) and CDP Input.dispatchTouchEvent with touch emulation.
 * Apps are seeded through the components API with SVG data-URI images (no network) and opened in the viewer; the
 * public `annotations` value is read through a probe Text widget.
 * Helpers: addBoundedBoxesViaApi, annotationsProbe, expectAnnotations, bboxState, waitForImage, drawRectangle,
 * clickPoint, chooseLabel, setTouchEmulation, touchDrag, touchTap, svgDataUri, openIconAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { boundedBoxSelector as S } from "Selectors/appBuilder/components/boundedBox";
import { boundedBoxText as T } from "Texts/appBuilder/components/boundedBox";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import {
    addBoundedBoxesViaApi,
    annotationsProbe,
    expectAnnotations,
    bboxState,
    waitForImage,
    drawRectangle,
    clickPoint,
    chooseLabel,
    setTouchEmulation,
    touchDrag,
    touchTap,
    svgDataUri,
} from "Support/utils/appBuilder/components/boundedBox";

const BB = 'bbox';
const PROBE = 'probe';
const GEO_TOL = 2; // % of the image — pointer coordinates are integer CSS px
const BOTH_DEVICES = { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{true}}' } }; // boundedBox.js:10-11

const seed = (selector, labels, extra = []) =>
    addBoundedBoxesViaApi([
        {
            name: BB,
            layout: { top: 40, left: 2, width: 12, height: 300 },
            mobileLayout: { top: 40, left: 0, width: 43 }, // full phone width (43-column grid)
            others: BOTH_DEVICES,
            properties: {
                imageUrl: { value: svgDataUri(400, 200) }, // dynamic: landscape 2:1 image
                defaultValue: { value: '{{[]}}' }, // start empty: the exposed list then only holds what the user commits
                selector: { value: selector },
                labels: { value: `{{${JSON.stringify(labels)}}}` },
            },
        },
        annotationsProbe(PROBE, BB, { top: 40, left: 20 }, { others: BOTH_DEVICES, mobileLayout: { top: 360, left: 0, width: 43 } }),
        ...extra,
    ]);

const expectGeometry = (actual, expected) => {
    Object.entries(expected).forEach(([k, v]) => {
        if (typeof v === 'number') expect(actual[k], k).to.be.closeTo(v, GEO_TOL);
        else expect(actual[k], k).to.eq(v);
    });
};

describe('Bounded Box — userflow facet', () => {
    let labels;

    beforeEach(() => {
        labels = [fake.firstName.slice(0, 8) || 'alpha', fake.lastName.slice(0, 8) || 'beta']; // dynamic label texts
        if (labels[0] === labels[1]) labels[1] = `${labels[1]}2`;
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-BoundedBox-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        setTouchEmulation(false);
        cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
        cy.get('body').realMouseMove(0, 0, { position: 'topLeft', scrollBehavior: false });
        cy.apiDeleteApp();
    });

    describe('pointer', () => {
        it('[BoundedBox-BRW-005] Rectangle: a real mouse drag draws the dragged geometry and a label commits it', () => {
            seed(T.selectorRectangle, labels);
            openIconAppInViewer(S.root(BB));
            waitForImage(BB);
            expectAnnotations(PROBE, (list) => expect(list, 'empty default').to.deep.eq([]));

            drawRectangle(BB, [0.2, 0.2], [0.5, 0.6]);
            // the in-progress selection is drawn over exactly the dragged region and the label editor opens under it
            bboxState(BB, (s) => {
                expect(s.selection, 'selection box').to.not.eq(null);
                expect(s.selection.left - s.img.left, 'selection left').to.be.closeTo(s.img.width * 0.2, 3);
                expect(s.selection.top - s.img.top, 'selection top').to.be.closeTo(s.img.height * 0.2, 3);
                expect(s.selection.width, 'selection width').to.be.closeTo(s.img.width * 0.3, 3);
                expect(s.selection.height, 'selection height').to.be.closeTo(s.img.height * 0.4, 3);
                expect(s.editor, 'label editor').to.not.eq(null);
            });
            chooseLabel(S.editorControl(BB), labels[1]);

            expectAnnotations(PROBE, (list) => {
                expect(list, 'one committed annotation').to.have.length(1);
                expectGeometry(list[0], { type: T.selectorRectangle, x: 20, y: 20, width: 30, height: 40, text: labels[1] });
                expect(list[0].id, 'generated id').to.be.a('string').and.not.be.empty;
            });
            bboxState(BB, (s) => {
                expect(s.highlights, 'committed highlight').to.have.length(1);
                expect(s.highlights[0].text, 'selected label').to.eq(labels[1]);
                expect(s.editor, 'editor closed').to.eq(null);
            });
        });

        it('[BoundedBox-BRW-005] Point: a real click places zero-size point geometry under the pointer', () => {
            seed(T.selectorPoint, labels);
            openIconAppInViewer(S.root(BB));
            waitForImage(BB);

            clickPoint(BB, [0.3, 0.7]);
            bboxState(BB, (s) => expect(s.editor, 'label editor opened by the click').to.not.eq(null));
            chooseLabel(S.editorControl(BB), labels[0]);

            expectAnnotations(PROBE, (list) => {
                expect(list, 'one committed point').to.have.length(1);
                expectGeometry(list[0], { type: T.selectorPoint, x: 30, y: 70, width: 0, height: 0, text: labels[0] });
            });
            // the dot is centred-ish on the clicked spot: its top-left is the clicked point (RenderHighlight.jsx:16-18)
            bboxState(BB, (s) => {
                expect(s.highlights).to.have.length(1);
                const dot = s.highlights[0].box;
                expect(dot.left - s.img.left, 'dot x').to.be.closeTo(s.img.width * 0.3, 3);
                expect(dot.top - s.img.top, 'dot y').to.be.closeTo(s.img.height * 0.7, 3);
                expect(dot.width, 'dot width').to.be.closeTo((s.img.width * T.pointHighlightSize) / 100, 1);
            });
        });
    });

    describe('touch', () => {
        // phone viewport: the runner shows the AUT unscaled; the mobile layout stacks the widgets full width
        const PHONE = { width: 375, height: 640 };
        const openOnPhone = () => {
            cy.viewport(PHONE.width, PHONE.height);
            setTouchEmulation(true);
            // ?layout=mobile: the viewer's mobile switch reads screen width, which cy.viewport does not change
            openIconAppInViewer(S.root(BB), { query: '&layout=mobile' });
            waitForImage(BB);
            // the mobile layout first paints at a placeholder width, then settles to the phone grid
            bboxState(BB, (s) => expect(s.img.width, 'laid out on the phone grid').to.be.gt(PHONE.width / 2));
            cy.get(S.img(BB)).first().scrollIntoView({ block: 'center' });
            cy.wait(300); // dynamic: let the scroll land before reading touch coordinates
        };

        it('[BoundedBox-BRW-005] Touch: a tap places a point and the label can be chosen', () => {
            seed(T.selectorPoint, labels);
            openOnPhone();

            touchTap(BB, [0.4, 0.5]);
            bboxState(BB, (s) => expect(s.editor, 'label editor opened by the tap').to.not.eq(null));
            chooseLabel(S.editorControl(BB), labels[0]);
            expectAnnotations(PROBE, (list) => {
                expect(list, 'one committed point').to.have.length(1);
                expectGeometry(list[0], { type: T.selectorPoint, x: 40, y: 50, width: 0, height: 0, text: labels[0] });
            });
        });

        // PRODUCT BUG (kept red): BoundedBox.jsx:189-228 never passes `allowTouch` to react-image-annotation, so its
        // touch listeners (Annotation.js addTargetTouchEventListeners) are never attached and a finger drag is only
        // a page scroll — no selection, no editor, nothing committed. A tap still works (synthesised click).
        it('[BoundedBox-BRW-005] Touch: a finger drag draws a rectangle', () => {
            seed(T.selectorRectangle, labels);
            openOnPhone();

            touchDrag(BB, [0.2, 0.2], [0.6, 0.7]);
            bboxState(BB, (s) => {
                expect({ selection: !!s.selection, editor: !!s.editor }, 'touch drag drew a selection and opened the editor')
                    .to.deep.eq({ selection: true, editor: true });
            });
            chooseLabel(S.editorControl(BB), labels[1]);
            expectAnnotations(PROBE, (list) => {
                expect(list).to.have.length(1);
                expectGeometry(list[0], { type: T.selectorRectangle, x: 20, y: 20, width: 40, height: 50, text: labels[1] });
            });
        });
    });

    describe('keyboard', () => {
        const focusedIn = (selector) =>
            cy.document().should((doc) => {
                const el = doc.activeElement;
                expect(el && el.closest(selector) !== null, `focus inside ${selector}`).to.eq(true);
            });

        it('[BoundedBox-BRW-005] Keyboard: label pickers are reachable by Tab, operable by arrow keys + Enter, and focus moves on', () => {
            seed(T.selectorRectangle, labels, [
                { type: 'TextInput', name: 'before', layout: { top: 40, left: 34, width: 6, height: 40 }, others: BOTH_DEVICES },
            ]);
            openIconAppInViewer(S.root(BB));
            waitForImage(BB);

            // create with the pointer (no keyboard drawing model — D-04), then pick the label from the keyboard
            drawRectangle(BB, [0.1, 0.1], [0.3, 0.4]);
            cy.get(S.editorInput(BB)).first().focus();
            cy.realPress('ArrowDown');
            cy.get(S.option).should('have.length', labels.length);
            cy.realPress('ArrowDown');
            cy.realPress('Enter');
            expectAnnotations(PROBE, (list) => {
                expect(list).to.have.length(1);
                expect(list[0].text, 'label chosen by keyboard').to.eq(labels[1]);
            });

            // the committed highlight's label picker is in the Tab order: walk backwards from another widget's input
            // (the bounded box precedes it in the DOM)
            cy.get('[data-cy="draggable-widget-before"] input').first().focus();
            const shiftTabUntilInside = (n) =>
                cy.document().then((doc) => {
                    if (doc.activeElement && doc.activeElement.closest(S.highlightRow(BB))) return;
                    expect(n, 'label picker reached within 8 Shift+Tab presses').to.be.lt(8);
                    cy.realPress(['Shift', 'Tab']);
                    shiftTabUntilInside(n + 1);
                });
            shiftTabUntilInside(0);
            focusedIn(S.highlightRow(BB));

            // relabel from the keyboard
            cy.realPress('ArrowDown');
            cy.get(S.option).should('have.length', labels.length);
            cy.realPress('ArrowUp');
            cy.realPress('Enter');
            expectAnnotations(PROBE, (list) => {
                expect(list).to.have.length(1);
                expect(list[0].text, 'relabelled by keyboard').to.eq(labels[0]);
            });

            // not trapped: Shift+Tab leaves the widget backwards, Tab comes back
            cy.realPress(['Shift', 'Tab']);
            cy.document().should((doc) => {
                const el = doc.activeElement;
                expect(el && el.closest(S.draggableWidget(BB)), 'focus left the bounded box').to.eq(null);
                expect(el, 'focus not dropped to <body>').to.not.eq(doc.body);
            });
            cy.realPress('Tab');
            focusedIn(S.highlightRow(BB));
        });

        // PRODUCT BUG (kept red): choosing a label in the create editor unmounts it (RenderEditor is only rendered
        // while a selection is being edited, Annotation.js renderEditor) and nothing moves focus to the new
        // highlight's label picker, so a keyboard user is dropped to <body> and must Tab from the top of the page.
        it('[BoundedBox-BRW-005] Keyboard: committing a label keeps focus on the new annotation instead of dropping it to <body>', () => {
            seed(T.selectorRectangle, labels);
            openIconAppInViewer(S.root(BB));
            waitForImage(BB);
            drawRectangle(BB, [0.1, 0.1], [0.3, 0.4]);
            cy.get(S.editorInput(BB)).first().focus();
            cy.realPress('ArrowDown');
            cy.get(S.option).should('have.length', labels.length);
            cy.realPress('Enter');
            expectAnnotations(PROBE, (list) => expect(list).to.have.length(1));
            cy.document().should((doc) => {
                expect(doc.activeElement, 'focus after committing').to.not.eq(doc.body);
                expect(doc.activeElement.closest(S.draggableWidget(BB)), 'focus stays in the bounded box').to.not.eq(null);
            });
        });

        // D-04 (recommendation, unanswered): delete must be a native, named, keyboard-operable control.
        // PRODUCT GAP (kept red): RenderHighlight.jsx:47-74 renders delete as a bare <span onClick> with an icon only —
        // tabIndex -1, no role, no accessible name — so keyboard users cannot remove an annotation.
        it('[BoundedBox-BRW-005] Keyboard: the delete control is a named, focusable button that deletes on Enter', () => {
            seed(T.selectorRectangle, labels);
            openIconAppInViewer(S.root(BB));
            waitForImage(BB);
            drawRectangle(BB, [0.1, 0.1], [0.3, 0.4]);
            chooseLabel(S.editorControl(BB), labels[0]);
            expectAnnotations(PROBE, (list) => expect(list).to.have.length(1));

            // control: the pointer can delete it (the span works for the mouse)
            cy.get(S.highlightDelete(BB)).first().realClick({ scrollBehavior: false });
            expectAnnotations(PROBE, (list) => expect(list, 'deleted by pointer').to.deep.eq([]));

            drawRectangle(BB, [0.1, 0.1], [0.3, 0.4]);
            chooseLabel(S.editorControl(BB), labels[0]);
            expectAnnotations(PROBE, (list) => expect(list).to.have.length(1));
            bboxState(BB, (s) => {
                const del = s.highlights[0].del;
                expect(
                    { focusable: del.tabIndex >= 0, button: del.tag === 'button' || del.role === 'button', named: !!del.name },
                    'delete control semantics'
                ).to.deep.eq({ focusable: true, button: true, named: true });
            });
            cy.get(S.highlightDelete(BB)).first().focus();
            cy.realPress('Enter');
            expectAnnotations(PROBE, (list) => expect(list, 'deleted by keyboard').to.deep.eq([]));
        });
    });
});
