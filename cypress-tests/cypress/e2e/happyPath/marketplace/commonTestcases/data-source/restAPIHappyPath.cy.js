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
    deleteDatasource(`cypress-${data.dataSourceName}-restapi`);
  });
  it("Should verify basic connection for Rest API", () => {
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

    cy.apiCreateApp(`${fake.companyName}-restAPI-App`);
    cy.openApp();
    createAndRunRestAPIQuery(
      "get_restapi",
      `cypress-${data.dataSourceName}-restapi`,
      "GET",
      "/api/users"
    );
    createAndRunRestAPIQuery(
      "post_restapi",
      `cypress-${data.dataSourceName}-restapi`,
      "POST",
      "",
      [["Content-Type", "application/json"]],
      [],
      {
        price: 200,
        name: "Violin",
      },
      true,
      "/api/users"
    );
    cy.readFile("cypress/fixtures/restAPI/storedId.json").then(
      (postResponseID) => {
        const id1 = postResponseID.id;
        createAndRunRestAPIQuery(
          "put_restapi_id",
          `cypress-${data.dataSourceName}-restapi`,
          "PUT",
          "",
          [["Content-Type", "application/json"]],
          [],
          {
            price: 500,
            name: "Guitar",
          },
          true,
          `/api/users/${id1}`
        );
      }
    );
    cy.readFile("cypress/fixtures/restAPI/storedId.json").then(
      (putResponseID) => {
        const id2 = putResponseID.id;
        createAndRunRestAPIQuery(
          "patch_restapi_id",
          `cypress-${data.dataSourceName}-restapi`,
          "PATCH",
          "",
          [["Content-Type", "application/json"]],
          [],
          { price: 999 },
          true,
          `/api/users/${id2}`
        );
      }
    );
    cy.readFile("cypress/fixtures/restAPI/storedId.json").then(
      (patchResponseID) => {
        const id3 = patchResponseID.id;
        createAndRunRestAPIQuery(
          "get_restapi_id",
          `cypress-${data.dataSourceName}-restapi`,
          "GET",
          "",
          [],
          [],
          true,
          `/api/users/${id3}`
        );

        createAndRunRestAPIQuery(
          "delete_restapi_id",
          `cypress-${data.dataSourceName}-restapi`,
          "DELETE",
          "",
          [],
          [],
          true,
          `/api/users/${id3}`
        );
      }
    );
  });
});
