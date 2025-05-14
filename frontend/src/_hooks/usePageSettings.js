import { useMemo } from 'react';
import useStore from '@/AppBuilder/_stores/store';

const usePageSettings = ({ darkMode, isSelected, isHovered, page, editingPage }) => {
  const {
    definition: { styles, properties },
  } = useStore((state) => state.pageSettings);

  const computedStyles = useMemo(() => {
    if (darkMode) {
      return {};
    }

    const baseStyles = {
      pill: {
        borderRadius: `${styles.pillRadius.value}px`,
      },
      icon: {
        color: styles.iconColor.value,
        fill: styles.iconColor.value,
      },
    };

    if (isSelected) {
      return {
        ...baseStyles,
        text: {
          color: styles.selectedTextColor.value,
        },
        icon: {
          color: styles.selectedIconColor.value,
          fill: styles.selectedIconColor.value,
        },
        pill: {
          background: styles.pillSelectedBackgroundColor.value,
          ...(page?.id === editingPage?.id && {
            backgroundColor: 'var(--slate4)',
          }),
          ...baseStyles.pill,
        },
      };
    }

    if (isHovered) {
      return {
        ...baseStyles,
        pill: {
          background: styles.pillHoverBackgroundColor.value,
          ...baseStyles.pill,
        },
      };
    }

    return {
      text: {
        color: styles.textColor.value,
      },
      icon: {
        color: styles.iconColor.value,
        fill: styles.iconColor.value,
      },
      ...baseStyles,
    };
  }, [darkMode, isSelected, isHovered, page?.id, editingPage?.id, styles]);

  const labelStyle = useMemo(
    () => ({
      icon: {
        hidden: properties.style === 'text',
      },
      label: {
        hidden: properties.style === 'icon',
      },
    }),
    [properties.style]
  );

  return { computedStyles, labelStyle };
};

export default usePageSettings;
