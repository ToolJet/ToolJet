/**
 * ValidationEngine
 *
 * Handles component validation in the worker thread.
 * Validates component values against defined rules and custom functions.
 *
 * Features:
 * - Built-in validation rules (required, minLength, maxLength, min, max, regex)
 * - Custom validation functions via JavaScript
 * - Type-specific validators for different component types
 * - Validation error formatting
 *
 * Phase 3: Event Handling & Query Processing
 */

/**
 * Validation rule definition
 * @typedef {Object} ValidationRule
 * @property {string} type - Rule type (required, minLength, etc.)
 * @property {*} value - Rule value/parameter
 * @property {string} message - Custom error message
 */

/**
 * Validation result
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether validation passed
 * @property {string[]} errors - Array of error messages
 */

/**
 * Built-in validation rule types
 */
export const ValidationRuleTypes = {
  REQUIRED: "required",
  MIN_LENGTH: "minLength",
  MAX_LENGTH: "maxLength",
  MIN: "min",
  MAX: "max",
  REGEX: "regex",
  PATTERN: "pattern",
  EMAIL: "email",
  URL: "url",
  NUMERIC: "numeric",
  ALPHA: "alpha",
  ALPHANUMERIC: "alphanumeric",
  CUSTOM: "custom",
};

/**
 * ValidationEngine class for component validation
 */
