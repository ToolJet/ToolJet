const envVar = Cypress.env("environment");

const optionsFallback = (kind = "runjs", nodeName = "runjs1") => {
  if (kind === "runjs") {
    return { code: "return startTrigger.params", parameters: [] };
  }
  if (kind === "restapi") {
    return {
      method: "GET",
      path: "/",
      headers: [],
      query: [],
      body: { type: "json", value: {} },
      pluginId: null,
    };
  }
  return {};
};

Cypress.Commands.add("apiCreateWorkflow", (workflowName, reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/apps`,
      headers: headers,
      body: {
        icon: "sentfast",
        name: workflowName,
        type: "workflow",
      },
    }).then((response) => {
      expect(response.status).to.equal(201);

      const workflowId = response.body?.id || response.allRequestResponses?.[0]?.["Response Body"]?.id;
      const userId = response.body?.user_id || response.allRequestResponses?.[0]?.["Response Body"]?.user_id;

      Cypress.env("workflowId", workflowId);
      Cypress.env("user_id", userId);

      Cypress.log({
        name: "Workflow create",
        displayName: "WORKFLOW CREATED",
        message: `: ${response.body.name}`,
      });
    });
  });
});

Cypress.Commands.add(
  "apiOpenWorkflowByName",
  (
    workflowName,
    workspaceId = Cypress.env("workspaceId"),
    componentSelector = "[data-cy='workflow-canvas']",
    reuseSession = false
  ) => {
    cy.getAuthHeaders(reuseSession).then((headers) => {
      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps?page=1&type=workflow&searchKey=${workflowName}`,
        headers: headers,
      }, { log: false }).then((response) => {
        const workflow = response.body.apps?.find(
          app => app.name === workflowName || app.slug === workflowName
        );

        if (!workflow) throw new Error(`Workflow "${workflowName}" not found`);
        Cypress.env("workflowId", workflow.id);
        cy.openWorkflow(workflow.slug, workspaceId, workflow.id, componentSelector);

        Cypress.log({
          name: "Workflow Open",
          displayName: "WORKFLOW OPENED",
          message: `: ${workflowName}`,
        });
      });
    });
  }
);

Cypress.Commands.add("apiDeleteWorkflow", (workflowName, reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps?page=1&type=workflow&searchKey=${workflowName}`,
      headers: headers,
    }, { log: false }).then((response) => {
      const workflow = response.body.apps?.find(
        app => app.name === workflowName || app.slug === workflowName
      );

      if (!workflow) throw new Error(`Workflow "${workflowName}" not found`);
      cy.request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/apps/${workflow.id}`,
        headers: headers,
      }, { log: false }).then((deleteResponse) => {
        expect(deleteResponse.status).to.equal(200);
        Cypress.log({
          name: "Workflow Delete",
          displayName: "WORKFLOW DELETED",
          message: `: ${workflowName}`,
        });
      });
    });
  });
});

Cypress.Commands.add("apiCreateWorkflowApp", (workflowName, reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/workflows`,
      headers,
      body: { icon: "menuhome", name: workflowName, type: "workflow" },
    }).then((res) => {
      expect(res.status).to.equal(201);
      Cypress.env("workflowId", res.body.id);
      Cypress.env("user_id", res.body.user_id);
    });
  });
});

Cypress.Commands.add("apiFetchWorkflowContext", (reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const workflowId = Cypress.env("workflowId");
    if (!workflowId) throw new Error("Missing workflowId in env");
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/apps/${workflowId}`,
      headers,
    }).then((appResponse) => {
      expect(appResponse.status).to.equal(200);
      Cypress.env("editingVersionId", appResponse.body.editing_version?.id);
      Cypress.env("editingVersionName", appResponse.body.editing_version?.name);
      Cypress.env("environmentId", appResponse.body.editorEnvironment?.id);
    });
  });
});

