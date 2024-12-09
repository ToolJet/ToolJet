import { schemaUnavailableOptions } from '@/Editor/QueryManager/constants';
import { allOperations } from '@tooljet/plugins/client';
import { capitalize, cloneDeep } from 'lodash';
import { DATA_SOURCE_TYPE } from '@/_helpers/constants';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';
import useStore from '@/AppBuilder/_stores/store';

export const getDefaultOptions = (source) => {
  const isSchemaUnavailable = Object.keys(schemaUnavailableOptions).includes(source.kind);
  let options = {};

  if (isSchemaUnavailable) {
    options = {
      ...{ ...cloneDeep(schemaUnavailableOptions[source.kind]) },
      ...(source?.kind != 'runjs' && {
        transformationLanguage: 'javascript',
        enableTransformation: false,
      }),
    };
  } else {
    const selectedSourceDefault =
      source?.plugin?.operationsFile?.data?.defaults ?? allOperations[capitalize(source.kind)]?.defaults;
    if (selectedSourceDefault) {
      options = {
        ...{ ...selectedSourceDefault },
        ...(source?.kind != 'runjs' && {
          transformationLanguage: 'javascript',
          enableTransformation: false,
        }),
      };
    } else {
      options = {
        ...(source?.kind != 'runjs' && {
          transformationLanguage: 'javascript',
          enableTransformation: false,
        }),
      };
    }
  }

  return { options, name: computeQueryName(source) };
};

const computeQueryName = (source) => {
  const { kind, type } = source;
  // TODO: Might need to move this out
  // const dataQueries = useDataQueriesStore.getState().dataQueries;
  const dataQueries = useStore.getState().dataQuery.queries.modules.canvas;
  let currentQueriesForKind = dataQueries.filter((query) => query.kind === kind);
  if (type == DATA_SOURCE_TYPE.SAMPLE) {
    currentQueriesForKind = currentQueriesForKind.filter((query) => query.data_source_id === source.id);
  }
  let currentNumber = currentQueriesForKind.length + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const newName = `${type != DATA_SOURCE_TYPE.SAMPLE ? kind : 'SMPL_query_'}${currentNumber}`;
    if (dataQueries.find((query) => query.name === newName) === undefined) {
      return newName;
    }
    currentNumber += 1;
  }
};
