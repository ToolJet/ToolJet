/**
 * SPEC — Color Picker — userflow facet.
 * FOR AI: TESTING.md browser scenario only:
 *   ColorPicker-BRW-001 — dragging the real SketchPicker's saturation square, hue strip and alpha strip picks a
 *                         colour that matches the pointer position
 * Real CDP mouse drags (press at one point → several moves → release at another) on react-color's pointer-tracking
 * containers. react-color maps the pointer to the colour (helpers/saturation.js: s = x/width, v = 1 - y/height;
 * helpers/hue.js: h = 360·x/width; helpers/alpha.js: a = round(100·x/width)/100); ColorPicker.jsx:229-246
 * (handleColorChange via SketchPicker onChangeComplete, ColorPicker.jsx:414-421) exposes the result. Every drag
 * starts far from where it ends, so a press-only (no drag tracking) implementation would leave the start colour.
 * The result is read three ways: the trigger's colour code (ColorPicker.jsx:379), the exposed selectedColorHex /
 * selectedColorRGBA through a bound Text widget, and the picker's own pointer position.
 * Helpers: addColorPickersViaApi, openColorPickerAppInViewer, openColorPickerPopover, dragColorSlider,
 * colorPickerState, parseRgba, parseHex, rgbToHsv.
 */
import { fake } from "Fixtures/fake";
import { colorPickerSelector as S } from "Selectors/appBuilder/components/colorPicker";
import { colorPickerText as T } from "Texts/appBuilder/components/colorPicker";
import {
    addColorPickersViaApi,
    openColorPickerAppInViewer,
    openColorPickerPopover,
    dragColorSlider,
    colorPickerState,
    parseRgba,
    parseHex,
    rgbToHsv,
} from "Support/utils/appBuilder/components/colorPicker";

const W = T.defaultWidgetName;
const PROBE = 'probe';
const ALPHA_ON = { showAlpha: { value: '{{true}}' } }; // colorPicker.js:301 default {{false}}
// pixel → colour rounding (1px of a ~260px square ≈ 0.004, 8-bit channels ≈ 0.004) — well inside these tolerances
const SV_TOL = 0.02;
const HUE_TOL = 3; // degrees (1px of the hue strip ≈ 1.4°)
const A_TOL = 0.015;

// the default colour's HSV (#4368e3, colorPicker.js:299) — what the picker starts from
const START = rgbToHsv(T.defaultColor);

const seed = (properties = {}) =>
    cy.then(() =>
        addColorPickersViaApi([
            { name: W, layout: { top: 40, left: 2, width: 12, height: 40 }, properties },
            {
                type: 'Text',
                name: PROBE,
                layout: { top: 40, left: 20, width: 20, height: 40 },
                properties: {
                    text: { value: `{{components.${W}.selectedColorHex + "|" + components.${W}.selectedColorRGBA}}` },
                },
            },
        ])
    );

// exposed selectedColorHex / selectedColorRGBA through the bound Text widget
const readProbe = ($el) => {
    const [hex, rgba] = $el.text().trim().split('|');
    return { hex, rgba, hexColor: parseHex(hex), rgbaColor: parseRgba(rgba) };
};
const exposed = (assertFn) =>
    cy
        .get(`[data-cy="draggable-widget-${PROBE}"]`, { timeout: 30000 })
        .should(($el) => assertFn(readProbe($el)));

const expectHsv = (rgb, { h, s, v }, context) => {
    const hsv = rgbToHsv(rgb);
    if (h !== undefined) expect(hsv.h, `${context}: hue`).to.be.closeTo(h, HUE_TOL);
    if (s !== undefined) expect(hsv.s, `${context}: saturation`).to.be.closeTo(s, SV_TOL);
    if (v !== undefined) expect(hsv.v, `${context}: value`).to.be.closeTo(v, SV_TOL);
};

