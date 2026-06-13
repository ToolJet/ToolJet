import React from 'react';
import EEFixWithAi from '@ee/modules/AiBuilder/components/FixWithAi';

// CE has no Fix-with-AI UI; the EE build resolves the import above to the real
// component and the ternary below folds away at build time (DefinePlugin + DCE).
function FixWithAi() {
  return <></>;
}

export default process.env.TOOLJET_EDITION === 'ce' ? FixWithAi : EEFixWithAi;
