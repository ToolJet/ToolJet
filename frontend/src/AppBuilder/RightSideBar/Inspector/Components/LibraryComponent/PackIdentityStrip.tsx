import React from 'react';
import { Library } from 'lucide-react';

import type { PackIdentity } from './packIdentity';

/**
 * The line a pack component's Properties tab opens with: the library and the component (design option D).
 * Every library shares one icon, since the packs ship none of their own. How the two names share the width is
 * pure CSS (styles.scss): the library name's title also sizes it, through attr(title).
 */
export const PackIdentityStrip = ({ library, component }: PackIdentity) => (
  <div className="pack-identity-strip" aria-label={`${component} from ${library}`} data-cy="pack-identity-strip">
    <span className="pack-identity-strip-library">
      <Library className="pack-identity-strip-icon" size={14} aria-hidden="true" />
      <span className="pack-identity-strip-library-name" title={library}>
        <span className="pack-identity-strip-text">{library}</span>
      </span>
    </span>
    <span className="pack-identity-strip-dot" aria-hidden="true">
      ·
    </span>
    <span className="pack-identity-strip-component pack-identity-strip-text" title={component}>
      {component}
    </span>
  </div>
);
