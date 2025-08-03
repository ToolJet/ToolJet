import { useMemo } from 'react';

export function useTableStyles(styles) {
  return useMemo(() => {
    const { borderRadius = 0, boxShadow, borderColor } = styles;

    return {
      borderRadius: Number.parseFloat(borderRadius),
      boxShadow,
      borderColor,
    };
  }, [styles]);
}
