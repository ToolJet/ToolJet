import React, { useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { appService } from '@/_services';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import './workflows-query.scss';
import { v4 as uuidv4 } from 'uuid';

export function Workflows({ options, optionsChanged, currentState }) {
  const [workflowOptions, setWorkflowOptions] = useState([]);
  const [_selectedWorkflowId, setSelectedWorkflowId] = useState(undefined);
  const [params, setParams] = useState([...(options.params ?? [{ key: '', value: '' }])]);

  useEffect(() => {
    appService.getAll(0, 0, '', 'workflow').then((response) => {
      setWorkflowOptions(
        response.apps.map((workflow) => ({
          value: workflow.id,
          name: workflow.name,
        }))
      );
    });
  }, []);

  useEffect(() => {
    optionsChanged({
      ...options,
      params,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

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
        menuPlacement="bottom"
      />
      <label className="my-2">Params</label>
      <div className="grid"></div>
      {params.map((param, index) => (
        <div className="row" key={param.id}>
          <div className="col-4">
            <CodeHinter
              currentState={currentState}
              onChange={(newValue) =>
                setParams((params) => [
                  ...params.slice(0, index),
                  { ...param, key: newValue },
                  ...params.slice(index + 1),
                ])
              }
              initialValue={param.key}
              placeholder={'key'}
            />
          </div>
          <div className="col-7">
            <CodeHinter
              currentState={currentState}
              onChange={(newValue) =>
                setParams((params) => [
                  ...params.slice(0, index),
                  { ...param, value: newValue },
                  ...params.slice(index + 1),
                ])
              }
              initialValue={param.value}
              placeholder={'value'}
            />
          </div>
          <div className="col-1">
            <span
              className="delete-param"
              onClick={() => setParams((params) => [...params.slice(0, index), ...params.slice(index + 1)])}
            >
              <svg width="auto" height="auto" viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M5.58579 0.585786C5.96086 0.210714 6.46957 0 7 0H11C11.5304 0 12.0391 0.210714 12.4142 0.585786C12.7893 0.960859 13 1.46957 13 2V4H15.9883C15.9953 3.99993 16.0024 3.99993 16.0095 4H17C17.5523 4 18 4.44772 18 5C18 5.55228 17.5523 6 17 6H16.9201L15.9997 17.0458C15.9878 17.8249 15.6731 18.5695 15.1213 19.1213C14.5587 19.6839 13.7957 20 13 20H5C4.20435 20 3.44129 19.6839 2.87868 19.1213C2.32687 18.5695 2.01223 17.8249 2.00035 17.0458L1.07987 6H1C0.447715 6 0 5.55228 0 5C0 4.44772 0.447715 4 1 4H1.99054C1.9976 3.99993 2.00466 3.99993 2.0117 4H5V2C5 1.46957 5.21071 0.960859 5.58579 0.585786ZM3.0868 6L3.99655 16.917C3.99885 16.9446 4 16.9723 4 17C4 17.2652 4.10536 17.5196 4.29289 17.7071C4.48043 17.8946 4.73478 18 5 18H13C13.2652 18 13.5196 17.8946 13.7071 17.7071C13.8946 17.5196 14 17.2652 14 17C14 16.9723 14.0012 16.9446 14.0035 16.917L14.9132 6H3.0868ZM11 4H7V2H11V4ZM6.29289 10.7071C5.90237 10.3166 5.90237 9.68342 6.29289 9.29289C6.68342 8.90237 7.31658 8.90237 7.70711 9.29289L9 10.5858L10.2929 9.29289C10.6834 8.90237 11.3166 8.90237 11.7071 9.29289C12.0976 9.68342 12.0976 10.3166 11.7071 10.7071L10.4142 12L11.7071 13.2929C12.0976 13.6834 12.0976 14.3166 11.7071 14.7071C11.3166 15.0976 10.6834 15.0976 10.2929 14.7071L9 13.4142L7.70711 14.7071C7.31658 15.0976 6.68342 15.0976 6.29289 14.7071C5.90237 14.3166 5.90237 13.6834 6.29289 13.2929L7.58579 12L6.29289 10.7071Z"
                  fill="#DB4324"
                />
              </svg>
            </span>
          </div>
        </div>
      ))}
      <div className="row">
        <div className="col-1">
          <span
            className="add-param"
            onClick={() => setParams((params) => [...params, { key: '', value: '', id: uuidv4() }])}
          >
            <svg width="auto" height="auto" viewBox="0 0 24 25" fill="#5677E1" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4.5C12.5523 4.5 13 4.94772 13 5.5V11.5H19C19.5523 11.5 20 11.9477 20 12.5C20 13.0523 19.5523 13.5 19 13.5H13V19.5C13 20.0523 12.5523 20.5 12 20.5C11.4477 20.5 11 20.0523 11 19.5V13.5H5C4.44772 13.5 4 13.0523 4 12.5C4 11.9477 4.44772 11.5 5 11.5H11V5.5C11 4.94772 11.4477 4.5 12 4.5Z"
                fill="#3E63DD"
              />
            </svg>
          </span>
        </div>
      </div>
    </>
  );
}
