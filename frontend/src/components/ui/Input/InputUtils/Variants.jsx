// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';

export const inputVariants = cva('', {
  variants: {
    size: {
      small: `tw-h-[28px]`,
      medium: `tw-h-[32px]`,
      large: `tw-h-[40px]`,
    },
  },
  defaultVariants: {
    size: 'medium',
  },
});
