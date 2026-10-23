import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * ToolJet has no Tailwind preflight, and the pack's reset left the browser's `<button>` padding (1px 6px) in place, so
 * a pack button with no padding class of its own drew 6px wider than its classes say: a Switch's thumb ran 4px past
 * its track (round 5). The reset now zeroes the padding of every button inside a UI 2.0 widget root, and of nothing
 * else: a ToolJet widget placed in a pack container's canvas (a List view row, a tab, a Dialog body; `.sub-canvas`)
 * keeps its own.
 *
 * jsdom applies a user-agent stylesheet (button padding 1px 6px) and the rules it is given, but not Tailwind's
 * utilities. So this mounts every widget (and opens its overlay), loads the reset's button rule, and requires each
 * button to read 0 padding unless the pack sets its padding itself (a padding utility class or an inline padding).
 * jsdom cannot match a complex selector inside :where(), so the rule is loaded without its zero-specificity wrapper;
 * which buttons it matches is the same.
 */
import fs from 'fs';
import path from 'path';
import * as sass from 'sass';
import { act } from '@testing-library/react';
import { CONFIGS, NAMES, defaultsOf, installGuards, mountCase, styleDefaultsOf } from './fuzz/harness';
import { OPENS } from './packWidgets';

installGuards();

const SCSS = path.join(__dirname, '../_shared/styles/shadcn.scss');
const css = sass.compileString(fs.readFileSync(SCSS, 'utf8')).css;

/** The reset's rules that zero a button's padding, as [selector list, declarations]. */
const buttonResets = () =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selectors, body]) => [selectors.trim(), body])
    .filter(([selectors, body]) => /\bbutton\b/.test(selectors) && /(^|;)\s*padding:\s*0;/.test(body));

// `:where(A)` -> `A`, for each selector of a list (jsdom's selector engine stops at a complex :where argument).
const unwrapWhere = (selector) => selector.replace(/^:where\((.*)\)$/s, '$1');

let sheet;
beforeAll(() => {
  sheet = document.createElement('style');
  sheet.textContent = buttonResets()
    .map(([selectors]) =>
      selectors
        .split(/,\s*(?![^()]*\))/)
        .map((s) => `${unwrapWhere(s.trim())} { padding: 0; }`)
        .join('\n')
    )
    .join('\n');
  document.head.appendChild(sheet);
});
afterAll(() => sheet.remove());
afterEach(() => {
  document.body.innerHTML = '';
});

const PADDING_CLASS = /(^|\s)!?(?:[\w-]+:)*-?tw-p[xytrbl]?-/;
const setsOwnPadding = (button) =>
  PADDING_CLASS.test(button.getAttribute('class') || '') || /padding/.test(button.getAttribute('style') || '');
const keepsUaPadding = (button) => {
  const s = getComputedStyle(button);
  return [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].some((p) => p && p !== '0px');
};

describe('[UI2-BUTTON-RESET] the reset zeroes button padding inside the pack', () => {
  it('has a rule for it', () => {
    expect(buttonResets()).not.toHaveLength(0);
  });

  it('reaches the pack’s own buttons, nested pack widgets included, and no ToolJet widget in a pack canvas', () => {
    document.body.innerHTML = `
      <button id="outside">o</button>
      <div class="tj-shadcn"><button id="pack">p</button>
        <div class="real-canvas sub-canvas"><button id="native">n</button>
          <div class="tj-shadcn"><button id="nested">p</button>
            <div class="real-canvas sub-canvas"><button id="native2">n</button>
              <div class="tj-shadcn"><button id="nested2">p</button></div>
            </div>
          </div>
        </div>
      </div>
      <div class="real-canvas sub-canvas"><div class="tj-shadcn"><button id="inContainer">p</button></div></div>`;
    const padded = (id) => keepsUaPadding(document.getElementById(id));
    expect(padded('outside')).toBe(true);
    expect(padded('native')).toBe(true);
    expect(padded('native2')).toBe(true);
    expect(padded('pack')).toBe(false);
    expect(padded('nested')).toBe(false);
    expect(padded('nested2')).toBe(false);
    expect(padded('inContainer')).toBe(false);
  });

  it.each(NAMES)('no button in %s keeps the browser’s padding', async (name) => {
    const { stats, unmount } = await mountCase({
      name,
      properties: { ...defaultsOf(name), ...(name === 'ShadDialog' ? { show: true } : {}) },
      styles: styleDefaultsOf(name),
    });
    if (OPENS.has(name) && typeof stats.exposed.open === 'function') {
      await act(async () => {
        await stats.exposed.open();
      });
    }
    // The Dialog's trigger is ModalV2's own Bootstrap button, outside the pack root: the reset is not for it.
    const offenders = [...document.querySelectorAll('.tj-shadcn button')]
      .filter((b) => !setsOwnPadding(b) && keepsUaPadding(b))
      .map((b) => b.getAttribute('aria-label') || b.textContent.trim().slice(0, 30) || b.className.slice(0, 60));
    unmount();
    expect(offenders).toEqual([]);
  });

  it('covers every widget', () => {
    expect(NAMES).toEqual(Object.keys(CONFIGS));
  });
});
