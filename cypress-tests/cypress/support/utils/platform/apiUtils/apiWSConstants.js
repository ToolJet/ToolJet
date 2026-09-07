// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// apiWSConstants.js
//   getAllConstants                  workspaceConstant.listApi → workspace
//   getAllConstantsWithCount         workspaceConstant.listWithCountApi → workspace
//   findConstantByName               workspaceConstant.findApi → workspace
//   deleteConstantFromEnvironment    workspaceConstant.deleteApi → workspace
//   deleteConstantFromEnvironmentByName workspaceConstant.deleteByNameApi → workspace
//   deleteConstantFromAllEnvironmentsByName workspaceConstant.deleteAllEnvsApi → workspace
//   deleteAllUIConstants             workspaceConstant.deleteAllApi → workspace
// └──────────────────────────────────────────────────────────────────┘
/**
 * @tjType   workspaceConstant.listApi
 * @tjBlock  workspace
 * @tjUsage  getAllConstants()
 * @tjDom    none - GET organization-constants
 */
export const getAllConstants = () => {
    return cy.getAuthHeaders().then((headers) => {
        return cy.request({
            method: "GET",
            url: `${Cypress.env("server_host")}/api/organization-constants/decrypted`,
            headers: headers,
        }).then((response) => {
            expect(response.status).to.equal(200);
            return response.body.constants;
        });
    });
};

/**
 * @tjType   workspaceConstant.listWithCountApi
 * @tjBlock  workspace
 * @tjUsage  getAllConstantsWithCount()
 * @tjDom    none - GET with total count
 */
export const getAllConstantsWithCount = () => {
    return getAllConstants().then((constants) => {
        return {
            constants,
            count: constants.length,
        };
    });
};


/**
 * @tjType   workspaceConstant.findApi
 * @tjBlock  workspace
 * @tjUsage  findConstantByName('API_KEY')
 * @tjDom    none - list then filter by name
 */
export const findConstantByName = (constantName) => {
    return getAllConstants().then((constants) => {
        const constant = constants.find(c => c.name === constantName);
        if (!constant) {
            throw new Error(`Constant with name "${constantName}" not found`);
        }
        return constant;
    });
};

/**
 * @tjType   workspaceConstant.deleteApi
 * @tjBlock  workspace
 * @tjUsage  deleteConstantFromEnvironment(id, envId, name, type, envName)
 * @tjDom    none - DELETE one constant in one environment
 */
export const deleteConstantFromEnvironment = (constantId, environmentId, constantName, constantType, environmentName, failOnStatusCode = true) => {
    return cy.getAuthHeaders(true).then((headers) => {
        return cy.request({
            method: "DELETE",
            url: `${Cypress.env("server_host")}/api/organization-constants/${constantId}?environmentId=${environmentId}`,
            headers: headers,
            failOnStatusCode: failOnStatusCode,
        }).then((deleteResponse) => {
            expect(deleteResponse.status).to.equal(200);

            return deleteResponse;
        });

    });
};

/**
 * @tjType   workspaceConstant.deleteByNameApi
 * @tjBlock  workspace
 * @tjUsage  deleteConstantFromEnvironmentByName('API_KEY', 'production')
 * @tjDom    none - resolves the id then deletes
 */
export const deleteConstantFromEnvironmentByName = (constantName, environmentName) => {
    return findConstantByName(constantName).then((constant) => {
        if (constant.fromEnv) {
            cy.log(`Skipping env constant "${constant.name}" (fromEnv: true)`);
            return;
        }
        const envValue = constant.values.find((val) => val.environmentName === environmentName);
        if (!envValue) {
            throw new Error(`Environment with name ${environmentName} not found for constant "${constantName}"`);
        }
        return deleteConstantFromEnvironment(
            constant.id,
            envValue.id,
            constant.name,
            constant.type,
            environmentName
        );
    });
};

/**
 * @tjType   workspaceConstant.deleteAllEnvsApi
 * @tjBlock  workspace
 * @tjUsage  deleteConstantFromAllEnvironmentsByName('API_KEY')
 * @tjDom    none - deletes across every environment
 */
export const deleteConstantFromAllEnvironmentsByName = (constantName) => {
    return findConstantByName(constantName).then((constant) => {
        if (constant.fromEnv) {
            cy.log(`Skipping env constant "${constant.name}" (fromEnv: true)`);
            return cy.wrap(null);
        }
        if (!constant.values || constant.values.length === 0) {
            return cy.wrap(null);
        }
        return cy.wrap(constant.values).each((envValue) => {
            return deleteConstantFromEnvironment(
                constant.id,
                envValue.id,
                constant.name,
                constant.type,
                envValue.environmentName,
                false
            );
        });
    });
};


/**
 * @tjType   workspaceConstant.deleteAllApi
 * @tjBlock  workspace
 * @tjUsage  deleteAllUIConstants()
 * @tjDom    none - teardown helper
 */
export const deleteAllUIConstants = () => {
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `TRUNCATE TABLE org_environment_constant_values, organization_constants CASCADE;`,
    })
};