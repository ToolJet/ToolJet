import React, { useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { appService } from '@/_services';

export function Workflows({ options, optionsChanged }) {
  const [workflowOptions, setWorkflowOptions] = useState([]);
  const [_selectedWorkflowId, setSelectedWorkflowId] = useState(undefined);

  useEffect(() => {
    appService.getAll(0, 0, '', 'workflow').then((response) => {
      console.log({ response });
      setWorkflowOptions(
        response.apps.map((workflow) => ({
          value: workflow.id,
          name: workflow.name,
        }))
      );
    });
  }, []);

  return (
    <>
      <label className="mb-1">Workflow</label>
      <Select
        options={workflowOptions}
        value={options.workflowId ?? {}}
        onChange={(workflowId) => {
          setSelectedWorkflowId(workflowId);
          optionsChanged({ workflowId });
        }}
        placeholder="Select workflow"
        height="32px"
        useMenuPortal={true}
        closeMenuOnSelect={true}
        customWrap={true}
        width="300px"
      />
    </>
  );
}
