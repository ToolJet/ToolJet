/**
 * WorkerIntegrationTest
 *
 * A self-contained test component that verifies the worker architecture
 * is properly resolving expressions and tracking dependencies.
 *
 * This can be rendered anywhere in the app to test the worker.
 *
 * To use:
 * 1. Import this component
 * 2. Render it in your app
 * 3. Open browser console to see logs
 * 4. Interact with the inputs to see dependency tracking in action
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import * as Comlink from "comlink";
import {
  setFeatureFlag,
  FeatureFlags,
  isWorkerArchitectureEnabled,
  isWorkerDebugEnabled,
} from "../../_helpers/featureFlags";

// Inline styles for standalone rendering
const styles = {
  container: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "24px",
    maxWidth: "900px",
    margin: "0 auto",
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "24px",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "16px",
  },
  title: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "8px",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#334155",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusIndicator: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    display: "inline-block",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
  },
  buttonPrimary: {
    backgroundColor: "#3b82f6",
    color: "#fff",
  },
  buttonSecondary: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    border: "1px solid #e2e8f0",
  },
  buttonSuccess: {
    backgroundColor: "#22c55e",
    color: "#fff",
  },
  label: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#64748b",
    marginBottom: "6px",
    display: "block",
  },
  resolvedBox: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "14px",
    fontFamily: "monospace",
    fontSize: "13px",
  },
  codeBlock: {
    backgroundColor: "#1e293b",
    color: "#e2e8f0",
    padding: "16px",
    borderRadius: "8px",
    fontFamily: "monospace",
    fontSize: "12px",
    overflow: "auto",
    maxHeight: "250px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  log: {
    fontSize: "12px",
    padding: "8px 12px",
    borderRadius: "4px",
    marginBottom: "4px",
    fontFamily: "monospace",
  },
  logInfo: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  logSuccess: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  logError: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
};

/**
 * Test app definition with dependency chains
 */
const TEST_APP_DEFINITION = {
  components: [
    {
      id: "input1",
      name: "input1",
      componentType: "TextInput",
      parent: "canvas",
      properties: {
        placeholder: { value: "Type here..." },
      },
      styles: {},
    },
    {
      id: "text1",
      name: "text1",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: { value: "Input value: {{components.input1.value}}" },
      },
      styles: {
        textColor: { value: "{{variables.color}}" },
      },
    },
    {
      id: "text2",
      name: "text2",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: { value: "Counter is: {{variables.counter}}" },
      },
      styles: {},
    },
    {
      id: "text3",
      name: "text3",
      componentType: "Text",
      parent: "canvas",
      properties: {
        text: {
          value:
            "Combined: {{components.input1.value}} ({{variables.counter}})",
        },
      },
      styles: {},
    },
  ],
  queries: [],
  variables: {
    counter: 0,
    color: "#3b82f6",
  },
  events: {},
};

/**
 * Main test component
 */