// trigger text, exposed hex and exposed rgba all describe the same colour, with the expected HSV + alpha
const expectPicked = ({ h, s, v, a = 1, alpha = false }) => {
    exposed(({ hex, rgba, hexColor, rgbaColor }) => {
        expect(hexColor, `exposed selectedColorHex "${hex}" is a hex colour`).to.not.be.null;
        expect(rgbaColor, `exposed selectedColorRGBA "${rgba}"`).to.not.be.null;
        // showAlpha on → 8-digit hex (ColorPicker.jsx:233-235), off → react-color's 6-digit hex
        expect(hex, 'hex digits').to.match(alpha ? /^#[0-9a-f]{8}$/ : /^#[0-9a-f]{6}$/);
        expectHsv(rgbaColor, { h, s, v }, 'selectedColorRGBA');
        expect(rgbaColor.a, 'selectedColorRGBA alpha').to.be.closeTo(a, A_TOL);
        expect(hexColor.r, 'hex red = rgba red').to.eq(rgbaColor.r);
        expect(hexColor.g, 'hex green = rgba green').to.eq(rgbaColor.g);
        expect(hexColor.b, 'hex blue = rgba blue').to.eq(rgbaColor.b);
        expect(hexColor.a, 'hex alpha byte = rgba alpha').to.be.closeTo(a, A_TOL);
    });
    // the trigger shows the same hex (format hex, colorPicker.js:300) and paints the swatch with the rgba
    // (ColorPicker.jsx:376 getBackground → linear-gradient(<rgba>, <rgba>) over the checkerboard)
    cy.get(`[data-cy="draggable-widget-${PROBE}"]`).then(($el) => {
        const { hex, rgbaColor } = readProbe($el);
        cy.get(S.colorCode(W)).should('have.text', hex);
        colorPickerState(W, (st) => {
            const painted = parseRgba(st.previewBackground);
            expect(painted, `swatch background "${st.previewBackground}"`).to.not.be.null;
            expect([painted.r, painted.g, painted.b], 'swatch rgb').to.deep.eq([rgbaColor.r, rgbaColor.g, rgbaColor.b]);
            expect(painted.a, 'swatch alpha').to.be.closeTo(rgbaColor.a, A_TOL);
        });
    });
};

const expectUnchangedDefault = () =>
    exposed(({ hex, rgba }) => {
        expect(hex, 'default selectedColorHex').to.eq(T.defaultColor.hex);
        expect(rgba, 'default selectedColorRGBA').to.eq(T.defaultColor.rgba);
    });

describe('Color Picker — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ColorPicker-userflow-${Cypress._.uniqueId()}`);
        // park the real mouse away from the widgets (real mouse position persists across tests)
        cy.get('body').realMouseMove(1, 1, { position: 'topLeft', scrollBehavior: false });
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[ColorPicker-BRW-001] Dragging the saturation square picks the saturation/brightness under the pointer, keeping the hue', () => {
        seed();
        openColorPickerAppInViewer(S.button(W));
        expectUnchangedDefault();
        openColorPickerPopover(W);
        // showAlpha off (colorPicker.js:301) → Sketch hides the alpha strip
        colorPickerState(W, (st) => expect(st.alphaDisplay, 'alpha strip hidden while showAlpha is off').to.eq('none'));

        const to = { x: 0.3, y: 0.4 }; // dynamic: drop point → s 0.30, v 0.60 (start s≈0.70 v≈0.89)
        dragColorSlider(W, 'saturation', { x: 0.9, y: 0.1 }, to);

        colorPickerState(W, (st) => {
            expect(st.expanded, 'popover stays open during and after the drag').to.eq('true');
            expect(st.saturationPointer.x, 'pointer x follows the release point').to.be.closeTo(to.x, SV_TOL);
            expect(st.saturationPointer.y, 'pointer y follows the release point').to.be.closeTo(to.y, SV_TOL);
        });
        expectPicked({ h: START.h, s: to.x, v: 1 - to.y });
    });

    it('[ColorPicker-BRW-001] Dragging the hue strip picks the hue under the pointer, keeping saturation and brightness', () => {
        seed();
        openColorPickerAppInViewer(S.button(W));
        expectUnchangedDefault();
        openColorPickerPopover(W);

        const to = 1 / 3; // dynamic: one third of the strip → hue 120° (start ≈ 226°)
        dragColorSlider(W, 'hue', { x: 0.9 }, { x: to });

        colorPickerState(W, (st) => {
            expect(st.expanded, 'popover stays open').to.eq('true');
            expect(st.huePointer.x, 'hue pointer follows the release point').to.be.closeTo(to, 0.02);
        });
        expectPicked({ h: 360 * to, s: START.s, v: START.v });
    });

    it('[ColorPicker-BRW-001] With alpha on, dragging the alpha strip sets the opacity under the pointer; the three sliders compose', () => {
        seed(ALPHA_ON);
        openColorPickerAppInViewer(S.button(W));
        openColorPickerPopover(W);
        colorPickerState(W, (st) => {
            expect(st.alphaDisplay, 'alpha strip shown while showAlpha is on').to.not.eq('none');
            expect(st.alpha.width, 'alpha strip laid out').to.be.gt(50);
        });

        const alphaTo = 0.4; // dynamic: 40 % of the strip → a 0.40 (start 1)
        dragColorSlider(W, 'alpha', { x: 0.95 }, { x: alphaTo });
        colorPickerState(W, (st) => expect(st.alphaPointer.x, 'alpha pointer follows').to.be.closeTo(alphaTo, 0.02));
        // only the opacity moved: the rgb channels are still the default colour's
        exposed(({ rgbaColor }) => {
            expect(rgbaColor.r, 'red kept').to.eq(T.defaultColor.r);
            expect(rgbaColor.g, 'green kept').to.eq(T.defaultColor.g);
            expect(rgbaColor.b, 'blue kept').to.eq(T.defaultColor.b);
        });
        expectPicked({ h: START.h, s: START.s, v: START.v, a: alphaTo, alpha: true });

        // then hue and saturation: each drag keeps what the others set
        const hueTo = 0.75; // dynamic: → hue 270°
        dragColorSlider(W, 'hue', { x: 0.1 }, { x: hueTo });
        expectPicked({ h: 360 * hueTo, s: START.s, v: START.v, a: alphaTo, alpha: true });

        const satTo = { x: 0.6, y: 0.2 }; // dynamic: → s 0.60, v 0.80
        dragColorSlider(W, 'saturation', { x: 0.1, y: 0.9 }, satTo);
        expectPicked({ h: 360 * hueTo, s: satTo.x, v: 1 - satTo.y, a: alphaTo, alpha: true });
    });

    it('[ColorPicker-BRW-001] On the editor canvas, dragging the sliders picks the colour under the pointer', () => {
        seed();
        cy.openApp('', undefined, undefined, S.button(W));
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        expectUnchangedDefault();
        openColorPickerPopover(W);

        const satTo = { x: 0.8, y: 0.3 }; // dynamic: → s 0.80, v 0.70
        dragColorSlider(W, 'saturation', { x: 0.2, y: 0.8 }, satTo);
        expectPicked({ h: START.h, s: satTo.x, v: 1 - satTo.y });

        const hueTo = 0.1; // dynamic: → hue 36°
        dragColorSlider(W, 'hue', { x: 0.8 }, { x: hueTo });
        expectPicked({ h: 360 * hueTo, s: satTo.x, v: 1 - satTo.y });
    });
});