Cypress.Commands.add("apiGetDataSourceId", (kindOrName = "runjs", reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const versionId = Cypress.env("editingVersionId");
    const environmentId = Cypress.env("environmentId");
    if (!versionId || !environmentId) throw new Error("Missing version/environment id in env");
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${environmentId}/versions/${versionId}`,
      headers,
    }).then((dsResponse) => {
      expect(dsResponse.status).to.equal(200);
      const ds = dsResponse.body.data_sources?.find(
        (d) => d.kind === kindOrName || d.name?.toLowerCase() === kindOrName.toLowerCase()
      );
      if (!ds) throw new Error(`${kindOrName} data source not found`);
      Cypress.env("nodeDataSourceId", ds.id);
    });
  });
});

Cypress.Commands.add("apiCreateWorkflowNode", (kind = "runjs", name = "node1", options = {}, reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const workflowId = Cypress.env("workflowId");
    const versionId = Cypress.env("editingVersionId");
    const dataSourceId = Cypress.env("nodeDataSourceId");
    if (!workflowId || !versionId) throw new Error("Missing workflow/version id in env");
    const body = {
      app_id: workflowId,
      app_version_id: versionId,
      name,
      kind,
      options,
      data_source_id: dataSourceId || null,
      plugin_id: null,
    };
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/data-queries/workflow-node`,
      headers,
      body,
    }).then((res) => {
      expect(res.status).to.equal(201);
      Cypress.env(`${name}QueryId`, res.body.id);
      Cypress.env("lastNodeQueryId", res.body.id);
      Cypress.env("lastNodeName", name);
    });
  });
});

Cypress.Commands.add(
  "apiWireWorkflowDefinition",
  (
    {
      processingNodeName = Cypress.env("lastNodeName") || "runjs1",
      processingNodeId = Cypress.env(`${Cypress.env("lastNodeName") || processingNodeName}QueryId`),
      processingKind = "runjs",
      defaultParams = '{"dev":"your value"}',
      responseCode = `return ${processingNodeName}.data`,
      responseStatus = "200",
    } = {},
    reuseSession = false
  ) => {
    cy.getAuthHeaders(reuseSession).then((headers) => {
      const workflowId = Cypress.env("workflowId");
      const versionId = Cypress.env("editingVersionId");
      if (!workflowId || !versionId || !processingNodeId) throw new Error("Missing workflow/version/node id");
      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/v2/apps/${workflowId}/versions/${versionId}`,
        headers: { ...headers, "Content-Type": "application/json" },
        body: {
          is_user_switched_version: false,
          definition: {
            nodes: [
              {
                id: "start-node-1",
                data: { nodeType: "start", label: "Start trigger" },
                position: { x: 100, y: 250 },
                type: "input",
                sourcePosition: "right",
                deletable: false,
                width: 206,
                height: 42,
              },
              {
                id: `${processingKind}-node-1`,
                type: "query",
                sourcePosition: "right",
                targetPosition: "left",
                draggable: true,
                data: {
                  idOnDefinition: processingNodeId,
                  kind: processingKind,
                  options: optionsFallback(processingKind, processingNodeName),
                },
                position: { x: 495, y: 146 },
                deletable: false,
                width: 206,
                height: 40,
              },
              {
                id: "response-node-1",
                data: {
                  nodeType: "response",
                  label: "Response",
                  code: responseCode,
                  statusCode: { fxActive: false, value: responseStatus },
                  nodeName: "response1",
                },
                position: { x: 723, y: 226 },
                type: "output",
                sourcePosition: "right",
                targetPosition: "left",
                deletable: false,
              },
            ],
            edges: [
              { id: "edge-1", source: "start-node-1", target: `${processingKind}-node-1`, sourceHandle: null, type: "custom" },
              { id: "edge-2", source: `${processingKind}-node-1`, target: "response-node-1", sourceHandle: "success", type: "custom" },
            ],
            queries: [{ idOnDefinition: processingNodeId, id: processingNodeId }],
            webhookParams: [],
            defaultParams,
            dependencies: { javascript: { dependencies: {} } },
            setupScript: { javascript: "" },
          },
        },
      }).then((updateResponse) => {
        expect(updateResponse.status).to.equal(200);
      });
    });
  }
);

Cypress.Commands.add("apiExecuteWorkflow", (paramValue = "your value", reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const appVersionId = Cypress.env("editingVersionId");
    const environmentId = Cypress.env("environmentId");
    const userId = Cypress.env("user_id");
    if (!appVersionId || !environmentId || !userId) {
      throw new Error("Missing required IDs: appVersionId, environmentId, or userId");
    }
    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/workflow_executions`,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "tj-workspace-id": Cypress.env("workspaceId"),
      },
      body: {
        environmentId,
        appVersionId,
        userId,
        executeUsing: "version",
        params: { dev: paramValue },
        injectedState: {},
      },
    }).then((executionRes) => {
      expect(executionRes.status).to.equal(201);
      const executionId = executionRes.body?.workflowExecution?.id;
      if (!executionId) throw new Error("executionId not returned");
      Cypress.env("executionId", executionId);
    });
  });
});

