import { extractAndReplaceReferencesFromString } from '@/AppBuilder/_stores/ast';
import { findFirstKeyValuePairWithPath } from '../utils/utils';

export const createParamUpdatedInterceptor = ({
  component,
  paramUpdated,
  source,
  setSource,
  setJSONData,
  setOpenModal,
  shouldFocusJSONDataEditor,
  shouldInvokeBlurEvent,
  savedSourceValue,
  componentNameIdMapping,
  queryNameIdMapping,
  getFormDataSectionData,
  getExposedValueOfQuery,
  runQuery,
  resolveReferences,
}) => {
  return async (param, attr, value, paramType, ...restArgs) => {
    // Handle generateFormFrom parameter
    if (param?.name === 'generateFormFrom') {
      shouldFocusJSONDataEditor.current = false;
      if (attr === 'value') {
        const res = extractAndReplaceReferencesFromString(value, componentNameIdMapping, queryNameIdMapping);
        let { valueWithId: selectedQuery, allRefs, valueWithBrackets } = res;
        const { generateFormFrom, JSONData } = getFormDataSectionData(component?.id);

        if (value === generateFormFrom?.value) {
          return setJSONData({ value: JSONData.value });
        }

        if (value === 'jsonSchema') {
          setSource({ value: 'jsonSchema' });
          savedSourceValue.current = 'jsonSchema';
          return paramUpdated(param, attr, value, paramType, ...restArgs);
        }

        if (value !== 'rawJson' && value !== 'jsonSchema') {
          const queryId = allRefs[0]?.entityNameOrId;
          const resolvedValueofQuery = getExposedValueOfQuery(queryId, 'canvas');

          const hasMetadata =
            resolvedValueofQuery && typeof resolvedValueofQuery === 'object' && 'metadata' in resolvedValueofQuery;

          // Set the source value to the selected query until the query is run
          setSource((prev) => ({ ...prev, value: selectedQuery }));

          let resolvedValue;

          setOpenModal(true);
          if (!hasMetadata && queryId && runQuery) {
            await runQuery(queryId, '', false, 'edit');
          }
          resolvedValue = resolveReferences('canvas', valueWithBrackets);

          if (!source?.fxActive) {
            const transformedData = findFirstKeyValuePairWithPath(resolvedValue, selectedQuery);
            setJSONData({ value: transformedData.value });
            return setSource((prev) => ({ ...prev, value: transformedData.path }));
          }
          setJSONData({ value: resolvedValue });
          setOpenModal(true);
        } else if (value === 'rawJson') {
          shouldFocusJSONDataEditor.current = true;
          setJSONData({
            value: "{{{ 'name': 'John Doe', 'age': 35 }}}",
          });
          return setSource((prev) => ({ ...prev, value }));
        }
        setSource((prev) => ({ ...prev, value: selectedQuery }));
      } else if (attr === 'fxActive') {
        setSource((prev) => ({ ...prev, fxActive: value }));
      }
      return;
    }

    // Handle JSONData parameter
    if (param.name === 'JSONData') {
      if (attr === 'value') {
        if (source.value === 'rawJson') {
          shouldInvokeBlurEvent.current = true;
        }
        setJSONData({ value });
      }
      return;
    }

    // Default parameter update
    paramUpdated(param, attr, value, paramType, ...restArgs);
  };
};
