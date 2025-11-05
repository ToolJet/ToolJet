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


export const findConstantByName = (constantName) => {
    return getAllConstants().then((constants) => {
        const constant = constants.find(c => c.name === constantName);
        if (!constant) {
            throw new Error(`Constant with name "${constantName}" not found`);
        }
        return constant;
    });
};

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


export const deleteAllUIConstants = () => {
    cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `TRUNCATE TABLE org_environment_constant_values, organization_constants CASCADE;`,
    })
};