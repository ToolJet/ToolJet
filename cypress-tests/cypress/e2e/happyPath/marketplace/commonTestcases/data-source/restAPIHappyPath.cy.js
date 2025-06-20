import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { restAPISelector } from "Selectors/restAPI";
import { restAPIText } from "Texts/restAPI";
import { createAndRunRestAPIQuery } from "Support/utils/restAPI";

const data = {};
const authenticationDropdownSelector =
  ".dynamic-form-element > .css-nwhe5y-container > .react-select__control";
const grantTypeDropdown =
  ":nth-child(1) > :nth-child(2) > .react-select__control";
const addAccessTokenDropdown =
  ":nth-child(9) > .css-nwhe5y-container > .react-select__control";
const clientAuthenticationDropdown =
  ":nth-child(14) > .css-nwhe5y-container > .react-select__control";

describe("Data source Rest API", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    data.dataSourceName = fake.lastName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
  });
  it("Should verify elements on Rest API connection form", () => {
    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();
    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        { key: "url", value: "" },
        { key: "auth_type", value: "none" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        { key: "client_secret", value: "", encrypted: true },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        { key: "bearer_token", value: "", encrypted: true },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
      ]
    );
    cy.reload();
    cy.get(`[data-cy="cypress-${data.dataSourceName}-restapi-button"]`)
      .should("be.visible")
      .click();
    cy.get(restAPISelector.inputField("data-source-name")).should(
      "have.value",
      `cypress-${data.dataSourceName}-restapi`
    );
    cy.get(restAPISelector.subHeaderLabel(restAPIText.credentialsText)).should(
      "have.text",
      restAPIText.credentialsText
    );
    const sections = [
      restAPIText.baseUrlLabel,
      restAPIText.headersLabel,
      restAPIText.urlParametesLabel,
      restAPIText.bodyLabel,
      restAPIText.cookiesLabel,
    ];

    sections.forEach((section) => {
      cy.get(restAPISelector.subHeaderLabel(section)).should(
        "have.text",
        section
      );

      if (section !== restAPIText.baseUrlLabel) {
        cy.get(restAPISelector.keyInputField(section, 0)).should("be.visible");
        cy.get(restAPISelector.valueInputField(section, 0)).should(
          "be.visible"
        );
        cy.get(restAPISelector.deleteButton(section, 0)).should("be.visible");
        cy.get(restAPISelector.addMoreButton(section)).should("be.visible");
      } else {
        cy.get('[data-cy="base-url-text-field"]').should("be.visible");
      }
    });

    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.authenticationText)
    ).should("have.text", restAPIText.authenticationText);
    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.authenticationTypeLabel)
    ).should("have.text", restAPIText.authenticationTypeLabel);

    cy.get(authenticationDropdownSelector).click();
    cy.contains(
      `[id*="react-select-"]`,
      restAPIText.basicAuth.basicText
    ).click();
    cy.get(authenticationDropdownSelector).should(
      "have.text",
      restAPIText.basicAuth.basicText
    );

    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.basicAuth.usernameLabel)
    ).should("have.text", restAPIText.basicAuth.usernameLabel);
    cy.get(
      restAPISelector.inputField(restAPIText.basicAuth.usernameLabel)
    ).should("be.visible");
    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.basicAuth.passwordLabel)
    ).should("have.text", restAPIText.basicAuth.passwordLabel);
    cy.get(restAPISelector.button(restAPIText.editButtonText)).should(
      "be.visible"
    );
    cy.get(
      restAPISelector.inputField(restAPIText.basicAuth.passwordLabel)
    ).should("be.visible");

    cy.get(authenticationDropdownSelector).click();
    cy.contains(`[id*="react-select-"]`, restAPIText.bearerAuth.bearerText)
      .should("be.visible")
      .click();
    cy.get(authenticationDropdownSelector).should(
      "have.text",
      restAPIText.bearerAuth.bearerText
    );
    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.bearerAuth.tokenLabel)
    ).should("have.text", restAPIText.bearerAuth.tokenLabel);
    cy.get(
      restAPISelector.inputField(restAPIText.bearerAuth.tokenLabel)
    ).should("be.visible");

    cy.get(authenticationDropdownSelector).click();
    cy.contains(`[id*="react-select-"]`, restAPIText.oAuthText).click();
    cy.get(authenticationDropdownSelector).should(
      "have.text",
      restAPIText.oAuthText
    );
    cy.get(restAPISelector.subHeaderLabel(restAPIText.grantTypeLabel)).should(
      "have.text",
      restAPIText.grantTypeLabel
    );
    cy.get(grantTypeDropdown).click();
    cy.contains(
      `[id*="react-select-"]`,
      restAPIText.authorizationCode.authorizationCodeLabel
    )
      .should("be.visible")
      .click();
    cy.get(grantTypeDropdown).should(
      "contain",
      restAPIText.authorizationCode.authorizationCodeLabel
    );
    cy.get(
      restAPISelector.inputField(
        restAPIText.authorizationCode.headerPrefixLabel
      )
    ).should(($input) => {
      expect($input.val().trim()).to.equal(restAPIText.bearerAuth.bearerText);
    });
    cy.get(
      restAPISelector.inputField(
        restAPIText.authorizationCode.accessTokenURLLabel
      )
    )
      .invoke("attr", "placeholder")
      .should("eq", "https://api.example.com/oauth/token");
    cy.get(
      restAPISelector.inputField(restAPIText.authorizationCode.clientIDLabel)
    ).should("be.visible");
    cy.get(restAPISelector.button(restAPIText.editButtonText)).should(
      "be.visible"
    );
    cy.get(
      restAPISelector.inputField(
        restAPIText.authorizationCode.clientSecretLabel
      )
    ).should("be.visible");
    Object.entries(restAPIText.authorizationCode).forEach(([key, value]) => {
      if (
        key !== "authorizationCodeLabel" &&
        key !== "requestHeader" &&
        key !== "sendBasicAuthheaderOption" &&
        key !== "sendClientCredentialsBodyOption"
      ) {
        cy.get(
          restAPISelector.subHeaderLabel(restAPIText.authorizationCode[key])
        ).should("have.text", value);
      }
    });
    cy.get(addAccessTokenDropdown)
      .should("be.visible")
      .and("contain", restAPIText.authorizationCode.requestHeader);
    cy.get(
      restAPISelector.inputField(restAPIText.authorizationCode.scopeLabel)
    ).should("be.visible");

    const authorizationCodeSections = [
      restAPIText.authorizationCode.accessTokenURLCustomHeadersLabel,
      restAPIText.authorizationCode.customQueryParametersLabel,
      restAPIText.authorizationCode.customAuthenticationParametersLabel,
    ];
    authorizationCodeSections.forEach((authorizationCodeSections) => {
      cy.get(
        restAPISelector.subHeaderLabel(authorizationCodeSections)
      ).verifyVisibleElement("have.text", authorizationCodeSections);
      if (authorizationCodeSections !== restAPIText.baseUrlLabel) {
        cy.get(
          restAPISelector.keyInputField(authorizationCodeSections, 0)
        ).should("be.visible");
        cy.get(
          restAPISelector.valueInputField(authorizationCodeSections, 0)
        ).should("be.visible");
        cy.get(
          restAPISelector.deleteButton(authorizationCodeSections, 0)
        ).should("be.visible");
        cy.get(restAPISelector.addMoreButton(authorizationCodeSections)).should(
          "be.visible"
        );
      } else {
        cy.get('[data-cy="base-url-text-field"]').should("be.visible");
      }
    });
    cy.get(clientAuthenticationDropdown).click();
    cy.contains(
      `[id*="react-select-"]`,
      restAPIText.authorizationCode.sendClientCredentialsBodyOption
    ).should("be.visible");
    cy.contains(
      `[id*="react-select-"]`,
      restAPIText.authorizationCode.sendBasicAuthheaderOption
    )
      .should("be.visible")
      .click();
    cy.get(clientAuthenticationDropdown).should(
      "have.text",
      restAPIText.authorizationCode.sendBasicAuthheaderOption
    );
    cy.get(
      restAPISelector.subHeaderLabel(
        restAPIText.authorizationCode.authenticationRequiredUsersToggle
      )
    ).verifyVisibleElement(
      "have.text",
      restAPIText.authorizationCode.authenticationRequiredUsersToggle
    );
    cy.get(restAPISelector.authenticationAllUsersToggleSwitch).should(
      "be.visible"
    );
    cy.get(grantTypeDropdown).click();
    cy.contains(
      `[id*="react-select-"]`,
      restAPIText.clientCredentials.clientCredentialsLabel
    )
      .should("be.visible")
      .click();
    cy.get(grantTypeDropdown).should(
      "contain",
      restAPIText.clientCredentials.clientCredentialsLabel
    );
    Object.entries(restAPIText.clientCredentials).forEach(([key, value]) => {
      if (key !== "clientCredentialsLabel") {
        cy.get(
          restAPISelector.subHeaderLabel(restAPIText.clientCredentials[key])
        ).should("have.text", value);
      }
    });

    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.secureSocketsLayerText)
    ).should("have.text", restAPIText.secureSocketsLayerText);
    cy.get(restAPISelector.dropdownLabel("SSL Certificate")).should(
      "have.text",
      "SSL Certificate"
    );
    cy.get(
      restAPISelector.subHeaderLabel(restAPIText.generalSettingsText)
    ).should("have.text", restAPIText.generalSettingsText);
    cy.get(restAPISelector.retryNetworkToggleSwitch).should("be.visible");
    cy.get(restAPISelector.retryNetworkToggleText).should(
      "have.text",
      restAPIText.retryNetworkErrorsToggleLabel
    );
    cy.get(restAPISelector.retryNetworkToggleSubtext).should(
      "have.text",
      restAPIText.retryToggleHelperText
    );
    cy.get(restAPISelector.readDocumentationLinkText).should(
      "have.text",
      postgreSqlText.readDocumentation
    );
    cy.contains("Save").click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Data Source Saved");
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-restapi`);
  });
  it("Should verify connection response for all methods", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        { key: "url", value: Cypress.env("restAPI_BaseURL") },
        { key: "auth_type", value: "none" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        { key: "client_secret", value: "", encrypted: true },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        { key: "bearer_token", value: "", encrypted: true },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
      ]
    );
    cy.reload();

    cy.apiCreateApp(`${fake.companyName}-restAPI-CURD-App`);
    cy.openApp();
    createAndRunRestAPIQuery({
      queryName: "get_beeceptor_data",
      dsName: `cypress-${data.dataSourceName}-restapi`,
      method: "GET",
      urlSuffix: "/api/users",
      run: true,
    });
    createAndRunRestAPIQuery({
      queryName: "post_restapi",
      dsName: `cypress-${data.dataSourceName}-restapi`,
      method: "POST",
      headersList: [["Content-Type", "application/json"]],
      rawBody: '{"price": 200,"name": "Violin"}',
      urlSuffix: "/api/users",
      expectedResponseShape: { price: 200, name: "Violin", id: true },
    });
    cy.readFile("cypress/fixtures/restAPI/storedId.json").then(
      (postResponseID) => {
        const id1 = postResponseID.id;

        createAndRunRestAPIQuery({
          queryName: "put_restapi_id",
          dsName: `cypress-${data.dataSourceName}-restapi`,
          method: "PUT",
          headersList: [["Content-Type", "application/json"]],
          rawBody: '{"price": 500,"name": "Guitar"}',
          urlSuffix: `/api/users/${id1}`,
          expectedResponseShape: { price: 500, name: "Guitar", id: id1 },
        });
        createAndRunRestAPIQuery({
          queryName: "patch_restapi_id",
          dsName: `cypress-${data.dataSourceName}-restapi`,
          method: "PATCH",
          headersList: [["Content-Type", "application/json"]],
          rawBody: '{"price": 999 }',
          urlSuffix: `/api/users/${id1}`,
          run: true,
          expectedResponseShape: { price: 999, id: id1 },
        });
        createAndRunRestAPIQuery({
          queryName: "get_restapi_id",
          dsName: `cypress-${data.dataSourceName}-restapi`,
          method: "GET",
          urlSuffix: `/api/users/${id1}`,
          run: true,
          expectedResponseShape: { price: 999, name: "Guitar", id: id1 },
        });
        createAndRunRestAPIQuery({
          queryName: "delete_restapi_id",
          dsName: `cypress-${data.dataSourceName}-restapi`,
          method: "DELETE",
          urlSuffix: `/api/users/${id1}`,
          run: true,
          expectedResponseShape: { success: true },
        });
      }
    );
    cy.apiDeleteApp(`${fake.companyName}-restAPI-CURD-App`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-restapi`);
  });
  it("Should verify response for basic authentication type connection", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        { key: "url", value: "https://httpbin.org" },
        { key: "auth_type", value: "basic" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        {
          key: "client_secret",
          encrypted: true,
          credential_id: "b044a293-82b4-4381-84fd-d173c86a6a0c",
        },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "user", encrypted: false },
        { key: "password", value: "pass", encrypted: true },
        {
          key: "bearer_token",
          encrypted: true,
          credential_id: "21caf3cb-dbde-43c7-9f42-77feffb63062",
        },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
        { key: "url_parameters", value: [["", ""]], encrypted: false },
        { key: "tokenData", encrypted: false },
      ]
    );
    cy.reload();
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.apiCreateApp(`${fake.companyName}-restAPI-Basic-App`);
    createAndRunRestAPIQuery({
      queryName: "get_basic_auth_valid",
      dsName: `cypress-${data.dataSourceName}-restapi`,
      method: "GET",
      urlSuffix: "/basic-auth/user/pass",
      expectedResponseShape: { authenticated: true, user: "user" },
    });
    createAndRunRestAPIQuery({
      queryName: "get_basic_auth_invalid",
      dsName: `cypress-${data.dataSourceName}-restapi`,
      method: "GET",
      urlSuffix: "/basic-auth/invaliduser/invalidpass",
    });
    cy.apiDeleteApp(`${fake.companyName}-restAPI-Basic-App`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-restapi`);
  });
  it("Should verify response for bearer authentication type connection", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        { key: "url", value: "https://httpbin.org" },
        { key: "auth_type", value: "bearer" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        {
          key: "client_secret",
          encrypted: true,
          credential_id: "b044a293-82b4-4381-84fd-d173c86a6a0c",
        },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        {
          key: "bearer_token",
          value: "my-token-123",
          encrypted: true,
        },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
        { key: "url_parameters", value: [["", ""]], encrypted: false },
        { key: "tokenData", encrypted: false },
      ]
    );
    cy.reload();
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.apiCreateApp(`${fake.companyName}-restAPI-Bearer-App`);
    cy.openApp();
    createAndRunRestAPIQuery({
      queryName: "get_bearer_auth_valid",
      dsName: `cypress-${data.dataSourceName}-restapi`,
      method: "GET",
      urlSuffix: "/bearer",
      expectedResponseShape: { authenticated: true, token: "my-token-123" },
    });
    cy.apiDeleteApp(`${fake.companyName}-restAPI-Bearer-App`);
    cy.intercept("GET", "api/data_sources?**").as("datasource");
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi-invalid`,
      "restapi",
      [
        { key: "url", value: "https://httpbin.org" },
        { key: "auth_type", value: "bearer" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_id", value: "" },
        {
          key: "client_secret",
          encrypted: true,
          credential_id: "b044a293-82b4-4381-84fd-d173c86a6a0c",
        },
        { key: "audience", value: "" },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        {
          key: "bearer_token",
          value: "",
          encrypted: true,
        },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
        { key: "url_parameters", value: [["", ""]], encrypted: false },
        { key: "tokenData", encrypted: false },
      ]
    );
    cy.apiCreateApp(`${fake.companyName}-restAPI-Bearer-invalid`);
    cy.openApp();
    createAndRunRestAPIQuery({
      queryName: "get_bearer_auth_invalid",
      dsName: `cypress-${data.dataSourceName}-restapi-invalid`,
      method: "GET",
      urlSuffix: "/bearer",
    });
    cy.apiDeleteApp(`${fake.companyName}-restAPI-Bearer-invalid`);
    cy.apiDeleteGDS(`cypress-${data.dataSourceName}-restapi`);
  });
  it.skip("Should verify response for authentication code grant type connection", () => {
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      `cypress-${data.dataSourceName}-restapi`,
      "restapi",
      [
        {
          key: "url",
          value: "https://dev-6lj2hoxdz5fg3m57.uk.auth0.com/api/v2/users",
        },
        { key: "auth_type", value: "oauth2" },
        { key: "grant_type", value: "client_credentials" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        {
          key: "access_token_url",
          value: "https://dev-6lj2hoxdz5fg3m57.uk.auth0.com/oauth/token",
        },
        { key: "client_id", value: "JBDuuLU9vaSTP6Do7zYSkw0GvVgWhfyZ" },
        {
          key: "client_secret",
          encrypted: true,
          credential_id: "a6d26607-4d09-42a2-8bc0-e5c185c7c2f7",
        },
        {
          key: "audience",
          value: "https://dev-6lj2hoxdz5fg3m57.uk.auth0.com/api/v2/",
        },
        { key: "scopes", value: "" },
        { key: "username", value: "", encrypted: false },
        {
          key: "password",
          encrypted: true,
          credential_id: "4502a906-b512-447a-a128-39f67e9778d2",
        },
        {
          key: "bearer_token",
          encrypted: true,
          credential_id: "c94262c7-d2c5-4d7f-96f8-657689f2b1f0",
        },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
        { key: "retry_network_errors", value: true, encrypted: false },
      ]
    );
    cy.reload();
    cy.intercept("GET", "/api/library_apps").as("appLibrary");
    cy.apiCreateApp(`${fake.companyName}-client-Grant-RestAPI`);
  });
  it("Should verify response for content-type", () => {
    cy.apiCreateApp(`${fake.companyName}-restAPI-Content-App`);
    createAndRunRestAPIQuery({
      queryName: "post_json",
      dsName: "restapidefault",
      method: "POST",
      url: "https://jsonplaceholder.typicode.com/posts",
      headersList: [["Content-Type", "application/json"]],
      rawBody: '{"title": "foo","body": "bar","userId": 1}',
      run: true,
      urlSuffix: "",
      expectedResponseShape: { id: true, title: "foo", body: "bar", userId: 1 },
    });
    createAndRunRestAPIQuery({
      queryName: "post_raw_text",
      dsName: "restapidefault",
      method: "POST",
      url: "https://httpbin.org/post",
      headersList: [["Content-Type", "text/plain"]],
      rawBody: "This is plain text content",
      jsonBody: null,
      run: true,
      expectedResponseShape: { data: "This is plain text content" },
    });
    createAndRunRestAPIQuery({
      queryName: "post_form_urlencoded",
      dsName: "restapidefault",
      method: "POST",
      url: "https://httpbin.org/post",
      headersList: [["Content-Type", "application/x-www-form-urlencoded"]],
      bodyList: [
        ["name", "Jane"],
        ["age", "30"],
      ],
      expectedResponseShape: {
        "form.name": "Jane",
        "form.age": "30",
      },
    });
    createAndRunRestAPIQuery({
      queryName: "post_xml_soap",
      dsName: "restapidefault",
      method: "POST",
      url: "http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL",
      headersList: [["Content-Type", "text/xml; charset=utf-8"]],
      rawBody: `<?xml version="1.0" encoding="utf-8"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ListOfContinentsByName xmlns="http://www.oorsprong.org/websamples.countryinfo">
        </ListOfContinentsByName>
      </soap:Body>
    </soap:Envelope>`,
      jsonBody: null,
      bodyList: [],
      cookiesList: [["session", "abc123"]],
      paramsList: [["lang", "en"]],
      run: true,
      shouldSucceed: true,
      expectedResponseShape: {},
    });
    // createAndRunRestAPIQuery({
    //   queryName: "post_text_csv",
    //   dsName: "restapidefault",
    //   method: "POST",
    //   url: `https://tejasvi.free.beeceptor.com/csv-upload`,
    //   headersList: [["Content-Type", "text/csv"]],
    //   rawBody:
    //     "id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com",
    //   expectedResponseShape: {
    //     data: '{\n       "status": "ok",\n        "message": "File uploaded successfully",\n        "body": id,name,email\n1,Alice,alice@example.com\n2,Bob,bob@example.com\n}',
    //   },
    // });
    // const filename = "tooljet.png";

    // createAndRunRestAPIQuery({
    //   queryName: "upload_image",
    //   dsName: "restapidefault",
    //   method: "POST",
    //   url: `https://tejasvi.free.beeceptor.commultipart-upload`,
    //   headersList: [["Content-Type", "multipart/form-data"]],
    //   bodyList: [
    //     ["Image_File", "fixture:Image/tooljet.png"],
    //     ["filename", filename],
    //   ],
    //   expectedResponseShape: {
    //     filename: filename,
    //   },
    // });
  });
});