export class ValidationEngine {
  constructor() {
    // RunJS engine for custom validations
    this.runJSEngine = null;

    // Resolution engine for resolving validation messages
    this.resolutionEngine = null;

    // Store reference
    this.store = null;

    // Debug mode
    this.debug = false;

    // Regex patterns for common validations
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      url: /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/,
      numeric: /^-?\d*\.?\d+$/,
      alpha: /^[a-zA-Z]+$/,
      alphanumeric: /^[a-zA-Z0-9]+$/,
      phone: /^\+?[\d\s-()]+$/,
    };
  }

  /**
   * Initialize the validation engine with dependencies
   * @param {object} store - Worker store reference
   * @param {object} resolutionEngine - Resolution engine reference
   * @param {object} runJSEngine - RunJS engine reference
   */
  initialize(store, resolutionEngine, runJSEngine) {
    this.store = store;
    this.resolutionEngine = resolutionEngine;
    this.runJSEngine = runJSEngine;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.debug = enabled;
  }

  /**
   * Log debug message
   * @param {...any} args
   */
  log(...args) {
    if (this.debug) {
      console.log("[ValidationEngine]", ...args);
    }
  }

  /**
   * Validate a component's value against its validation rules
   *
   * @param {string} componentId - Component ID
   * @param {*} value - Value to validate
   * @param {object} componentDef - Component definition
   * @param {object} state - Application state
   * @param {object} customObjects - Custom objects for resolution
   * @returns {ValidationResult} Validation result
   */
  validateComponent(
    componentId,
    value,
    componentDef,
    state,
    customObjects = {}
  ) {
    const errors = [];

    // Get validation rules from component definition
    const validationRules = this.getValidationRules(componentDef);

    if (validationRules.length === 0) {
      return { isValid: true, errors: [] };
    }

    this.log(`Validating ${componentId} with ${validationRules.length} rules`);

    for (const rule of validationRules) {
      const result = this.validateRule(value, rule, state, customObjects);

      if (!result.valid) {
        errors.push(result.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get validation rules from component definition
   *
   * @param {object} componentDef - Component definition
   * @returns {ValidationRule[]} Array of validation rules
   */
  getValidationRules(componentDef) {
    const rules = [];
    const validation =
      componentDef?.validation || componentDef?.properties?.validation;

    if (!validation) {
      return rules;
    }

    // Handle validation object structure
    if (typeof validation === "object") {
      // Check for common validation properties
      if (validation.mandatory || validation.required) {
        rules.push({
          type: ValidationRuleTypes.REQUIRED,
          message:
            validation.mandatoryMessage ||
            validation.requiredMessage ||
            "This field is required",
        });
      }

      if (validation.minLength !== undefined) {
        rules.push({
          type: ValidationRuleTypes.MIN_LENGTH,
          value: validation.minLength,
          message:
            validation.minLengthMessage ||
            `Minimum length is ${validation.minLength}`,
        });
      }

      if (validation.maxLength !== undefined) {
        rules.push({
          type: ValidationRuleTypes.MAX_LENGTH,
          value: validation.maxLength,
          message:
            validation.maxLengthMessage ||
            `Maximum length is ${validation.maxLength}`,
        });
      }

      if (validation.minValue !== undefined || validation.min !== undefined) {
        const minVal = validation.minValue ?? validation.min;
        rules.push({
          type: ValidationRuleTypes.MIN,
          value: minVal,
          message: validation.minValueMessage || `Minimum value is ${minVal}`,
        });
      }

      if (validation.maxValue !== undefined || validation.max !== undefined) {
        const maxVal = validation.maxValue ?? validation.max;
        rules.push({
          type: ValidationRuleTypes.MAX,
          value: maxVal,
          message: validation.maxValueMessage || `Maximum value is ${maxVal}`,
        });
      }

      if (validation.regex || validation.pattern) {
        rules.push({
          type: ValidationRuleTypes.REGEX,
          value: validation.regex || validation.pattern,
          message:
            validation.regexMessage ||
            validation.patternMessage ||
            "Invalid format",
        });
      }

      if (validation.customRule) {
        rules.push({
          type: ValidationRuleTypes.CUSTOM,
          value: validation.customRule,
          message: validation.customMessage || "Validation failed",
        });
      }
    }

    return rules;
  }

  /**
   * Validate a value against a single rule
   *
   * @param {*} value - Value to validate
   * @param {ValidationRule} rule - Validation rule
   * @param {object} state - Application state
   * @param {object} customObjects - Custom objects
   * @returns {{ valid: boolean, message: string }} Validation result
   */
  validateRule(value, rule, state, customObjects = {}) {
    const { type, value: ruleValue, message } = rule;

    // Resolve rule value if it's a dynamic expression
    const resolvedRuleValue = this.resolveValue(
      ruleValue,
      state,
      customObjects
    );
    const resolvedMessage = this.resolveValue(message, state, customObjects);

    switch (type) {
      case ValidationRuleTypes.REQUIRED:
        return this.validateRequired(value, resolvedMessage);

      case ValidationRuleTypes.MIN_LENGTH:
        return this.validateMinLength(
          value,
          resolvedRuleValue,
          resolvedMessage
        );

      case ValidationRuleTypes.MAX_LENGTH:
        return this.validateMaxLength(
          value,
          resolvedRuleValue,
          resolvedMessage
        );

      case ValidationRuleTypes.MIN:
        return this.validateMin(value, resolvedRuleValue, resolvedMessage);

      case ValidationRuleTypes.MAX:
        return this.validateMax(value, resolvedRuleValue, resolvedMessage);

      case ValidationRuleTypes.REGEX:
      case ValidationRuleTypes.PATTERN:
        return this.validateRegex(value, resolvedRuleValue, resolvedMessage);

      case ValidationRuleTypes.EMAIL:
        return this.validateEmail(value, resolvedMessage);

      case ValidationRuleTypes.URL:
        return this.validateUrl(value, resolvedMessage);

      case ValidationRuleTypes.NUMERIC:
        return this.validateNumeric(value, resolvedMessage);

      case ValidationRuleTypes.ALPHA:
        return this.validateAlpha(value, resolvedMessage);

      case ValidationRuleTypes.ALPHANUMERIC:
        return this.validateAlphanumeric(value, resolvedMessage);

      case ValidationRuleTypes.CUSTOM:
        return this.validateCustom(
          value,
          resolvedRuleValue,
          state,
          customObjects,
          resolvedMessage
        );

      default:
        this.log(`Unknown validation rule type: ${type}`);
        return { valid: true, message: "" };
    }
  }

  /**
   * Resolve a value that may contain dynamic expressions
   */
  resolveValue(value, state, customObjects) {
    if (!this.resolutionEngine || typeof value !== "string") {
      return value;
    }

    return this.resolutionEngine.resolveDynamicValues(
      value,
      state,
      customObjects
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDATION METHODS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate required field
   */
  validateRequired(value, message) {
    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    return {
      valid: !isEmpty,
      message: isEmpty ? message || "This field is required" : "",
    };
  }

  /**
   * Validate minimum length
   */
  validateMinLength(value, minLength, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" }; // Let required rule handle empty values
    }

    const length = String(value).length;
    const isValid = length >= minLength;

    return {
      valid: isValid,
      message: isValid ? "" : message || `Minimum length is ${minLength}`,
    };
  }

  /**
   * Validate maximum length
   */
  validateMaxLength(value, maxLength, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const length = String(value).length;
    const isValid = length <= maxLength;

    return {
      valid: isValid,
      message: isValid ? "" : message || `Maximum length is ${maxLength}`,
    };
  }

  /**
   * Validate minimum value
   */
  validateMin(value, min, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { valid: false, message: "Value must be a number" };
    }

    const isValid = numValue >= min;

    return {
      valid: isValid,
      message: isValid ? "" : message || `Minimum value is ${min}`,
    };
  }

  /**
   * Validate maximum value
   */
  validateMax(value, max, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { valid: false, message: "Value must be a number" };
    }

    const isValid = numValue <= max;

    return {
      valid: isValid,
      message: isValid ? "" : message || `Maximum value is ${max}`,
    };
  }

  /**
   * Validate against regex pattern
   */
  validateRegex(value, pattern, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    try {
      const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
      const isValid = regex.test(String(value));

      return {
        valid: isValid,
        message: isValid ? "" : message || "Invalid format",
      };
    } catch (error) {
      this.log("Invalid regex pattern:", pattern, error);
      return { valid: false, message: "Invalid validation pattern" };
    }
  }

  /**
   * Validate email format
   */
  validateEmail(value, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const isValid = this.patterns.email.test(String(value));

    return {
      valid: isValid,
      message: isValid ? "" : message || "Invalid email format",
    };
  }

  /**
   * Validate URL format
   */
  validateUrl(value, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const isValid = this.patterns.url.test(String(value));

    return {
      valid: isValid,
      message: isValid ? "" : message || "Invalid URL format",
    };
  }

  /**
   * Validate numeric value
   */
  validateNumeric(value, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const isValid = this.patterns.numeric.test(String(value));

    return {
      valid: isValid,
      message: isValid ? "" : message || "Value must be numeric",
    };
  }

  /**
   * Validate alphabetic value
   */
  validateAlpha(value, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const isValid = this.patterns.alpha.test(String(value));

    return {
      valid: isValid,
      message: isValid ? "" : message || "Value must contain only letters",
    };
  }

  /**
   * Validate alphanumeric value
   */
  validateAlphanumeric(value, message) {
    if (value === undefined || value === null || value === "") {
      return { valid: true, message: "" };
    }

    const isValid = this.patterns.alphanumeric.test(String(value));

    return {
      valid: isValid,
      message: isValid
        ? ""
        : message || "Value must contain only letters and numbers",
    };
  }

  /**
   * Validate using custom JavaScript function
   */
  validateCustom(value, customCode, state, customObjects, message) {
    if (!this.runJSEngine || !customCode) {
      return { valid: true, message: "" };
    }

    try {
      // Execute custom validation code
      // The code should return true/false or { valid: boolean, message?: string }
      const result = this.runJSEngine.execute(
        `return ${customCode}`,
        { ...state, value },
        { customObjects: { ...customObjects, value } }
      );

      if (result.success) {
        if (typeof result.result === "boolean") {
          return {
            valid: result.result,
            message: result.result ? "" : message || "Validation failed",
          };
        } else if (
          typeof result.result === "object" &&
          result.result !== null
        ) {
          return {
            valid: !!result.result.valid,
            message: result.result.valid
              ? ""
              : result.result.message || message || "Validation failed",
          };
        }
      }

      return {
        valid: false,
        message: result.error || "Custom validation error",
      };
    } catch (error) {
      this.log("Custom validation error:", error);
      return {
        valid: false,
        message: "Custom validation error",
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // BATCH VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Validate all components in a form
   *
   * @param {string[]} componentIds - Component IDs to validate
   * @param {object} state - Application state
   * @param {string} moduleId - Module ID
   * @returns {Map<string, ValidationResult>} Map of component ID to validation result
   */
  validateForm(componentIds, state, moduleId) {
    const results = new Map();

    for (const componentId of componentIds) {
      const componentDef = this.store?.getComponentDefinition(
        componentId,
        moduleId
      );
      if (!componentDef) continue;

      // Get current value from exposed values
      const value = state.components?.[componentId]?.value;

      const result = this.validateComponent(
        componentId,
        value,
        componentDef,
        state
      );
      results.set(componentId, result);
    }

    return results;
  }

  /**
   * Check if a form is valid
   *
   * @param {Map<string, ValidationResult>} validationResults - Validation results map
   * @returns {boolean} Whether all validations passed
   */
  isFormValid(validationResults) {
    for (const result of validationResults.values()) {
      if (!result.isValid) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get all errors from form validation
   *
   * @param {Map<string, ValidationResult>} validationResults - Validation results map
   * @returns {Map<string, string[]>} Map of component ID to error messages
   */
  getFormErrors(validationResults) {
    const errors = new Map();

    for (const [componentId, result] of validationResults) {
      if (!result.isValid && result.errors.length > 0) {
        errors.set(componentId, result.errors);
      }
    }

    return errors;
  }
}

// Export singleton instance
export const validationEngine = new ValidationEngine();

export default ValidationEngine;
