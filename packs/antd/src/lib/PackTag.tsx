import React from 'react';
import { Tag } from 'antd';
import type { TagProps } from 'antd';
import { useIsThemed } from './AntProvider';
import { themedTagColor } from './format';

const SOLID: Record<string, string> = { processing: 'blue', error: 'red', success: 'green', warning: 'orange' };

/**
 * Ant's Tag for a colour an author or the data chose (a status column, a Tags row, a card badge). Under an applied app
 * theme a CSS colour reads as the preset of its hue, which the theme draws (lib/format themedTagColor); stock Ant keeps
 * it as given. solid: the preset's filled (-inverse) look.
 */
export const PackTag = ({ color, solid = false, ...rest }: TagProps & { solid?: boolean }) => {
  const themed = useIsThemed();
  let c = themedTagColor(color, themed);
  if (solid && c && !/^(#|rgb|hsl|default)/i.test(c)) c = `${SOLID[c] ?? c}-inverse`;
  return <Tag {...rest} color={c === 'default' ? undefined : c} />;
};
