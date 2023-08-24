import React, { useState } from 'react';
import OrgConstantVariablesPreviewBox from '../../_components/OrgConstantsVariablesResolver';

const Textarea = ({ helpText, ...props }) => {
  const { workspaceVariables, workspaceConstants, value } = props;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="tj-app-input">
      <textarea {...props} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
      <OrgConstantVariablesPreviewBox
        workspaceVariables={workspaceVariables}
        workspaceConstants={workspaceConstants}
        isFocused={isFocused}
        value={value}
      />
      {helpText && <small className="text-muted" dangerouslySetInnerHTML={{ __html: helpText }} />}
    </div>
  );
};

export default Textarea;
