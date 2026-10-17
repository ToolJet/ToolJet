import React from 'react';
import { componentOf, defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';

// Full width: a button placed on the grid fills the box drawn for it either way; as a fill child of a flex container
// (boxFit 'fill', from WidgetWrapper) it keeps its own width, and Full width makes it span the line.
installGuards();

const InFlexRow = (props) => {
  const Button = componentOf('ShadButton');
  return (
    <div className="flex-child-wrapper" style={{ flexGrow: 1, width: 'auto' }}>
      <Button {...props} boxFit="fill" />
    </div>
  );
};

it('ShadButton Full width spans a flex row only when on', async () => {
  const classesWith = async (fullWidth) => {
    const { stats, unmount } = await mountCase({
      name: 'ShadButton',
      Widget: InFlexRow,
      properties: { ...defaultsOf('ShadButton'), fullWidth },
      styles: styleDefaultsOf('ShadButton'),
    });
    const className = document.querySelector('.flex-child-wrapper button').className;
    unmount();
    expect(problemsOf(stats)).toEqual([]);
    return className;
  };
  // A class of its own (tw-max-w-full, which every button has to stay in its box, is not it).
  expect(await classesWith(false)).not.toMatch(/(^|\s)tw-w-full(\s|$)/);
  expect(await classesWith(true)).toMatch(/(^|\s)tw-w-full(\s|$)/);
});
