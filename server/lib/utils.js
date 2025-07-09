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
  let result = undefined;
  let error;
  // dont resolve if code starts with "queries." and ends with "run()"

  if (code.startsWith('queries.') && code.endsWith('run()')) {
    error = `Cannot resolve function call ${code}`;
  } else if (isJsCode) {
    const globalState = {
      ...state,
      ...customObjects,
      ...Object.fromEntries(reservedKeyword.map((keyWord) => [keyWord, null])),
    };
    const codeToExecute = getFunctionWrappedCode(
      'const console = { log: __reserved_keyword_log };\n' + code,
      globalState,
      isIfCondition
    );
    const isolate = new ivm.Isolate({ memoryLimit: parseInt(process.env?.WORKFLOWS_JS_MEMORY_LIMIT ?? '20') });
    const context = isolate.createContextSync();
    Object.entries(globalState).forEach(([key, value]) => {
      context.global.setSync(key, new ivm.ExternalCopy(value).copyInto({ release: true }));
    });

    context.global.setSync('global', context.global.derefInto());
    context.global.setSync('__reserved_keyword_log', addLog);
    const script = isolate.compileScriptSync(codeToExecute);

    // const interval = setInterval(() => {
    //   const stats = isolate.getHeapStatisticsSync();
    //   addLog(`Used heap size: ${stats.used_heap_size} / ${stats.heap_size_limit}`);
    //   if (stats.used_heap_size > stats.heap_size_limit * 0.9) {
    //     addLog('Memory limit nearing, terminating isolate');
    //     clearInterval(interval);
    //     isolate.dispose(); // Dispose isolate to free up memory
    //   }
    // }, 1); // Monitor every 100ms

    // try {
    result = script.runSync(context, { release: true, timeout: 100, copy: true });
    //   const stats = isolate.getHeapStatisticsSync();
    //   addLog("Used heap size: " + stats.used_heap_size);
    //   addLog("heap size limit: " + stats.heap_size_limit);
    // } catch(exception) {
    //   addLog(exception.message);
    // }

    // clearInterval(interval);
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
