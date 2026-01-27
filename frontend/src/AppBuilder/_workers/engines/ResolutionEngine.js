/**
 * ResolutionEngine
 *
 * Handles expression resolution in the worker thread.
 * Ported from _stores/utils.js for off-main-thread execution.
 *
 * Features:
 * - Resolves dynamic values like {{components.compId.value}}
 * - Evaluates JavaScript expressions safely
 * - Extracts dynamic variables from strings
 */

// Import moment for date operations in expressions
import moment from "moment";

// Import lodash for utility functions in expressions
const _ = require("lodash");

/**
 * ResolutionEngine class for handling expression resolution
 */
export class ResolutionEngine {
  constructor() {
    this.cache = new Map();
    this.cacheEnabled = true;
    this.maxCacheSize = 1000;
  }

  /**
   * Enable or disable caching
   * @param {boolean} enabled
   */
  setCacheEnabled(enabled) {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.cache.clear();
    }
  }

  /**
   * Clear the resolution cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache key for a resolution
   * @param {string} code - The code to resolve
   * @param {object} state - Current state (we'll use a hash)
   * @returns {string} Cache key
   */
  getCacheKey(code, stateHash) {
    return `${code}::${stateHash}`;
  }

  /**
   * Returns an array of dynamic variables in the text like {{variable}} or %%variable%%
   * Eg, input: "Hello, {{name}}! Welcome to {{city}}."
   *     output: ["{{name}}", "{{city}}"]
   *
   * @param {string} text - Text to extract variables from
   * @returns {string[]|null} Array of dynamic variables or null
   */
  getDynamicVariables(text) {
    if (typeof text !== "string") return null;
    /* eslint-disable no-useless-escape */
    const matchedParams =
      text.match(/\{\{(.*?)\}\}/g) || text.match(/\%\%(.*?)\%\%/g);
    return matchedParams;
  }

  /**
   * Check if a query has string content other than just a variable reference
   * @param {string} query - The query string to check
   * @returns {boolean}
   */
  queryHasStringOtherThanVariable(query) {
    const startsWithDoubleCurly = query.startsWith("{{");
    const endsWithDoubleCurly = query.endsWith("}}");

    if (startsWithDoubleCurly && endsWithDoubleCurly) {
      const content = query.slice(2, -2).trim();

      if (content.includes(" ")) {
        return true;
      }

      // Check if the content includes a template literal
      const templateLiteralRegex = /\$\{[^}]+\}/;
      return templateLiteralRegex.test(content);
    }

    return false;
  }

  /**
   * Remove nested double curly braces from a string
   * Converts {{expression}} to just the expression
   *
   * @param {string} str - String with curly braces
   * @returns {string} String without outer curly braces
   */
  removeNestedDoubleCurlyBraces(str) {
    const transformedInput = str.split("");
    let iter = 0;
    const stack = [];

    while (iter < str.length - 1) {
      if (
        transformedInput[iter] === "{" &&
        transformedInput[iter + 1] === "{"
      ) {
        transformedInput[iter] = "le";
        transformedInput[iter + 1] = "le";
        stack.push(2);
        iter += 2;
      } else if (transformedInput[iter] === "{") {
        stack.push(1);
        iter++;
      } else if (
        transformedInput[iter] === "}" &&
        stack.length > 0 &&
        stack[stack.length - 1] === 1
      ) {
        stack.pop();
        iter++;
      } else if (
        transformedInput[iter] === "}" &&
        stack.length > 0 &&
        transformedInput[iter + 1] === "}" &&
        stack[stack.length - 1] === 2
      ) {
        stack.pop();
        transformedInput[iter] = "ri";
        transformedInput[iter + 1] = "ri";
        iter += 2;
      } else {
        iter++;
      }
    }

    iter = 0;
    let shouldRemoveSpace = true;
    while (iter < str.length) {
      if (
        shouldRemoveSpace &&
        [" ", "\n", "\t"].includes(transformedInput[iter])
      ) {
        transformedInput[iter] = "";
      } else if (transformedInput[iter] === "le") {
        shouldRemoveSpace = true;
        transformedInput[iter] = "";
      } else {
        shouldRemoveSpace = false;
      }
      iter++;
    }

    iter = str.length - 1;
    shouldRemoveSpace = true;
    while (iter >= 0) {
      if (
        shouldRemoveSpace &&
        [" ", "\n", "\t"].includes(transformedInput[iter])
      ) {
        transformedInput[iter] = "";
      } else if (transformedInput[iter] === "ri") {
        shouldRemoveSpace = true;
        transformedInput[iter] = "";
      } else {
        shouldRemoveSpace = false;
      }
      iter--;
    }

    return transformedInput.join("");
  }

  /**
   * Resolve a code expression to its actual value
   * Converts components["compId"].value to actual value
   *
   * @param {string} code - Code expression to resolve
   * @param {object} state - Current application state
   * @param {object} customObjects - Additional custom objects for resolution
   * @param {boolean} withError - Whether to return error information
   * @param {string[]} reservedKeyword - Reserved keywords
   * @param {boolean} isJsCode - Whether this is JS code context
   * @returns {*} Resolved value or [result, error] if withError is true
   */
  resolveCode(
    code,
    state = {},
    customObjects = {},
    withError = false,
    reservedKeyword = [],
    isJsCode = true
  ) {
    let result = "";
    let error;

    if (code === "_" || code.includes("this._")) {
      error = `Cannot resolve circular reference ${code}`;
    } else if (code.startsWith("queries.") && code.endsWith("run()")) {
      // Don't resolve if code starts with "queries." and ends with "run()"
      error = `Cannot resolve function call ${code}`;
    } else {
      try {
        const evalFunction = Function(
          [
            "variables",
            "components",
            "queries",
            "globals",
            "page",
            "input",
            "client",
            "server",
            "constants",
            "parameters",
            "moment",
            "_",
            ...Object.keys(customObjects),
            reservedKeyword,
          ],
          `return ${code}`
        );
        result = evalFunction(
          isJsCode ? state?.variables : undefined,
          isJsCode ? state?.components : undefined,
          isJsCode ? state?.queries : undefined,
          isJsCode ? state?.globals : undefined,
          isJsCode ? state?.page : undefined,
          isJsCode ? state?.input : undefined,
          isJsCode ? undefined : state?.client,
          isJsCode ? undefined : state?.server,
          state?.constants,
          state?.parameters,
          moment,
          _,
          ...Object.values(customObjects),
          null
        );
      } catch (err) {
        error = err;
      }
    }

    if (withError) return [result, error];
    return result;
  }

  /**
   * Resolve dynamic values in a string
   * Converts "Hello {{components.compId.value}}" to "Hello 123"
   *
   * @param {string} code - String with dynamic values
   * @param {object} state - Current application state
   * @param {object} customObjects - Additional custom objects
   * @param {boolean} withError - Whether to return error information
   * @param {string[]} reservedKeyword - Reserved keywords
   * @param {boolean} isJsCode - Whether this is JS code context
   * @returns {*} Resolved value
   */
  resolveDynamicValues(
    code,
    state = {},
    customObjects = {},
    withError = false,
    reservedKeyword = [],
    isJsCode = true
  ) {
    try {
      // Handle non-string inputs
      if (typeof code !== "string") {
        return code;
      }

      // Check if there are any dynamic variables
      const allDynamicVariables = this.getDynamicVariables(code) || [];

      // If no dynamic variables, return as-is
      if (allDynamicVariables.length === 0) {
        return code;
      }

      const queryHasJSCode = this.queryHasStringOtherThanVariable(code);
      let useJSResolvers = queryHasJSCode || allDynamicVariables.length > 1;

      if (
        !queryHasJSCode &&
        allDynamicVariables.length === 1 &&
        (!code.startsWith("{{") || !code.endsWith("}}")) &&
        code.includes("{{")
      ) {
        useJSResolvers = true;
      }

      if (useJSResolvers) {
        try {
          let resolvedValue = code;
          let isJSCodeResolver =
            queryHasJSCode &&
            (allDynamicVariables.length === 1 ||
              allDynamicVariables.length === 0);

          if (!isJSCodeResolver) {
            allDynamicVariables.forEach((variable) => {
              const variableToResolve =
                this.removeNestedDoubleCurlyBraces(variable);
              const resolvedCode = this.resolveCode(
                variableToResolve,
                state,
                customObjects,
                withError,
                reservedKeyword,
                isJsCode
              );
              resolvedValue = resolvedValue.replace(
                variable,
                resolvedCode ?? ""
              );
            });
          } else {
            const variableToResolve = this.removeNestedDoubleCurlyBraces(code);
            const resolvedCode = this.resolveCode(
              variableToResolve,
              state,
              customObjects,
              withError,
              reservedKeyword,
              isJsCode
            );
            resolvedValue =
              typeof resolvedCode === "string"
                ? resolvedValue.replace(code, resolvedCode)
                : resolvedCode;
          }
          return resolvedValue;
        } catch (error) {
          console.error("[ResolutionEngine] Error resolving code", error);
          return code;
        }
      } else {
        let value = this.removeNestedDoubleCurlyBraces(code);
        const resolvedCode = this.resolveCode(
          value,
          state,
          customObjects,
          withError,
          reservedKeyword,
          isJsCode
        );
        return resolvedCode;
      }
    } catch (error) {
      console.error("[ResolutionEngine] Error in resolveDynamicValues", error);
      return code;
    }
  }

  /**
   * Resolve all properties of a component definition
   *
   * @param {object} componentDef - Component definition with properties
   * @param {object} state - Current application state
   * @param {object} customObjects - Custom objects for resolution (e.g., listItem)
   * @returns {object} Resolved properties
   */
  resolveComponentProperties(componentDef, state, customObjects = {}) {
    const resolved = {};
    const properties = componentDef?.properties || {};
    const styles = componentDef?.styles || {};
    const general = componentDef?.general || {};
    const generalStyles = componentDef?.generalStyles || {};

    // Resolve properties
    for (const [key, propDef] of Object.entries(properties)) {
      const value = propDef?.value;
      if (value !== undefined) {
        resolved[key] = this.resolveDynamicValues(value, state, customObjects);
      }
    }

    // Resolve styles
    for (const [key, styleDef] of Object.entries(styles)) {
      const value = styleDef?.value;
      if (value !== undefined) {
        resolved[key] = this.resolveDynamicValues(value, state, customObjects);
      }
    }

    // Resolve general properties
    for (const [key, genDef] of Object.entries(general)) {
      const value = genDef?.value;
      if (value !== undefined) {
        resolved[key] = this.resolveDynamicValues(value, state, customObjects);
      }
    }

    // Resolve general styles
    for (const [key, genStyleDef] of Object.entries(generalStyles)) {
      const value = genStyleDef?.value;
      if (value !== undefined) {
        resolved[key] = this.resolveDynamicValues(value, state, customObjects);
      }
    }

    return resolved;
  }

  /**
   * Extract dependencies from a value
   * Returns paths like "components.button1.value" that the value depends on
   *
   * @param {string} value - Value to extract dependencies from
   * @returns {string[]} Array of dependency paths
   */
  extractDependencies(value) {
    if (typeof value !== "string") return [];

    const dependencies = [];
    const variables = this.getDynamicVariables(value) || [];

    for (const variable of variables) {
      const expression = this.removeNestedDoubleCurlyBraces(variable);

      // Extract component references: components.id.property or components["id"].property
      const componentRegex =
        /components(?:\["([^"]+)"\]|\.([^.\s\[\]]+))\.([^\s\[\]{}]+)/g;
      let match;
      while ((match = componentRegex.exec(expression)) !== null) {
        const componentId = match[1] || match[2];
        const property = match[3].split(".")[0]; // Get first level property
        dependencies.push(`components.${componentId}.${property}`);
      }

      // Extract query references: queries.id.data or queries["id"].data
      const queryRegex =
        /queries(?:\["([^"]+)"\]|\.([^.\s\[\]]+))\.([^\s\[\]{}]+)/g;
      while ((match = queryRegex.exec(expression)) !== null) {
        const queryId = match[1] || match[2];
        const property = match[3].split(".")[0];
        dependencies.push(`queries.${queryId}.${property}`);
      }

      // Extract variable references: variables.name
      const variableRegex = /variables\.([^\s\[\]{}().]+)/g;
      while ((match = variableRegex.exec(expression)) !== null) {
        dependencies.push(`variables.${match[1]}`);
      }

      // Extract page variable references: page.variables.name
      const pageVarRegex = /page\.variables\.([^\s\[\]{}().]+)/g;
      while ((match = pageVarRegex.exec(expression)) !== null) {
        dependencies.push(`page.variables.${match[1]}`);
      }

      // Extract globals references: globals.property
      const globalsRegex = /globals\.([^\s\[\]{}().]+)/g;
      while ((match = globalsRegex.exec(expression)) !== null) {
        dependencies.push(`globals.${match[1]}`);
      }
    }

    // Remove duplicates
    return [...new Set(dependencies)];
  }

  /**
   * Check if a value has dynamic content
   * @param {*} value - Value to check
   * @returns {boolean} True if value contains dynamic content
   */
  hasDynamicContent(value) {
    if (typeof value !== "string") return false;
    return /\{\{.*?\}\}/.test(value) || /\%\%.*?\%\%/.test(value);
  }
}

// Export singleton instance
export const resolutionEngine = new ResolutionEngine();

export default ResolutionEngine;
