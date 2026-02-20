import React from 'react';

/**
 * Generic hook that handles connection string autofill for any datasource.
 *
 * Orchestrates:
 * - Debounced parsing of connection strings (100ms)
 * - Full parse on first paste, incremental diff on subsequent edits
 * - Manual edit tracking (strategy decides which fields are protected)
 * - Skip logic for programmatic connection string changes
 * - Reset on datasource switch
 * - Detection of loading existing datasources (no re-autofill)
 *
 * @param {object} params
 * @param {object|null} params.strategy - The autofill strategy for this datasource kind
 * @param {object} params.options - Current datasource options
 * @param {function} params.optionsChanged - Batch update multiple options
 * @param {object} params.selectedDataSource - Currently selected datasource
 * @returns {object} { handleManualFieldEdit, manuallyEditedFieldsRef, skipNextAutoFillRef }
 */
export function useConnectionStringAutoFill({ strategy, options, optionsChanged, selectedDataSource }) {
  const lastAutoFilledConnRef = React.useRef('');
  const autoFillTimeoutRef = React.useRef(null);
  const manuallyEditedFieldsRef = React.useRef(new Set());
  const skipNextAutoFillRef = React.useRef(false);
  const prevDataSourceIdRef = React.useRef(selectedDataSource?.id);

  // Reset all tracking state when switching between datasources
  React.useEffect(() => {
    if (!strategy) return;
    const prevId = prevDataSourceIdRef.current;
    prevDataSourceIdRef.current = selectedDataSource?.id;

    if (prevId !== selectedDataSource?.id) {
      manuallyEditedFieldsRef.current.clear();
      lastAutoFilledConnRef.current = '';
      skipNextAutoFillRef.current = false;

      const connString = options?.[strategy.connectionStringKey]?.value;
      if (connString) {
        lastAutoFilledConnRef.current = connString;
      }
    }
  }, [selectedDataSource?.id, strategy, options]);

  // Core autofill effect — watches the connection string and fills individual fields
  React.useEffect(() => {
    if (!strategy) return;

    // Check if the datasource has a connection type toggle (manual vs string)
    // and only proceed if string mode is active
    if (strategy.connectionTypeKey) {
      const connectionType = options?.[strategy.connectionTypeKey]?.value;
      if (connectionType !== strategy.activeConnectionTypeValue) return;
    }

    const connString = options?.[strategy.connectionStringKey]?.value;

    // Clear any pending debounce
    if (autoFillTimeoutRef.current) {
      clearTimeout(autoFillTimeoutRef.current);
      autoFillTimeoutRef.current = null;
    }

    // Empty connection string — reset tracking
    if (!connString) {
      lastAutoFilledConnRef.current = '';
      manuallyEditedFieldsRef.current.clear();
      return;
    }

    // One-shot skip flag — programmatic changes that don't need autofill
    if (skipNextAutoFillRef.current) {
      skipNextAutoFillRef.current = false;
      lastAutoFilledConnRef.current = connString;
      return;
    }

    // No change from last autofill — nothing to do
    if (connString === lastAutoFilledConnRef.current) return;

    // Detect loading an existing datasource — the connection string is already
    // present from the backend, individual fields are already correct
    const isLoadingExisting =
      !lastAutoFilledConnRef.current &&
      selectedDataSource?.id &&
      selectedDataSource?.options?.[strategy.connectionStringKey]?.value === connString;

    if (isLoadingExisting) {
      lastAutoFilledConnRef.current = connString;
      return;
    }

    // Debounce: wait 100ms after last keystroke before parsing
    autoFillTimeoutRef.current = setTimeout(() => {
      const lastConn = lastAutoFilledConnRef.current;

      if (!lastConn) {
        // First time — full parse, fill all fields
        applyFullParse(strategy, connString, options, manuallyEditedFieldsRef, optionsChanged);
      } else {
        // Subsequent edit — try incremental diff
        const changeDetection = strategy.detectChanges(lastConn, connString);

        if (!changeDetection) {
          // Diff failed (e.g. malformed old/new string), fall back to full parse
          applyFullParse(strategy, connString, options, manuallyEditedFieldsRef, optionsChanged);
        } else {
          // Apply only the fields that changed
          applyIncrementalChanges(strategy, changeDetection, options, manuallyEditedFieldsRef, optionsChanged);
        }
      }

      lastAutoFilledConnRef.current = connString;
    }, 100);

    return () => {
      if (autoFillTimeoutRef.current) {
        clearTimeout(autoFillTimeoutRef.current);
      }
    };
  }, [
    options?.[strategy?.connectionStringKey]?.value,
    options?.[strategy?.connectionTypeKey]?.value,
    strategy,
    selectedDataSource?.id,
    optionsChanged,
    options,
  ]);

  /**
   * Call this from handleOptionChange to keep manual edit tracking in sync.
   *
   * When the user edits the connection string, this resets manual edit tracking
   * (preserving strategy-specific fields like connection_format for MongoDB).
   *
   * When the user edits an autofillable field, the strategy decides if that
   * field should be tracked (protected from future autofill overwrites).
   */
  const handleManualFieldEdit = React.useCallback(
    (key, value) => {
      if (!strategy) return;

      // Autofillable field was manually edited
      if (strategy.autoFillableFields.includes(key)) {
        if (strategy.shouldTrackManualEdit(key)) {
          manuallyEditedFieldsRef.current.add(key);
        }
        return;
      }

      // Connection string itself was edited — reset manual edit tracking
      if (key === strategy.connectionStringKey) {
        const behavior = strategy.getManualEditResetBehavior(key, value, lastAutoFilledConnRef.current);

        if (behavior.clearAll) {
          const preserved = new Set(behavior.preserve);
          manuallyEditedFieldsRef.current = new Set(
            [...manuallyEditedFieldsRef.current].filter((f) => preserved.has(f))
          );
        }
        for (const field of behavior.remove) {
          manuallyEditedFieldsRef.current.delete(field);
        }

        if (!value || value.trim() === '') {
          lastAutoFilledConnRef.current = '';
        }
      }
    },
    [strategy]
  );

  return {
    handleManualFieldEdit,
    manuallyEditedFieldsRef,
    skipNextAutoFillRef,
  };
}

/**
 * Parse the connection string fully and update all autofillable fields
 * that haven't been manually edited.
 */
function applyFullParse(strategy, connString, options, manuallyEditedFieldsRef, optionsChanged) {
  const parsed = strategy.parse(connString);
  if (!parsed) return;

  const updatedOptions = { ...options };
  let hasChanges = false;

  for (const field of strategy.autoFillableFields) {
    if (parsed[field] !== undefined && !manuallyEditedFieldsRef.current.has(field)) {
      updatedOptions[field] = { value: parsed[field] };
      hasChanges = true;
    }
  }

  if (hasChanges) {
    optionsChanged(updatedOptions);
  }
}

/**
 * Apply only the fields that changed between the old and new connection string,
 * skipping any fields that the user has manually edited.
 */
function applyIncrementalChanges(strategy, changeDetection, options, manuallyEditedFieldsRef, optionsChanged) {
  const { changes, newParsed } = changeDetection;
  const updatedOptions = { ...options };
  let hasChanges = false;

  for (const field of strategy.autoFillableFields) {
    if (changes[field] && !manuallyEditedFieldsRef.current.has(field)) {
      updatedOptions[field] = { value: newParsed[field] };
      hasChanges = true;
    }
  }

  if (hasChanges) {
    optionsChanged(updatedOptions);
  }
}
