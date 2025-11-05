import * as _ from 'lodash';
import * as ivm from 'isolated-vm';

// When wrapInIIFE is true, run code inside an IIFE to support `return` statements
// and avoid leaking bindings. When false, run top-level to persist bindings.
const getFunctionWrappedCode = (code: string, state: any, wrapInIIFE: boolean): string => {
  if (wrapInIIFE) {
    return `(function(){${code}\n})()`;
  }
  return code;
};

export function resolveCode(codeContext: any): any {
  const {
    code,
    state,
    wrapInIIFE = true,
    customObjects = {},
    withError = false,
    reservedKeyword = [],
    addLog,
    isJsCode = true,
    bundleContent = null,
    isolate: providedIsolate = null as ivm.Isolate | null,
    context: providedContext = null as ivm.Context | null,
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
      'var console = { log: (...args) => __reserved_keyword_log(args.join(\', \'), \'normal\') };\n' + code,
      globalState,
      wrapInIIFE
    );
    const isolate = providedIsolate || new ivm.Isolate({ memoryLimit: parseInt(process.env?.WORKFLOW_JS_MEMORY_LIMIT_MB) || 20 });
    const context = providedContext || isolate.createContextSync();
    Object.entries(globalState).forEach(([key, value]) => {
      if (typeof value === 'function' && key === 'require') {
        // Special handling for require function - inject as callback
        context.global.setSync(key, new ivm.Callback(value as (...args: any[]) => any));
      } else {
        try {
          context.global.setSync(key, new ivm.ExternalCopy(value).copyInto({ release: true }));
        } catch (error) {
          // If copying fails (e.g., for complex libraries like lodash), skip it
          // The library should be available through the bundle code execution
          if (error.message.includes('could not be cloned')) {
            console.log(`[UTILS DEBUG] Skipping ${key} due to cloning issue, should be available via bundle:`, error.message);
          } else {
            throw error; // Re-throw if it's a different error
          }
        }
      }
    });

    context.global.setSync('global', context.global.derefInto());
    if (addLog) {
      context.global.setSync(
        '__reserved_keyword_log',
        new ivm.Callback((msg: any, status: any) => {
          try {
            (addLog as any)(String(msg), undefined, String(status || 'normal'));
          } catch (_) {
            // ignore logging failures to avoid breaking sandbox
          }
        })
      );
    }

    // Inject NPM package bundle if available
    if (bundleContent) {
      try {
        // Only initialize once per context
        const checkScript = isolate.compileScriptSync('typeof WorkflowPackages !== "undefined"');
        const alreadyInitialized = !!checkScript.runSync(context, { copy: true });
        if (!alreadyInitialized) {
          // Run the bundle as-is (avoid embedding in template literal)
          const bundle = isolate.compileScriptSync(bundleContent);
          bundle.runSync(context, { timeout: 5000 });

          // Install secure require and expose packages globally
          const shim = isolate.compileScriptSync(`
            if (typeof global.require === 'undefined') {
              global.require = function(packageName) {
                if (typeof packageName !== 'string') {
                  throw new Error('Package name must be a string');
                }
                if (typeof WorkflowPackages === 'undefined' || !WorkflowPackages[packageName]) {
                  throw new Error('Package "' + packageName + '" not found. Add it to your workflow dependencies.');
                }
                return WorkflowPackages[packageName];
              };
            }
            if (typeof WorkflowPackages !== 'undefined') {
              for (const [name, pkg] of Object.entries(WorkflowPackages)) {
                global[name] = pkg;
              }
            }
          `);
          shim.runSync(context, { timeout: 5000 });
        }
      } catch (bundleError) {
        addLog && (addLog as any)(`Failed to load NPM packages: ${bundleError.message}`, undefined, 'failure');
        // Continue execution without packages - don't fail the entire code execution
      }
    }

    let script: ivm.Script;
    try {
      script = isolate.compileScriptSync(codeToExecute);
    } catch (compileErr) {
      throw compileErr;
    }

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
    try {
      result = script.runSync(
        context,
        {
          release: true,
          timeout: parseInt(process.env?.WORKFLOW_JS_TIMEOUT_MS) || 100,
          copy: true
        }
      );
    } catch (runErr) {
      throw runErr;
    }
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

export function getDynamicVariables(text: string): string[] | null {
  const matchedParams = text.match(/\{\{(.*?)\}\}/g);
  return matchedParams;
}

function resolveVariableReference(
  object: string,
  state: any,
  addLog: (message: string) => void,
  bundleContent?: string,
  isolate?: ivm.Isolate | null,
  context?: ivm.Context | null
): any {
  const code = object.replace('{{', '').replace('}}', '');
  // Evaluate template expressions at top-level so they can access setupScript bindings
  const result = resolveCode({ code, state, addLog, bundleContent, isolate, context, wrapInIIFE: false });
  return result;
}

export function getQueryVariables(
  options: any,
  state: any,
  addLog: (message: string) => void = () => { },
  bundleContent?: string,
  isolate?: ivm.Isolate | null,
  context?: ivm.Context | null
): any {
  const queryVariables = {};
  const optionsType = typeof options;

  switch (optionsType) {
    case 'string': {
      options = options.replace(/\n/g, ' ');
      const dynamicVariables = getDynamicVariables(options) || [];

      dynamicVariables.forEach((variable) => {
        queryVariables[variable] = resolveVariableReference(variable, state, addLog, bundleContent, isolate, context);
      });
      break;
    }

    case 'object': {
      if (Array.isArray(options)) {
        options.forEach((element) => {
          _.merge(queryVariables, getQueryVariables(element, state, addLog, bundleContent, isolate, context));
        });
      } else {
        Object.keys(options || {}).forEach((key) => {
          _.merge(queryVariables, getQueryVariables(options[key], state, addLog, bundleContent, isolate, context));
        });
      }
      break;
    }

    default:
      break;
  }
  return queryVariables;
}
