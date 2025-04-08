// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';

export const arrowVariants = cva('tw-flex', {
  variants: {
    arrow: {
      'Bottom Center': `tw-flex-col tw-items-center`,
      'Bottom Left': `tw-flex-col tw-items-start`,
      'Bottom Right': `tw-flex-col tw-items-end`,
      'Top Center': `tw-flex-col-reverse tw-items-center`,
      Left: `tw-flex-row-reverse tw-items-center`,
      Right: `tw-flex-row tw-items-center`,
    },
  },
});

export const tooltipVariants = cva('', {
  variants: {
    arrow: {
      'Bottom Center': `-tw-mb-[1px]`,
      'Bottom Left': `-tw-mb-[1px]`,
      'Bottom Right': `-tw-mb-[1px]`,
      'Top Center': `-tw-mt-[1px]`,
      Left: `-tw-ml-[1px]`,
      Right: `-tw-mr-[1px]`,
    },
    theme: {
      light: `tw-bg-[#FFFFFF]`,
      dark: `tw-bg-[#11181C]`,
    },
  },
});
