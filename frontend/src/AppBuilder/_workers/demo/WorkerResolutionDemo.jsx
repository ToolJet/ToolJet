/**
 * Worker Resolution Demo
 *
 * A demo component to visualize how the worker architecture resolves
 * expressions and tracks dependencies. This helps developers see
 * the off-main-thread resolution in action.
 *
 * Usage:
 * 1. Enable worker architecture: window.__TOOLJET_CONFIG__.useWorkerArchitecture = true
 * 2. Import and render this component in your app
 *
 * Features demonstrated:
 * - Expression resolution ({{variables.x}}, {{components.input.value}})
 * - Dependency tracking (when input changes, dependent text updates)
 * - State sync between worker and main thread
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  useWorkerManager,
  useWorkerOperations,
} from "../../_hooks/useWorkerManager";
import {
  useWorkerResolved,
  useAllWorkerResolved,
  useWorkerVariable,
} from "../../_hooks/useWorkerResolved";
import {
  setFeatureFlag,
  FeatureFlags,
  isWorkerArchitectureEnabled,
} from "../../_helpers/featureFlags";

// Demo styles
const styles = {
  container: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "20px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    marginBottom: "8px",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    fontWeight: 500,
  },
  badgeEnabled: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  badgeDisabled: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
    backgroundColor: "#fff",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "#374151",
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "14px",
    marginBottom: "8px",
  },
  button: {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    marginRight: "8px",
    marginBottom: "8px",
  },
  buttonPrimary: {
    backgroundColor: "#3b82f6",
    color: "#fff",
  },
  buttonSecondary: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  resolvedValue: {
    padding: "12px",
    backgroundColor: "#f9fafb",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "13px",
    border: "1px solid #e5e7eb",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#6b7280",
    marginBottom: "4px",
    display: "block",
  },
  row: {
    display: "flex",
    gap: "16px",
    marginBottom: "12px",
  },
  col: {
    flex: 1,
  },
  codeBlock: {
    backgroundColor: "#1f2937",
    color: "#f9fafb",
    padding: "12px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "12px",
    overflow: "auto",
    maxHeight: "200px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    marginRight: "8px",
  },
};

/**
 * Demo app definition for testing resolution
 */
const demoAppDefinition = {
  components: [
    {
      id: "textinput1",
      name: "textinput1",
      componentType: "TextInput",
      parent: "canvas",
      properties: {
        placeholder: { value: "Enter a value..." },
        label: { value: "Input" },
      },
      styles: {},
      layouts: { desktop: { x: 0, y: 0, width: 200, height: 40 } },
    },
    {
      id: "text1",
      name: "text1",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: { value: "You typed: {{components.textinput1.value}}" },
      },
      styles: {
        textColor: { value: "{{variables.textColor}}" },
        fontSize: { value: "16" },
      },
      layouts: { desktop: { x: 0, y: 50, width: 400, height: 30 } },
    },
    {
      id: "text2",
      name: "text2",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: { value: "Counter: {{variables.counter}}" },
      },
      styles: {},
      layouts: { desktop: { x: 0, y: 90, width: 200, height: 30 } },
    },
    {
      id: "text3",
      name: "text3",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: {
          value:
            "Combined: {{components.textinput1.value}} + {{variables.counter}} = {{components.textinput1.value}}{{variables.counter}}",
        },
      },
      styles: {},
      layouts: { desktop: { x: 0, y: 130, width: 400, height: 30 } },
    },
  ],
  queries: [],
  variables: {
    counter: 0,
    textColor: "#3b82f6",
  },
  events: {},
};

/**
 * Component to display resolved text
 */
