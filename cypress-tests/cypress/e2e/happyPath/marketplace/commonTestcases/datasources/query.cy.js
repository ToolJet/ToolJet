import { verifyConnectionFormUI } from "Support/utils/marketplace/dataSource/dataSourceFormUIHelpers";
import { postgresQueryConfig } from "Constants/constants/queryPanel/postgres";
import { restapiQueryConfig } from "Constants/constants/queryPanel/restapi";

describe('Query', () => {
    beforeEach(() => {
        cy.apiLogin();
    })

    it('should verify PostgreSQL query editor', () => {
        cy.visit('http://localhost:8082/mys-workspace/apps/957bb37c-d21f-4067-88f1-63e02cba133e');
        cy.get('[data-cy="list-query-postgresql1"]').click();
        verifyConnectionFormUI(postgresQueryConfig.defaultFields);
    })

    it.only('should verify REST API query editor', () => {
        cy.visit('http://localhost:8082/mys-workspace/apps/957bb37c-d21f-4067-88f1-63e02cba133e');
        cy.get('[data-cy="list-query-restapi1"]').click();
        verifyConnectionFormUI(restapiQueryConfig.defaultFields);
    })
})