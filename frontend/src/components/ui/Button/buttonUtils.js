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
