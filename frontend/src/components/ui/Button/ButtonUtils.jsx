export const getDefaultIconFillColor = (variant, iconOnly = false) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'var(--icon-on-solid)';
    case 'secondary':
    case 'ghostBrand':
      return 'var(--icon-brand)';
    case 'outline':
    case 'ghost':
      return iconOnly ? 'var(--icon-strong)' : 'var(--icon-default)';
    case 'dangerSecondary':
    case 'dangerGhost':
      return 'var(--icon-danger)';
    default:
      return '';
  }
};

export const getLucideIconClassName = (variant, iconOnly = false) => {
  switch (variant) {
    case 'primary':
    case 'dangerPrimary':
      return 'tw-text-icon-on-solid';
    case 'secondary':
    case 'ghostBrand':
      return 'tw-text-icon-brand';
    case 'outline':
    case 'ghost':
      return iconOnly ? 'tw-text-icon-strong' : 'tw-text-icon-default';
    case 'dangerSecondary':
    case 'dangerGhost':
      return 'tw-text-icon-danger';
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

export const getLucideIconSize = (size) => {
  switch (size) {
    case 'large':
      return 20;
    case 'default':
      return 16;
    case 'medium':
      return 14;
    case 'small':
      return 12;
  }
};
