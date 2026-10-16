// How many choices a select, radio group or toggle group draws: a 10,000-option binding froze the page.

// Radios and toggle buttons are laid out on the widget: past this many, a bound list is a mistake that froze the page.
export const MAX_CHOICES = 100;

/** The options a widget draws: the first `max`, plus the selected one wherever it is (actions still reach them all). */
export const shownOptions = (options, selected, max) => {
  const shown = options.slice(0, max);
  if (selected && !shown.includes(selected)) shown.push(selected);
  return shown;
};
