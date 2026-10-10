import React from 'react';
import { componentOf, defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';

// Full width: a button placed on the grid fills the box drawn for it either way (boxFit.js); as a fill child of a
// flex container it keeps its own width, and Full width makes it span the line.
installGuards();

const InFlexRow = (props) => {
  const Button = componentOf('ShadButton');
  return (
    <div className="flex-child-wrapper" style={{ flexGrow: 1, width: 'auto' }}>
      <Button {...props} />
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
  expect(await classesWith(false)).not.toMatch(/\bw-full\b/);
  expect(await classesWith(true)).toMatch(/\bw-full\b/);
});
