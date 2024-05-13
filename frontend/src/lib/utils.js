import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// import classNames from 'classnames';

// export function cn(...inputs) {
//   // Combine Tailwind classes and other classes using classnames
//   return classNames(...inputs);
// }
