import cx from 'classnames';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  prefix: 'tw-',
  extend: {
    classGroups: {
      // tailwind-merge only treats t-shirt keys (sm, md, lg…) as radius; without this, tw-rounded-md and tw-rounded-default would both be kept
      rounded: [{ rounded: ['default', 'medium', 'large'] }],
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
            // tailwind-merge v2 ignores the `shadow:` label, so `shadow-[shadow:var(--x)]` wouldn't override other shadows
            (value) => /^\[shadow:.+\]$/.test(value),
          ],
        },
      ],
    },
  },
});

export function cn(...inputs) {
  return twMerge(cx(inputs));
}
