import React from 'react';
import { isEmpty } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import useStore from '@/AppBuilder/_stores/store';
import OverflowTooltip from '@/_components/OverflowTooltip';

function RunjsParameters({ event, darkMode, index, handlerChanged }) {
  const dataQuery = useStore((state) => {
    const queries = state.dataQuery?.queries?.modules?.canvas || [];
    return queries.find((dataquery) => dataquery.id === event.queryId);
  });

  if (!event.queryId || isEmpty(dataQuery?.options?.parameters)) {
    return '';
  }

  const handleChange = (value, param) => {
    const newParams = { ...event?.parameters, [param.name]: value };
    handlerChanged(index, 'parameters', newParams);
  };

  return (
    <div className="tw-mt-3">
      <label className="tw-text-xs tw-leading-[18px] tw-mb-3 form-label" data-cy="label-run-js-parameters">
        Parameters
      </label>
      <div className="tw-flex tw-flex-col tw-gap-3">
        {dataQuery?.options?.parameters.map((param) => (
          <div key={param.name} className="tw-flex tw-min-h-8 tw-items-start tw-justify-between">
            <OverflowTooltip
              className="tw-flex tw-h-8 tw-items-center tw-font-body-default tw-text-text-default"
              style={{ maxWidth: 'calc(100% - 176px)' }}
            >
              {param.name}
            </OverflowTooltip>
            <div className="tw-w-[168px] tw-min-h-8 tw-flex tw-flex-col tw-justify-center">
              <CodeHinter
                type="basic"
                initialValue={event.parameters?.[param.name]}
                onChange={(value) => handleChange(value, param)}
                usePortalEditor={false}
                componentName="RunJS Params"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RunjsParameters;