function ResolvedText({ componentId, label }) {
  const { resolved, isReady } = useWorkerResolved(componentId);

  if (!isReady) {
    return (
      <div style={styles.resolvedValue}>
        <span style={{ color: "#9ca3af" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <label style={styles.label}>{label}</label>
      <div style={styles.resolvedValue}>
        <strong>text:</strong> {resolved.text ?? "(not resolved)"}
        {resolved.textColor && (
          <>
            <br />
            <strong>textColor:</strong>{" "}
            <span style={{ color: resolved.textColor }}>
              {resolved.textColor}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Main demo component
 */
export function WorkerResolutionDemo() {
  const [isEnabled, setIsEnabled] = useState(isWorkerArchitectureEnabled());
  const [inputValue, setInputValue] = useState("");
  const [debugInfo, setDebugInfo] = useState(null);

  console.log('here--- isEnabled--- ', isEnabled);



  // Worker hooks
  const { workerManager, isReady, isInitializing, error, initialize } =
    useWorkerManager();
  const { setExposedValue, setVariable } = useWorkerOperations();
  const { resolved: allResolved } = useAllWorkerResolved();
  const counterValue = useWorkerVariable("counter");

  // Toggle worker architecture
  const handleToggle = useCallback(() => {
    const newValue = !isEnabled;
    setFeatureFlag(FeatureFlags.USE_WORKER_ARCHITECTURE, newValue);
    setIsEnabled(newValue);

    // Reload page to apply change
    if (confirm("Reload page to apply changes?")) {
      window.location.reload();
    }
  }, [isEnabled]);

  // Initialize demo
  const handleInitialize = useCallback(async () => {
    if (workerManager) {
      await initialize(demoAppDefinition, "canvas");
    }
  }, [workerManager, initialize]);

  // Handle input change
  const handleInputChange = useCallback(
    async (e) => {
      const value = e.target.value;
      setInputValue(value);

      if (isReady && setExposedValue) {
        await setExposedValue("textinput1", "value", value);
      }
    },
    [isReady, setExposedValue]
  );

  // Increment counter
  const handleIncrement = useCallback(async () => {
    if (isReady && setVariable) {
      const newValue = (counterValue ?? 0) + 1;
      await setVariable("counter", newValue);
    }
  }, [isReady, setVariable, counterValue]);

  // Get debug info
  const handleGetDebugInfo = useCallback(async () => {
    if (workerManager && isReady) {
      const info = await workerManager.getDebugInfo();
      setDebugInfo(info);
    }
  }, [workerManager, isReady]);

  // Auto-initialize when ready
  useEffect(() => {
    if (isEnabled && workerManager && !isReady && !isInitializing) {
      handleInitialize();
    }
  }, [isEnabled, workerManager, isReady, isInitializing, handleInitialize]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Worker Resolution Demo</h1>
        <span
          style={{
            ...styles.badge,
            ...(isEnabled ? styles.badgeEnabled : styles.badgeDisabled),
          }}
        >
          {isEnabled ? "Worker Enabled" : "Worker Disabled"}
        </span>
      </div>

      {/* Toggle & Status */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Configuration</h3>
        <div style={styles.row}>
          <div style={styles.col}>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              onClick={handleToggle}
            >
              {isEnabled ? "Disable Worker" : "Enable Worker"}
            </button>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handleInitialize}
              disabled={!isEnabled || !workerManager}
            >
              Re-initialize
            </button>
            <button
              style={{ ...styles.button, ...styles.buttonSecondary }}
              onClick={handleGetDebugInfo}
              disabled={!isReady}
            >
              Get Debug Info
            </button>
          </div>
        </div>
        <div>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isReady
                ? "#22c55e"
                : isInitializing
                  ? "#eab308"
                  : "#ef4444",
            }}
          />
          {isReady
            ? "Ready"
            : isInitializing
              ? "Initializing..."
              : error
                ? `Error: ${error}`
                : "Not initialized"}
        </div>
      </div>

      {/* Input Demo */}
      {isEnabled && isReady && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Interactive Demo</h3>
            <div style={styles.row}>
              <div style={styles.col}>
                <label style={styles.label}>TextInput (textinput1)</label>
                <input
                  type="text"
                  style={styles.input}
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type something..."
                />
              </div>
              <div style={styles.col}>
                <label style={styles.label}>Variable (counter)</label>
                <div>
                  <button
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={handleIncrement}
                  >
                    Increment Counter ({counterValue ?? 0})
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resolved Values */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Resolved Values (from Worker)</h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <ResolvedText
                componentId="text1"
                label="text1 - Shows input value with color from variable"
              />
              <ResolvedText
                componentId="text2"
                label="text2 - Shows counter variable"
              />
              <ResolvedText
                componentId="text3"
                label="text3 - Shows combined expression"
              />
            </div>
          </div>

          {/* All Resolved */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>All Resolved Components (Raw)</h3>
            <pre style={styles.codeBlock}>
              {JSON.stringify(allResolved, null, 2)}
            </pre>
          </div>
        </>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Debug Info</h3>
          <pre style={styles.codeBlock}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>How This Works</h3>
        <ol
          style={{
            margin: 0,
            paddingLeft: "20px",
            fontSize: "14px",
            lineHeight: "1.8",
          }}
        >
          <li>
            <strong>Enable Worker Architecture</strong> - Click the toggle to
            enable off-main-thread resolution
          </li>
          <li>
            <strong>Initialization</strong> - The demo app definition is sent to
            the worker and resolved
          </li>
          <li>
            <strong>Type in the input</strong> - The value is sent to the worker
            via <code>setExposedValue</code>
          </li>
          <li>
            <strong>Resolution</strong> - The worker resolves expressions like{" "}
            <code>{"{{components.textinput1.value}}"}</code>
          </li>
          <li>
            <strong>Dependency Tracking</strong> - Components depending on the
            input are automatically re-resolved
          </li>
          <li>
            <strong>State Sync</strong> - Resolved values are pushed to the main
            thread via batched operations
          </li>
        </ol>
      </div>

      {/* Expression Examples */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Expression Examples</h3>
        <table
          style={{
            width: "100%",
            fontSize: "13px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Component
              </th>
              <th
                style={{
                  padding: "8px",
                  textAlign: "left",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Expression
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                text1.text
              </td>
              <td
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #e5e7eb",
                  fontFamily: "monospace",
                }}
              >
                {"You typed: {{components.textinput1.value}}"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                text1.textColor
              </td>
              <td
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #e5e7eb",
                  fontFamily: "monospace",
                }}
              >
                {"{{variables.textColor}}"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px", borderBottom: "1px solid #e5e7eb" }}>
                text2.text
              </td>
              <td
                style={{
                  padding: "8px",
                  borderBottom: "1px solid #e5e7eb",
                  fontFamily: "monospace",
                }}
              >
                {"Counter: {{variables.counter}}"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "8px" }}>text3.text</td>
              <td style={{ padding: "8px", fontFamily: "monospace" }}>
                {
                  "{{components.textinput1.value}} + {{variables.counter}} = ..."
                }
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkerResolutionDemo;
