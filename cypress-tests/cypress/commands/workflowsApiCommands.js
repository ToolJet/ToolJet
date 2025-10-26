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

