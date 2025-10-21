const envVar = Cypress.env("environment");

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
  "openWorkflowByName",
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

        if (workflow) {
          Cypress.env("workflowId", workflow.id);
          cy.openWorkflow(workflow.slug, workspaceId, workflow.id, componentSelector);

          Cypress.log({
            name: "Workflow Open",
            displayName: "WORKFLOW OPENED",
            message: `: ${workflowName}`,
          });
        } else {
          throw new Error(`Workflow "${workflowName}" not found`);
        }
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

      if (workflow) {
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
      } else {
        Cypress.log({
          name: "Workflow Not Found",
          displayName: "WORKFLOW NOT FOUND",
          message: `: ${workflowName}`,
        });
      }
    });
  });
});

Cypress.Commands.add("apiCreateWorkflowWithNodes", (workflowName, reuseSession = false) => {
    cy.getAuthHeaders(reuseSession).then((headers) => {
      
      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/workflows`,
        headers: headers,
        body: {
          icon: "menuhome",
          name: workflowName,
          type: "workflow",
        },
      }).then((createResponse) => {
        expect(createResponse.status).to.equal(201);
  
        const workflowId = createResponse.body.id;
        const userId = createResponse.body.user_id;
  
        Cypress.env("workflowId", workflowId);
        Cypress.env("user_id", userId);
  
        Cypress.log({
          name: "Workflow create",
          displayName: "WORKFLOW CREATED",
          message: `: ${workflowName}`,
        });

        cy.request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/apps/${workflowId}`,
          headers: headers,
        }).then((appResponse) => {
          expect(appResponse.status).to.equal(200);
          
          const versionId = appResponse.body.editing_version?.id;
          const environmentId = appResponse.body.editorEnvironment?.id;
  
          Cypress.env("editingVersionId", versionId);
          Cypress.env("environmentId", environmentId);
  
          cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${environmentId}/versions/${versionId}`,
            headers: headers,
          }).then((dsResponse) => {
            expect(dsResponse.status).to.equal(200);
            
            const runjsDataSource = dsResponse.body.data_sources?.find(
              ds => ds.kind === "runjs" || ds.name === "Run JavaScript Code"
            );
  
            if (!runjsDataSource) {
              throw new Error("RunJS data source not found");
            }
  
            const runjsDataSourceId = runjsDataSource.id;
  
            cy.request({
              method: "POST",
              url: `${Cypress.env("server_host")}/api/data-queries/workflow-node`,
              headers: headers,
              body: {
                app_id: workflowId,
                app_version_id: versionId,
                name: "runjs1",
                kind: "runjs",
                options: {
                  code: "return startTrigger.params",
                  parameters: [],
                },
                data_source_id: runjsDataSourceId,
                plugin_id: null,
              },
            }).then((runjsResponse) => {
              expect(runjsResponse.status).to.equal(201);
              
              const runjsQueryId = runjsResponse.body.id;
  
              cy.request({
                method: "PUT",
                url: `${Cypress.env("server_host")}/api/v2/apps/${workflowId}/versions/${versionId}`,
                headers: {
                  ...headers,
                  "Content-Type": "application/json",
                },
                body: {
                  is_user_switched_version: false,
                  definition: {
                    nodes: [
                      {
                        id: "start-node-1",
                        data: {
                          nodeType: "start",
                          label: "Start trigger",
                        },
                        position: { x: 100, y: 250 },
                        type: "input",
                        sourcePosition: "right",
                        deletable: false,
                        width: 206,
                        height: 42,
                      },
                      {
                        id: "runjs-node-1",
                        type: "query",
                        sourcePosition: "right",
                        targetPosition: "left",
                        draggable: true,
                        data: {
                          idOnDefinition: runjsQueryId,
                          kind: "runjs",
                          options: {
                            code: "return startTrigger.params",
                            parameters: [],
                          },
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
                          code: "return runjs1.data",
                          statusCode: { fxActive: false, value: "200" },
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
                      {
                        id: "edge-1",
                        source: "start-node-1",
                        target: "runjs-node-1",
                        sourceHandle: null,
                        type: "custom",
                      },
                      {
                        id: "edge-2",
                        source: "runjs-node-1",
                        target: "response-node-1",
                        sourceHandle: "success",
                        type: "custom",
                      },
                    ],
                    queries: [
                      {
                        idOnDefinition: runjsQueryId,
                        id: runjsQueryId,
                      },
                    ],
                    webhookParams: [],
                    defaultParams: '{"dev":"your value"}', 
                    dependencies: {
                      javascript: {
                        dependencies: {},
                      },
                    },
                    setupScript: {
                      javascript: "// lodash\n// const _ = require('lodash');\n",
                    },
                  },
                },
              }).then((updateResponse) => {
                expect(updateResponse.status).to.equal(200);
                
                Cypress.log({
                  name: "Workflow update",
                  displayName: "WORKFLOW NODES ADDED",
                  message: `: ${workflowName}`,
                });
              });
            });
          });
        });
      });
    });
  });

  Cypress.Commands.add("apiExecuteWorkflowAndValidate", (paramValue = "your value", reuseSession = false) => {
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
          environmentId: environmentId,
          appVersionId: appVersionId,
          userId: userId,
          executeUsing: "version",
          params: { dev: paramValue },
          injectedState: {},
        },
      }).then((executionRes) => {
        expect(executionRes.status).to.equal(201);
        expect(executionRes.body).to.have.property("workflowExecution");
        expect(executionRes.body.workflowExecution).to.have.property("id");
        
        const executionId = executionRes.body.workflowExecution.id;
  
        expect(executionId).to.not.be.undefined;
        expect(executionId).to.not.be.null;
        
        Cypress.env("executionId", executionId);
        cy.wait(2000);

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
          expect(responseString).to.include(paramValue);
          Cypress.env("executionNodesResponse", nodesRes.body);
        });
      });
    });
  });