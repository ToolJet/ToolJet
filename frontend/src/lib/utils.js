import cx from 'classnames';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  prefix: 'tw-',
  extend: {
    classGroups: {
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
