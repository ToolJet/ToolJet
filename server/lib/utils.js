import * as _ from 'lodash';
import { VM } from 'vm2';

const getFunctionWrappedCode = (code, state, isIfCondition) => {
  if (isIfCondition) {
    return code;
  }
  return `const fn = () => {${code}}; fn()`;
};

export function resolveCode(codeContext) {
  const {
    code,
    state,
    isIfCondition = false,
    customObjects = {},
    withError = false,
    reservedKeyword = [],
    addLog,
    isJsCode = true,
  } = codeContext;
  let result = '';
  let error;
  // dont resolve if code starts with "queries." and ends with "run()"

  if (code.startsWith('queries.') && code.endsWith('run()')) {
    error = `Cannot resolve function call ${code}`;
  } else if (isJsCode) {
    try {
      const vm = new VM({
        sandbox: {
          ...state,
          ...customObjects,
          ...Object.fromEntries(reservedKeyword.map((keyWord) => [keyWord, null])),
        },
        timeout: 100,
      });
      console.log('code to be evaluated', code);
      let functionEnvelopedCode = getFunctionWrappedCode(code, state, isIfCondition);

      result = vm.run(functionEnvelopedCode);
    } catch (err) {
      error = err;
      console.log('eval_error', err);
      addLog(
        JSON.stringify({
          message: err.message,
          stack: err.stack,
          name: err.name,
        })
      );
    }
  }

  if (withError) return [result, error];
  return result;
}

export function getDynamicVariables(text) {
  const matchedParams = text.match(/\{\{(.*?)\}\}/g);
  return matchedParams;
}

//! Only this is enough to resolve variables in nodes
function resolveVariableReference(object, state) {
  const code = object.replace('{{', '').replace('}}', '');

  if ((object.match(/{{/g) || []).length === 1) {
    return state[code];
  }

  return object;
}

export function getQueryVariables(options, state) {
  const queryVariables = {};
  const optionsType = typeof options;

  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      const dynamicVariables = getDynamicVariables(options) || [];

      dynamicVariables.forEach((variable) => {
        queryVariables[variable] = resolveVariableReference(variable, state);
      });
      break;
    }

    case 'object': {
      if (Array.isArray(options)) {
        options.forEach((element) => {
          _.merge(queryVariables, getQueryVariables(element, state));
        });
      } else {
        Object.keys(options || {}).forEach((key) => {
          _.merge(queryVariables, getQueryVariables(options[key], state));
        });
      }
      break;
    }

    default:
      break;
  }
  return queryVariables;
}
