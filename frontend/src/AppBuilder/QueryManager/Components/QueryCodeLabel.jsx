import React from 'react';
import { QUERY_FIELD_LABEL_CLASS_NAME } from '@/AppBuilder/panelLayout';
import OpenCodeEditorTabButton from '@/AppBuilder/QueryManager/CodeEditorTab/OpenCodeEditorTabButton';

// "Code" label above the RunJS / RunPython code box, with the button that opens the code in a new tab at
// the row's right end.
const QueryCodeLabel = () => (
  <div className="tw-flex tw-items-center tw-justify-between tw-gap-1 tw-mb-2 tw-shrink-0">
    <p
      className={`text-placeholder font-weight-medium tw-mb-0 ${QUERY_FIELD_LABEL_CLASS_NAME}`}
      data-cy="query-code-label"
    >
      Code
    </p>
    <OpenCodeEditorTabButton />
  </div>
);

export default QueryCodeLabel;
