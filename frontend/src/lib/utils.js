import cx from 'classnames';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  prefix: 'tw-',
});

export function cn(...inputs) {
  return twMerge(cx(inputs));
}
