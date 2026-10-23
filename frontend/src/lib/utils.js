import cx from 'classnames';
import { extendTailwindMerge } from 'tailwind-merge';

// The UI 2.0 widgets' size keys (Widgets/Ui2/_shared/styles/ui2.tailwind.js): tailwind-merge reads a `text-` or
// `rounded-` class it does not know as a colour or not at all, so these are named here.
const UI2_TEXT = ['ui2-sm', 'ui2-base', 'ui2-lg', 'ui2-xl'];
const UI2_RADIUS = ['ui2-sm', 'ui2-md', 'ui2-lg', 'ui2-xl'];
const radiusGroup = (side) => [{ [side]: UI2_RADIUS }];

const twMerge = extendTailwindMerge({
  prefix: 'tw-',
  extend: {
    classGroups: {
      'font-size': [{ text: UI2_TEXT }],
      rounded: radiusGroup('rounded'),
      ...Object.fromEntries(
        ['t', 'r', 'b', 'l', 's', 'e', 'tl', 'tr', 'br', 'bl', 'ss', 'se', 'ee', 'es'].map((side) => [
          `rounded-${side}`,
          radiusGroup(`rounded-${side}`),
        ])
      ),
      shadow: [
        {
          shadow: [
            'elevation-none',
            'elevation-000',
            'elevation-100',
            'elevation-200',
            'elevation-300',
            'elevation-400',
            'elevation-500',
            'elevation-600',
            'elevation-700',
            'interactive-focus-outline',
            'interactive-focus-outline-inset',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs) {
  return twMerge(cx(inputs));
}
