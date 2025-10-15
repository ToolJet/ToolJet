// eslint-disable-next-line import/no-unresolved
import { cva } from 'class-variance-authority';

/**
 * Base input variants for size and validation state.
 * Applied directly in Input.jsx to all input/textarea elements.
 *
 * @param {Object} options
 * @param {'small' | 'medium' | 'large'} options.size - Input size (height, font-size, padding, border-radius)
 * @param {'success' | 'error' | 'default'} options.validationState - Validation state (border color, focus ring)
 * @returns {string} Combined CSS classes
 */
export const inputBaseVariants = cva('', {
  variants: {
    size: {
      small: 'tw-h-[28px] tw-text-[12px]/[18px] tw-px-[10px] tw-py-[6px] tw-rounded-[6px]',
      medium: 'tw-h-[32px] tw-text-[12px]/[18px] tw-px-3 tw-py-[7px] tw-rounded-[6px]',
      large: 'tw-h-[40px] tw-text-[14px]/[20px] tw-px-3 tw-py-[7px] tw-rounded-[8px]',
    },
    validationState: {
      success:
        '!tw-border-border-success-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-success-strong',
      error:
        '!tw-border-border-danger-strong focus-visible:!tw-ring-0 focus-visible:!tw-ring-offset-0 focus-visible:!tw-border-border-danger-strong',
      default: 'tw-border-border-default',
    },
  },
  defaultVariants: {
    size: 'medium',
    validationState: 'default',
  },
});

/**
 * Icon position variants for leading/trailing icons.
 * Used in TextInput, NumberInput, and PasswordInput for absolute positioning.
 * Uses transform for perfect vertical centering.
 *
 * @param {Object} options
 * @param {'small' | 'medium' | 'large'} [options.leadingIconPosition] - Position for leading icon
 * @param {'small' | 'medium' | 'large'} [options.trailingIconPosition] - Position for trailing icon/button
 * @returns {string} CSS classes for absolute positioning
 */
export const inputPositionVariants = cva('', {
  variants: {
    leadingIconPosition: {
      small: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-left-[10px]',
      medium: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-left-[12px]',
      large: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-left-[12px]',
    },
    trailingIconPosition: {
      small: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-right-0',
      medium: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-right-0',
      large: 'tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-right-0',
    },
  },
});

/**
 * Input padding variants for when icons are present.
 * Adds left/right padding to input to prevent text overlap with icons.
 * Uses standard Tailwind spacing scale (8 = 32px, 9 = 36px, 10 = 40px, 11 = 44px).
 *
 * @param {Object} options
 * @param {'small' | 'medium' | 'large'} [options.leadingIconPadding] - Left padding when leading icon exists
 * @param {'small' | 'medium' | 'large'} [options.trailingIconPadding] - Right padding when trailing icon/button exists
 * @returns {string} CSS padding classes
 */
export const inputPaddingVariants = cva('', {
  variants: {
    leadingIconPadding: {
      small: 'tw-pl-8', // 32px
      medium: 'tw-pl-9', // 36px
      large: 'tw-pl-10', // 40px
    },
    trailingIconPadding: {
      small: 'tw-pr-8', // 40px
      medium: 'tw-pr-9', // 44px
      large: 'tw-pr-10', // 48px
    },
  },
});

/**
 * Icon size variants for leading/trailing icons.
 * Controls width and height of SolidIcon and lucide icons.
 *
 * @param {Object} options
 * @param {'small' | 'medium' | 'large'} options.iconSize - Icon dimensions
 * @returns {string} CSS width/height classes
 */
export const inputIconSizeVariants = cva('', {
  variants: {
    iconSize: {
      small: 'tw-w-[14px] tw-h-[14px]',
      medium: 'tw-w-[16px] tw-h-[16px]',
      large: 'tw-w-[18px] tw-h-[18px]',
    },
  },
});

/**
 * Scale factor for trailing action buttons (clear/loading).
 * Makes buttons compact to fit nicely inside inputs while maintaining proportions.
 * Apply this class directly to buttons inside inputs.
 */
export const TRAILING_BUTTON_SCALE = 'tw-scale-75';