export function WorkerIntegrationTest() {
  // State
  const [workerReady, setWorkerReady] = useState(false);
  const [workerError, setWorkerError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [counter, setCounter] = useState(0);
  const [resolved, setResolved] = useState({});
  const [logs, setLogs] = useState([]);
  const [debugInfo, setDebugInfo] = useState(null);

  // Worker refs
  const workerRef = useRef(null);
  const workerApiRef = useRef(null);

  // Add log
  const addLog = useCallback((message, type = "info") => {
    setLogs((prev) => [
      { message, type, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Initialize worker directly (bypassing hooks for standalone test)
  useEffect(() => {
    const initWorker = async () => {
      try {
        addLog("Creating worker...", "info");

        // Create worker
        const worker = new Worker(
          new URL("../compute.worker.js", import.meta.url),
          { type: "module", name: "TestWorker" }
        );

        workerRef.current = worker;

        // Wrap with Comlink
        const workerApi = Comlink.wrap(worker);
        workerApiRef.current = workerApi;

        addLog("Worker created, setting up callback...", "info");

        // Set up callback for receiving updates
        await workerApi.setMainThreadCallback(
          Comlink.proxy((operations) => {
            addLog(`Received ${operations.length} operations`, "success");

            // Process operations
            for (const op of operations) {
              if (op.type === "SET_RESOLVED") {
                setResolved((prev) => ({
                  ...prev,
                  [op.componentId]: op.resolved,
                }));
                addLog(
                  `Resolved ${op.componentId}: ${JSON.stringify(
                    op.resolved
                  ).slice(0, 50)}...`,
                  "success"
                );
              } else if (op.type === "SET_EXPOSED") {
                addLog(
                  `Exposed ${op.path} = ${JSON.stringify(op.value)}`,
                  "info"
                );
              }
            }
          })
        );

        addLog("Initializing with test app definition...", "info");

        // Initialize
        const result = await workerApi.initialize(
          TEST_APP_DEFINITION,
          "canvas"
        );

        addLog(
          `Initialized: ${result.componentCount} components, ${result.queryCount} queries`,
          "success"
        );

        // Enable debug mode
        await workerApi.setDebugMode(true);

        setWorkerReady(true);
        setWorkerError(null);
      } catch (error) {
        console.error("Worker init error:", error);
        addLog(`Error: ${error.message}`, "error");
        setWorkerError(error.message);
      }
    };

    initWorker();

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [addLog]);

  // Handle input change
  const handleInputChange = useCallback(
    async (e) => {
      const value = e.target.value;
      setInputValue(value);

      if (workerApiRef.current && workerReady) {
        addLog(`Setting input1.value = "${value}"`, "info");
        await workerApiRef.current.setExposedValue(
          "input1",
          "value",
          value,
          {}
        );
      }
    },
    [workerReady, addLog]
  );

  // Handle counter increment
  const handleIncrement = useCallback(async () => {
    const newValue = counter + 1;
    setCounter(newValue);

    if (workerApiRef.current && workerReady) {
      addLog(`Setting variable counter = ${newValue}`, "info");
      await workerApiRef.current.setVariable("counter", newValue);
    }
  }, [counter, workerReady, addLog]);

  // Get debug info
  const handleGetDebug = useCallback(async () => {
    if (workerApiRef.current && workerReady) {
      const info = await workerApiRef.current.getDebugInfo();
      setDebugInfo(info);
      addLog("Got debug info", "info");
    }
  }, [workerReady, addLog]);

  // Force re-resolve
  const handleForceResolve = useCallback(async () => {
    if (workerApiRef.current && workerReady) {
      await workerApiRef.current.forceResolveAll();
      addLog("Forced re-resolution of all components", "info");
    }
  }, [workerReady, addLog]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Worker Integration Test</h1>
        <p style={styles.subtitle}>
          Test the off-main-thread resolution engine and dependency tracking
        </p>
      </div>

      {/* Status */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span
            style={{
              ...styles.statusIndicator,
              backgroundColor: workerReady
                ? "#22c55e"
                : workerError
                ? "#ef4444"
                : "#eab308",
            }}
          />
          Worker Status
        </div>
        <div style={{ fontSize: "14px", color: "#475569" }}>
          {workerReady
            ? "Ready - Worker is initialized and processing"
            : workerError
            ? `Error: ${workerError}`
            : "Initializing..."}
        </div>
      </div>

      {/* Interactive Test */}
      {workerReady && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Interactive Test</div>

          <div style={styles.grid}>
            <div>
              <label style={styles.label}>
                TextInput (input1) - Type to see dependent components update
              </label>
              <input
                type="text"
                style={styles.input}
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Type something..."
              />
            </div>

            <div>
              <label style={styles.label}>Variable (counter)</label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <button
                  style={{ ...styles.button, ...styles.buttonPrimary }}
                  onClick={handleIncrement}
                >
                  Increment ({counter})
                </button>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={handleGetDebug}
                >
                  Debug Info
                </button>
                <button
                  style={{ ...styles.button, ...styles.buttonSecondary }}
                  onClick={handleForceResolve}
                >
                  Force Resolve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolved Values */}
      {workerReady && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Resolved Component Values</div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {["text1", "text2", "text3"].map((compId) => (
              <div key={compId}>
                <label style={styles.label}>
                  {compId} -{" "}
                  {compId === "text1"
                    ? "Depends on input1.value + variables.color"
                    : compId === "text2"
                    ? "Depends on variables.counter"
                    : "Depends on input1.value + variables.counter"}
                </label>
                <div style={styles.resolvedBox}>
                  {resolved[compId] ? (
                    <>
                      <strong>text:</strong>{" "}
                      {resolved[compId].text ?? "(empty)"}
                      {resolved[compId].textColor && (
                        <>
                          <br />
                          <strong>textColor:</strong>{" "}
                          <span style={{ color: resolved[compId].textColor }}>
                            {resolved[compId].textColor}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>Not resolved yet</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info */}
      {debugInfo && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>Debug Information</div>
          <pre style={styles.codeBlock}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {/* Activity Log */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Activity Log</div>
        <div style={{ maxHeight: "200px", overflow: "auto" }}>
          {logs.map((log, i) => (
            <div
              key={i}
              style={{
                ...styles.log,
                ...(log.type === "success"
                  ? styles.logSuccess
                  : log.type === "error"
                  ? styles.logError
                  : styles.logInfo),
              }}
            >
              <span style={{ opacity: 0.7 }}>[{log.time}]</span> {log.message}
            </div>
          ))}
          {logs.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: "13px" }}>
              No activity yet...
            </div>
          )}
        </div>
      </div>

      {/* Test Cases */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>Test Cases</div>
        <table
          style={{
            width: "100%",
            fontSize: "13px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f8fafc" }}>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Test
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "left",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Expected Behavior
              </th>
              <th
                style={{
                  padding: "10px",
                  textAlign: "center",
                  borderBottom: "1px solid #e2e8f0",
                }}
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}
              >
                Type in input
              </td>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}
              >
                text1 and text3 should update with new value
              </td>
              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #e2e8f0",
                  textAlign: "center",
                }}
              >
                {resolved.text1?.text?.includes(inputValue) && inputValue
                  ? "✅"
                  : "⏳"}
              </td>
            </tr>
            <tr>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}
              >
                Increment counter
              </td>
              <td
                style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}
              >
                text2 and text3 should update with new counter
              </td>
              <td
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #e2e8f0",
                  textAlign: "center",
                }}
              >
                {resolved.text2?.text?.includes(String(counter)) && counter > 0
                  ? "✅"
                  : "⏳"}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "10px" }}>Color variable</td>
              <td style={{ padding: "10px" }}>
                text1 should have textColor resolved to #3b82f6
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                {resolved.text1?.textColor === "#3b82f6" ? "✅" : "⏳"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default WorkerIntegrationTest;
