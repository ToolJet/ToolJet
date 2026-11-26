/**
 * The dynamic height engine and component pack widgets: the rules the old reflow kept for them
 * (dynamicHeightPolicy.js), which the engine meets with its general rules.
 *
 *   - A widget that fits its content keeps the height it fitted when a sibling moves it, even below the height it was
 *     drawn at (old keepsFittedHeightWhenMoved). The engine never re-floors a height: each widget is placed at the
 *     height it is drawn at, whichever widget changed.
 *   - A pack container sizes itself around its drop areas (`<id>-<slot>`), measuring the box it draws (old
 *     sizesToDropAreas). The engine places what is in a drop area and leaves the container's height to its own
 *     measurement.
 *
 * Runs on the real composed store, seeded through `seedApp`, as engine.spec.js does. Widgets are 10 columns wide at
 * column 0, so each one sits under the one above it.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, binding } from '@/test/app-builder';
import { flushDynamicHeight } from '../../engine';
import { uuid, widget } from './dynamicHeightPage';

const s = () => useStore.getState();
const pass = (options) => flushDynamicHeight(useStore.getState, options);
const temps = () => s().temporaryLayouts;

const DH = { dynamicHeight: binding('{{true}}') };
const OFF = { dynamicHeight: binding('{{false}}') };

const CARD = uuid(1);
const BODY = `${CARD}-body`;

describe('dynamic height engine: a widget fitted below its drawn height, moved by a sibling', () => {
  // A 40px Text at the top that grows by 50, then the fitted widget drawn 100 high at 60, then a widget 20px under
  // the fitted widget's drawn bottom.
  const page = (fitted) => ({
    first: widget('first', 'Text', { top: 0, properties: DH }),
    fitted,
    below: widget('below', 'Text', { top: 180 }),
  });

  // The fitted widget was drawn at 30 (or 300) before the pass; the Text above it then grows.
  const growFirst = (fittedHeight) => {
    s().setTemporaryLayouts({ fitted: { top: 60, height: fittedHeight } });
    pass({ changes: [{ id: 'first', height: 90 }] });
  };

  it('[DynamicHeight-ENGINE-037] keeps a pack widget’s fitted height, Dynamic height left unset', () => {
    // Break this catches: placing a pack widget at its drawn height because its Dynamic height is not set, while the
    // canvas draws it at its content's height (fitsContentInView): what is under it then overlaps it.
    seedApp(page(widget('fitted', 'ShadStat', { top: 60, height: 100 })));
    growFirst(30);
    expect(temps().fitted).toEqual({ top: 110, height: 30 });
    expect(temps().below).toEqual({ top: 160, height: 40 });
  });

  it('[DynamicHeight-ENGINE-038] keeps a FlexContainer card’s fitted height with Dynamic height off', () => {
    // A card always fits its content (heightHeldInView), so it grew to 300 even with Dynamic height off.
    const card = widget('fitted', 'FlexContainer', {
      top: 60,
      height: 100,
      properties: { ...OFF, cardStyle: binding('shadcnCard') },
    });
    seedApp(page(card));
    growFirst(300);
    expect(temps().fitted).toEqual({ top: 110, height: 300 });
    expect(temps().below).toEqual({ top: 430, height: 40 });
  });

  it('[DynamicHeight-ENGINE-039] keeps a native widget’s fitted height too', () => {
    // The old reflow floored a native widget moved by a sibling at its drawn height, so its height depended on which
    // widget changed last. Release-note difference (D1).
    seedApp(page(widget('fitted', 'Text', { top: 60, height: 100, properties: DH })));
    growFirst(30);
    expect(temps().fitted).toEqual({ top: 110, height: 30 });
    expect(temps().below).toEqual({ top: 160, height: 40 });
  });

  it('[DynamicHeight-ENGINE-040] keeps the drawn height of a pack widget with Dynamic height off', () => {
    // A height it rendered at while Dynamic height was on is ignored, as the canvas ignores it.
    seedApp(page(widget('fitted', 'ShadStat', { top: 60, height: 100, properties: OFF })));
    growFirst(30);
    expect(temps().fitted).toEqual({ top: 110, height: 100 });
    expect(temps().below).toEqual({ top: 230, height: 40 });
  });
});

describe('dynamic height engine: a pack container’s drop area', () => {
  // A pack Card drawn 200 high, with two Texts in its body drop area and a Text 20px under the card. The card
  // measures the box it draws (SdkComponentHost), so its height arrives as a measurement like a leaf's.
  const cardPage = (cardProperties) => ({
    [CARD]: widget(CARD, 'PackComponent', { top: 0, height: 200, properties: cardProperties }),
    inTop: widget('inTop', 'Text', { parent: BODY, top: 10, properties: DH }),
    inBottom: widget('inBottom', 'Text', { parent: BODY, top: 70 }),
    below: widget('below', 'Text', { top: 220 }),
  });

  it('[DynamicHeight-ENGINE-041] places the drop area’s content and leaves the card at the height it measured', () => {
    // Break this catches (PackComponent-DYNHEIGHT-007 on the old reflow): sizing the card from its own canvas, which
    // holds nothing (its components sit on `<id>-body`): it went back to its drawn 200 over the 420 it measured.
    seedApp(cardPage(DH));
    s().setTemporaryLayouts({ [CARD]: { top: 0, height: 420 }, below: { top: 440, height: 40 } });
    const { patch } = pass({ changes: [{ id: 'inTop', height: 100 }] });
    expect(patch).toEqual({ inTop: { top: 10, height: 100 }, inBottom: { top: 130, height: 40 } });
    expect(temps()[CARD]).toEqual({ top: 0, height: 420 });
    expect(temps().below).toEqual({ top: 440, height: 40 });
  });

  it('[DynamicHeight-ENGINE-042] moves what is under the card when the card reports its new height', () => {
    seedApp(cardPage(DH));
    pass({ changes: [{ id: CARD, height: 500 }] });
    expect(temps()).toEqual({ [CARD]: { top: 0, height: 500 }, below: { top: 520, height: 40 } });
  });

  it('[DynamicHeight-ENGINE-043] with Dynamic height off keeps the card’s drawn box while its content moves', () => {
    seedApp(cardPage(OFF));
    const { patch } = pass({ changes: [{ id: 'inTop', height: 100 }] });
    expect(patch).toEqual({ inTop: { top: 10, height: 100 }, inBottom: { top: 130, height: 40 } });
    // The card reporting a height is ignored: it is drawn at its drawn height.
    expect(pass({ changes: [{ id: CARD, height: 500 }] }).patch).toEqual({});
  });

  it('[DynamicHeight-ENGINE-044] places a drop area’s content when the whole module is solved', () => {
    seedApp(cardPage(DH));
    s().setTemporaryLayouts({ inTop: { top: 10, height: 100 } });
    pass({ fullModules: ['canvas'] });
    expect(temps().inBottom).toEqual({ top: 130, height: 40 });
  });
});
