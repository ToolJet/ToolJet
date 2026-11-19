import { computeComponentName } from '../appCanvasUtils';

// A dropped component is named after its library component or module, and those names can be long
// (QuarterlyRevenueForecastSummaryCard). The builder then types that name in every {{components.…}} binding, so a
// generated name keeps whole words up to 24 characters. A builder's own rename is not shortened.
describe('a generated name for a component with a long name', () => {
  const existing = (...names) => Object.fromEntries(names.map((name, i) => [`id-${i}`, { component: { name } }]));
  const library = { skipRegistry: true };

  it('[computeComponentName-LONG-001] keeps the whole words that fit in 24 characters', () => {
    // Break this catches: a long library component name becoming a 36-character instance name.
    expect(computeComponentName('QuarterlyRevenueForecastSummaryCard', {}, undefined, library)).toBe(
      'quarterlyrevenueforecast1'
    );
  });

  it('[computeComponentName-LONG-002] cuts a single long word at 24 characters', () => {
    expect(computeComponentName('Supercalifragilisticexpialidocious', {}, undefined, library)).toBe(
      'supercalifragilisticexpi1'
    );
  });

  it('[computeComponentName-LONG-003] splits words at underscores, hyphens and spaces too, and drops a trailing one', () => {
    expect(computeComponentName('order_line_items_summary_panel', {}, undefined, library)).toBe(
      'order_line_items_summary1'
    );
    expect(computeComponentName('order_line_items_and_summary', {}, undefined, library)).toBe('order_line_items_and1');
    // A module is named after the module, whose name may have spaces.
    expect(computeComponentName('ModuleViewer', {}, 'Customer Onboarding Approval Flow')).toBe('customeronboarding1');
  });

  it('[computeComponentName-LONG-004] leaves a name of 24 characters or fewer as it was', () => {
    // Break this catches: the shortening changing names that already fit, including every native widget's.
    expect(computeComponentName('MultiStepOnboardingCard', {}, undefined, library)).toBe('multisteponboardingcard1');
    expect(computeComponentName('my_counter-button', {}, undefined, library)).toBe('my_counter-button1');
    expect(computeComponentName('CircularProgressBar', {})).toBe('circularprogressbar1');
  });

  it('[computeComponentName-LONG-005] numbers on when two long names shorten to the same words', () => {
    const page = existing('quarterlyrevenueforecast1');
    expect(computeComponentName('QuarterlyRevenueForecastDetailCard', page, undefined, library)).toBe(
      'quarterlyrevenueforecast2'
    );
  });
});
