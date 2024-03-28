import * as _ from 'lodash';
import * as ivm from 'isolated-vm';

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
      const globalState = {
        ...state,
        ...customObjects,
        ...Object.fromEntries(reservedKeyword.map((keyWord) => [keyWord, null])),
      };
      const codeToExecute = getFunctionWrappedCode(code, globalState, isIfCondition);
      const isolate = new ivm.Isolate({ memoryLimit: 128 });
      const context = isolate.createContextSync();
      Object.entries(globalState).forEach(([key, value]) => {
        context.global.set(key, new ivm.ExternalCopy(value).copyInto({ release: true }));
      });
      const script = isolate.compileScriptSync(codeToExecute);
      console.log('code to be evaluated', codeToExecute);

      result = script.runSync(context, { release: true, timeout: 100, copy: true });
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

function resolveVariableReference(object, state, addLog) {
  const code = object.replace('{{', '').replace('}}', '');
  // Setting isIfCondition to true so that js query need not be
  // used in wrapped function
  const result = resolveCode({ code, state, isIfCondition: true, addLog });
  return result;
}

export function getQueryVariables(options, state, addLog) {
  const queryVariables = {};
  const optionsType = typeof options;

  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      const dynamicVariables = getDynamicVariables(options) || [];

      dynamicVariables.forEach((variable) => {
        queryVariables[variable] = resolveVariableReference(variable, state, addLog);
      });
      break;
    }

    case 'object': {
      if (Array.isArray(options)) {
        options.forEach((element) => {
          _.merge(queryVariables, getQueryVariables(element, state, addLog));
        });
      } else {
        Object.keys(options || {}).forEach((key) => {
          _.merge(queryVariables, getQueryVariables(options[key], state, addLog));
        });
      }
      break;
    }

    default:
      break;
  }
  return queryVariables;
}
