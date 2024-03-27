export const getDefaultIconFillColor = (variant) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'var(--icon-on-solid)';
    case 'secondary':
    case 'ghostBrand':
      return 'var(--icon-brand)';
    case 'outline':
    case 'ghost':
      return 'var(--icon-strong)';
    case 'dangerSecondary':
    case 'dangerGhost':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};
export const defaultButtonFillColour = ['#FFFFFF', '#4368E3', '#ACB2B9', '#D72D39']; // all default fill colors

export const getIconSize = (size) => {
  switch (size) {
    case 'large':
      return '20px';
    case 'default':
      return '16px';
    case 'medium':
      return '14px';
    case 'small':
      return '12px';
  }
};

// conditional styles WRT icon and button
export const getButtonWidth = (size, iconOnly) => {
  if (iconOnly) {
    switch (size) {
      case 'large':
        return 'tw-w-[40px] tw-px-[10px]';
      case 'default':
        return 'tw-w-[32px] tw-px-[7px]';
      case 'medium':
        return 'tw-w-[28px] tw-px-[5px]';
      case 'small':
        return 'tw-w-[20px] tw-px-[2px]';
    }
  } else {
    switch (size) {
      case 'large':
        return 'tw-px-[20px]';
      case 'default':
        return 'tw-px-[12px]';
      case 'medium':
        return 'tw-px-[10px]';
      case 'small':
        return 'tw-px-[8px]';
    }
  }
};