Cypress.Commands.add("apiValidateLogs", (reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const executionId = Cypress.env("executionId");
    if (!executionId) throw new Error("Missing executionId in env");
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}`,
      headers: {
        ...headers,
        "tj-workspace-id": Cypress.env("workspaceId"),
      },
    }).then((resultRes) => {
      expect(resultRes.status).to.equal(200);
      expect(resultRes.body).to.have.property("status", "success");
      Cypress.env("executionMetadata", resultRes.body);
    });
  });
});

Cypress.Commands.add("apiValidateLogsWithData", (expectedValue, reuseSession = false) => {
  cy.getAuthHeaders(reuseSession).then((headers) => {
    const executionId = Cypress.env("executionId");
    if (!executionId) throw new Error("Missing executionId in env");
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}/nodes?page=1&per_page=20`,
      headers: {
        ...headers,
        "tj-workspace-id": Cypress.env("workspaceId"),
      },
    }).then((nodesRes) => {
      expect(nodesRes.status).to.equal(200);
      const responseString = JSON.stringify(nodesRes.body);
      expect(responseString).to.include(expectedValue);
      Cypress.env("executionNodesResponse", nodesRes.body);
    });
  });
});
// Graph-level API commands.

Cypress.Commands.add(
  "apiSaveWorkflowDefinition",
  (
    definition,
    workflowId = Cypress.env("workflowId"),
    versionId = Cypress.env("editingVersionId")
  ) => {
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/v2/apps/${workflowId}/versions/${versionId}`,
        headers: { ...headers, "Content-Type": "application/json" },
        body: { is_user_switched_version: false, definition },
      })
        .its("status")
        .should("equal", 200);
    });
  }
);

// Runs the editing version synchronously.
Cypress.Commands.add(
  "apiRunWorkflow",
  ({
    params = {},
    environmentId = Cypress.env("environmentId"),
    appVersionId = Cypress.env("editingVersionId"),
  } = {}) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/workflow_executions`,
          headers: {
            ...headers,
            "Content-Type": "application/json",
            "tj-workspace-id": Cypress.env("workspaceId"),
          },
          body: {
            environmentId,
            appVersionId,
            userId: Cypress.env("user_id"),
            executeUsing: "version",
            params,
            injectedState: {},
          },
          failOnStatusCode: false,
        })
        .then((response) => {
          const executionId = response.body?.workflowExecution?.id;
          if (executionId) Cypress.env("executionId", executionId);
          return response;
        })
    );
  }
);

