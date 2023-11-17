import { schemaUnavailableOptions } from '@/Editor/QueryManager/constants';
import { allOperations } from '@tooljet/plugins/client';
import { capitalize } from 'lodash';
import { useDataQueriesStore } from '@/_stores/dataQueriesStore';

export const getDefaultOptions = (source) => {
  const isSchemaUnavailable = Object.keys(schemaUnavailableOptions).includes(source.kind);
  let options = {};

  if (isSchemaUnavailable) {
    options = {
      ...{ ...schemaUnavailableOptions[source.kind] },
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

  return { options, name: computeQueryName(source.kind) };
};

const computeQueryName = (kind) => {
  const dataQueries = useDataQueriesStore.getState().dataQueries;
  const currentQueriesForKind = dataQueries.filter((query) => query.kind === kind);
  let currentNumber = currentQueriesForKind.length + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const newName = `${kind}${currentNumber}`;
    if (dataQueries.find((query) => query.name === newName) === undefined) {
      return newName;
    }
    currentNumber += 1;
  }
};
