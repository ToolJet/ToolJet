/** @group working */
import {
  buildClarificationGateSection,
  clarificationSuggestions,
  isClarificationGateInterrupt,
} from '@ee/ai/helpers/clarification-gate-widget';

// The six the datasource gate actually stored on a real message, in the agent's own order.
const GATE = [
  'Use quickbooks2 (quickbooks)',
  'Use quickbooks (quickbooks)',
  'Use xero (xero)',
  'Use sharepoint (sharepoint)',
  'Use microsoft_graph (microsoft_graph)',
  'Stop and leave the app unchanged',
];

describe('deciding whether a pause can be rendered as a gate', () => {
  it('accepts the flat list of replies the clarification pauses send', () => {
    expect(clarificationSuggestions(GATE)).toEqual(GATE);
    expect(clarificationSuggestions(['Add query event wiring', 'Cancel build'])).toHaveLength(2);
  });

  it('declines the object form, which belongs to a pause that already sent its own widget', () => {
    // Every message carrying this shape in a real workspace also carries a rendered widget;
    // synthesising a second one would double the question.
    expect(clarificationSuggestions([{ title: 'Approve & continue', content: 'Approve & continue' }])).toBeNull();
  });

  it('declines an empty list, which is how a session expiry asks for the plain chat input', () => {
    expect(clarificationSuggestions([])).toBeNull();
  });

  it('declines anything that is not a list of strings', () => {
    [undefined, null, 'Continue', 42, {}, ['ok', 7]].forEach((value) => {
      expect(clarificationSuggestions(value)).toBeNull();
    });
  });

  it('drops blank labels but keeps the list when something usable remains', () => {
    expect(clarificationSuggestions(['   ', 'Cancel build'])).toEqual(['Cancel build']);
    expect(clarificationSuggestions(['  ', ''])).toBeNull();
  });
});

describe('building the gate section', () => {
  const section = buildClarificationGateSection('Use another connected source?', GATE, 3);

  it('is the same interactive section type every other gate renders through', () => {
    expect(section.type).toBe('output-widget-interactive');
    expect(section.index).toBe(3);
  });

  it('asks the question in the widget itself', () => {
    expect(section.header.title).toBe('Use another connected source?');
  });

  it('keeps the agent’s order, because the agent resolves the answer by index', () => {
    // The load-bearing assertion. The agent indexes its own options list with the selectedOption
    // the widget sends back, and derives these labels from that same list. Reorder them and a user
    // who picks one datasource gets a different one — silently, with no error anywhere.
    expect(section.responseActions.slice(0, GATE.length)).toEqual(GATE);
  });

  it('adds a free-text option, and adds it last', () => {
    // An unanswered widget replaces the whole composer, so without this the user loses the ability
    // to answer in their own words. Last, so it cannot shift the indices above it.
    const custom = section.responseActions[section.responseActions.length - 1];
    expect(custom).toEqual({ label: 'Something else', isCustom: true });
    expect(section.responseActions).toHaveLength(GATE.length + 1);
  });

  it('offers Continue only, leaving the agent’s own way out among the options', () => {
    // "Stop and leave the app unchanged" is already in the list and resolves by index. A Cancel in
    // the footer would take the untyped skip path and mean something subtly different.
    expect(section.primaryCta).toEqual([{ id: 'continue', label: 'Continue' }]);
    expect(section.primaryCta.find((cta) => cta.id === 'skip')).toBeUndefined();
  });

  it('passes the question through untouched, leaving any fallback to the caller', () => {
    // service.ts supplies "What should I do next?" when the pause carried no message; the helper
    // does not second-guess it, so a caller that wants different wording gets it.
    expect(buildClarificationGateSection('', GATE, 0).header.title).toBe('');
    expect(buildClarificationGateSection('Pick one', [], 0).responseActions).toEqual([
      { label: 'Something else', isCustom: true },
    ]);
  });
});

describe('deciding which pauses this may touch', () => {
  it('claims a graph clarification gate', () => {
    expect(isClarificationGateInterrupt('a1b2c3d4')).toBe(true);
  });

  it('leaves the route-fallback offer alone, so its model selector stays reachable', () => {
    // Its message tells the reader to pick another model in the selector and then answer. An
    // unanswered widget replaces the composer the selector sits in, so rendering one would hide
    // the exact control the message points at.
    expect(isClarificationGateInterrupt('route-fallback:9f1c2e33-0000-4a1b-8c2d-5e6f70819aab')).toBe(false);
  });

  it('leaves a resumable failure alone, which sends no interrupt id', () => {
    // "Continue this build" after an empty credit balance or rejected credentials: the reader may
    // have to go and fix something before answering, so the ordinary composer stays.
    expect(isClarificationGateInterrupt(null)).toBe(false);
    expect(isClarificationGateInterrupt(undefined)).toBe(false);
    expect(isClarificationGateInterrupt('')).toBe(false);
  });

  it('ignores an id that is not a string', () => {
    [42, {}, [], true].forEach((value) => expect(isClarificationGateInterrupt(value)).toBe(false));
  });
});