Cypress.Commands.add(
  "apiGetWorkflowExecution",
  (executionId = Cypress.env("executionId")) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}`,
          headers,
        })
        .its("body")
    );
  }
);

// Node results come back `flatted`-encoded.
const parseFlatted = (text) => {
  const table = JSON.parse(text);
  const resolved = new Map();
  const resolve = (index) => {
    const value = table[index];
    if (typeof value !== "object" || value === null) return value;
    if (resolved.has(index)) return resolved.get(index);
    const out = Array.isArray(value) ? [] : {};
    resolved.set(index, out);
    Object.keys(value).forEach((key) => {
      const child = value[key];
      out[key] = typeof child === "string" ? resolve(Number(child)) : child;
    });
    return out;
  };
  return resolve(0);
};

// Resolves with the execution's node rows.
Cypress.Commands.add(
  "apiGetWorkflowExecutionNodes",
  (executionId = Cypress.env("executionId")) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          url: `${Cypress.env("server_host")}/api/workflow_executions/${executionId}/nodes?page=1&per_page=50`,
          headers,
        })
        .then((response) =>
          response.body.data.map((node) => ({
            ...node,
            result: node.result ? parseFlatted(node.result) : node.result,
          }))
        )
    );
  }
);

// The editor's "Enable" toggle: runs and webhooks are refused while off.
Cypress.Commands.add(
  "apiSetWorkflowEnabled",
  (enabled, workflowId = Cypress.env("workflowId")) => {
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/apps/${workflowId}`,
        headers,
        body: { app: { is_maintenance_on: enabled } },
      })
        .its("status")
        .should("equal", 200);
    });
  }
);

// Writes `workflow_enabled` on the editable version.
Cypress.Commands.add(
  "apiSetWorkflowWebhookEnabled",
  (enabled, workflowId = Cypress.env("workflowId")) => {
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "PATCH",
        url: `${Cypress.env("server_host")}/api/v2/webhooks/workflows/${workflowId}`,
        headers,
        body: { isEnable: enabled ? "endPointTrigger" : "disabled" },
      })
        .its("status")
        .should("equal", 200);
    });
  }
);

Cypress.Commands.add(
  "apiGetWorkflowToken",
  (workflowId = Cypress.env("workflowId")) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          url: `${Cypress.env("server_host")}/api/apps/${workflowId}`,
          headers,
        })
        .its("body.workflow_api_token")
    );
  }
);

// Calls the public webhook endpoint without session cookies.
Cypress.Commands.add(
  "apiTriggerWorkflowWebhook",
  ({
    idOrName = Cypress.env("workflowId"),
    token,
    body = {},
    qs = {},
    async = false,
  } = {}) => {
    return cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/v2/webhooks/workflows/${encodeURIComponent(idOrName)}/${async ? "trigger-async" : "trigger"}`,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      qs,
      body,
      failOnStatusCode: false,
    });
  }
);

Cypress.Commands.add(
  "apiGetWorkflowWebhookStatus",
  ({ idOrName = Cypress.env("workflowId"), token, executionId }) => {
    return cy.request({
      url: `${Cypress.env("server_host")}/api/v2/webhooks/workflows/${encodeURIComponent(idOrName)}/status/${executionId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    });
  }
);

// `workflowId` in the schedule body is the APP VERSION id.
Cypress.Commands.add(
  "apiCreateWorkflowSchedule",
  ({
    type = "interval",
    details = { frequency: "hour", minutes: 15 },
    timezone = "Asia/Calcutta",
    appVersionId = Cypress.env("editingVersionId"),
    environmentId = Cypress.env("environmentId"),
  } = {}) => {
    return cy.getAuthHeaders().then((headers) =>
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/workflow-schedules`,
        headers,
        body: {
          workflowId: appVersionId,
          active: false,
          environmentId,
          type,
          timezone,
          details,
        },
        failOnStatusCode: false,
      })
    );
  }
);

Cypress.Commands.add(
  "apiListWorkflowSchedules",
  (workflowId = Cypress.env("workflowId")) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          url: `${Cypress.env("server_host")}/api/workflow-schedules?app_id=${workflowId}`,
          headers,
        })
        .its("body")
    );
  }
);

Cypress.Commands.add("apiActivateWorkflowSchedule", (scheduleId, active) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "PUT",
      url: `${Cypress.env("server_host")}/api/workflow-schedules/activate/${scheduleId}`,
      headers,
      body: { active },
    })
      .its("status")
      .should("be.oneOf", [200, 201]);
  });
});

Cypress.Commands.add("apiDeleteWorkflowSchedule", (scheduleId) => {
  cy.getAuthHeaders().then((headers) => {
    cy.request({
      method: "DELETE",
      url: `${Cypress.env("server_host")}/api/workflow-schedules/${scheduleId}`,
      headers,
    })
      .its("status")
      .should("equal", 204);
  });
});
