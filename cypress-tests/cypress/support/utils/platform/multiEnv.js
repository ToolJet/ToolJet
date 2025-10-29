import { multiEnvSelector, commonEeSelectors } from "Selectors/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { appVersionText } from "Texts/exportImport";
import { multiEnvText } from "Texts/eeCommon";

const environments = {
    development: "development",
    staging: "staging",
    production: "production",
};

const widgetPositions = {
    queryData: {
        desktop: { top: 100, left: 20 },
        mobile: { width: 8, height: 50 },
    },
    constantData: {
        desktop: { top: 70, left: 25 },
        mobile: { width: 8, height: 50 },
    },
    textInput: {
        x: 550,
        y: 650,
    },
};

export const promoteApp = () => {
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);
};

export const releaseApp = () => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);
};

export const launchApp = () => {
    cy.url().then((url) => {
        const parts = url.split("/");
        const value = parts[parts.length - 1];
        cy.log(`Extracted value: ${value}`);
        cy.visit(`/applications/${value}`);
        cy.wait(3000);
    });
};

export const appPromote = (fromEnv, toEnv) => {
    const commonActions = () => {
        cy.get(commonEeSelectors.promoteButton).click();
        cy.get(commonEeSelectors.promoteButton).eq(1).click();
        cy.waitForAppLoad();
        cy.wait(2000);
    };

    const transitions = {
        development: {
            staging: commonActions,
            production: () => {
                commonActions();
                appPromote("staging", "production");
            },
            release: () => {
                commonActions();
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
        staging: {
            production: commonActions,
            release: () => {
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
    };

    const transition = transitions[fromEnv]?.[toEnv];

    transition();
};

export const createNewVersion = (value, newVersion = [], version) => {
    cy.get('[data-cy="list-current-env-name"]').click();
    cy.get(multiEnvSelector.envNameList).eq(0).click();
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.get(appVersionSelectors.createVersionInputField).click();
    cy.contains(`[id*="react-select-"]`, version).click();
    cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.waitForAppLoad();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        appVersionText.createdToastMessage
    );
    cy.get(appVersionSelectors.currentVersionField(newVersion[0])).should(
        "be.visible"
    );
};

export const selectVersion = (value, newVersion = []) => {
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(".react-select__menu-list .app-version-name")
        .contains(newVersion[0])
        .click();
    cy.waitForAppLoad();
};

export const selectEnv = (envName) => {
    const envIndex = {
        development: 0,
        staging: 1,
        production: 2,
    }[envName];

    const isValidEnvName = (envName) => {
        return (
            envName === "development" ||
            envName === "staging" ||
            envName === "production"
        );
    };

    if (isValidEnvName(envName)) {
        cy.wait(1000)
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.wait(500)
        const envSelector = `${multiEnvSelector.envNameList}:eq(${envIndex})`;
        cy.get(envSelector).click();
        cy.waitForAppLoad();
    }
};

export const setupGlobalConstant = (globalConstantName, envValues) => {
    cy.apiCreateWorkspaceConstant(
        globalConstantName,
        envValues.development,
        ["Global"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, envValues.staging, environments.staging);
        cy.apiUpdateWsConstant(constantId, envValues.production, environments.production);
    });
};

export const setupSecretConstant = (secretConstantName, hostValue) => {
    cy.apiCreateWorkspaceConstant(
        secretConstantName,
        hostValue,
        ["Secret"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, hostValue, environments.staging);
        cy.apiUpdateWsConstant(constantId, hostValue, environments.production);
    });
};

export const setupDatabaseConstant = (dbNameConstant, values) => {
    cy.apiCreateWorkspaceConstant(
        dbNameConstant,
        values.development,
        ["Global"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, values.staging, environments.staging);
        cy.apiUpdateWsConstant(constantId, values.production, environments.production);
    });
};

export const setupPostgreSQLDataSource = (dsName, secretConstantName, dbNameConstant) => {
    cy.apiCreateGDS(
        `${Cypress.env("server_host")}/api/data-sources`,
        dsName,
        "postgresql",
        [
            { key: "connection_type", value: "manual", encrypted: false },
            { key: "host", value: `{{secrets.${secretConstantName}}}`, encrypted: false },
            { key: "port", value: 5432, encrypted: false },
            { key: "ssl_enabled", value: false, encrypted: false },
            { key: "database", value: `{{constants.${dbNameConstant}}}`, encrypted: false },
            { key: "ssl_certificate", value: "none", encrypted: false },
            { key: "username", value: Cypress.env("pg_user"), encrypted: false },
            { key: "password", value: Cypress.env("pg_password"), encrypted: false },
            { key: "ca_cert", value: null, encrypted: true },
            { key: "client_key", value: null, encrypted: true },
            { key: "client_cert", value: null, encrypted: true },
            { key: "root_cert", value: null, encrypted: true },
            { key: "connection_string", value: null, encrypted: true },
        ]
    );
};

export const createAppWithComponents = (appName, dsName, dbNameConstant, globalConstantName) => {
    return cy.apiCreateApp(appName).then(() => {
        cy.apiAddQueryToApp({
            queryName: "psql",
            options: {
                mode: "sql",
                transformationLanguage: "javascript",
                enableTransformation: false,
                query: `SELECT * FROM {{constants.${dbNameConstant}}} WHERE constant = '{{constants.${globalConstantName}}}';`,
                runOnPageLoad: true,
            },
            dataSourceName: dsName,
            dsKind: "postgresql",
        });
        cy.apiAddComponentToApp(
            appName,
            "constant_data",
            widgetPositions.constantData,
            "Text",
            `{{constants.${dbNameConstant}}}`
        );

        cy.apiAddComponentToApp(
            appName,
            "query_data",
            widgetPositions.queryData,
            "Text",
            `{{JSON.stringify(queries.psql.data)}}`
        );
    });
};

export const verifyEnvironmentData = (expectedDbValue, expectedQueryValue) => {
    cy.get(commonWidgetSelector.draggableWidget('constant_data'))
        .should("be.visible")
        .should('contain.text', expectedDbValue);;
    cy.get(commonWidgetSelector.draggableWidget('query_data'))
        .should('contain.text', expectedQueryValue);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");
};

export const selectEnvironment = (envName) => {
    cy.get(multiEnvSelector.previewSettings).click();
    cy.get(multiEnvSelector.envContainer).click();
    cy.get(multiEnvSelector.envNameList).contains(envName).click();
};

export const releaseAppFromProdAndVisitTheApp = (appSlug) => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");

    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.makePublicAppToggle).check();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, appSlug);

    cy.get(commonSelectors.appSlugAccept)
        .should("be.visible")
        .and("have.text", "Slug accepted!");
    cy.apiLogout();

    cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
    });
};

export const verifyQueryEditorDisabled = () => {
    cy.get(multiEnvSelector.queryDetailsContainer)
        .should('have.class', 'disabled');
};

export const verifyGlobalSettingsDisabled = () => {
    cy.contains(multiEnvText.releasedAppText).should('be.visible');
    cy.get(multiEnvSelector.settingsSidebarIcon).click({ force: true });
    cy.get(multiEnvSelector.maintenanceToggle).should(($el) => {
        const style = window.getComputedStyle($el[0]);
        expect(style.pointerEvents).to.equal('none');
    });

    cy.get(multiEnvSelector.maxCanvasWidthInput).should(($el) => {
        const style = window.getComputedStyle($el[0]);
        const visuallyDisabled =
            style.pointerEvents === 'none' ||
            style.opacity < 1 ||
            $el.parents('.global-settings-width-input-container').css('pointer-events') === 'none';
        expect(visuallyDisabled, 'Max width input should appear disabled').to.be.true;
    });

    cy.get(multiEnvSelector.maxCanvasWidthTypeDropdown).should(($el) => {
        const style = window.getComputedStyle($el[0]);
        const visuallyDisabled = style.pointerEvents === 'none';
        expect(visuallyDisabled, 'Dropdown should appear disabled').to.be.true;
    });
    cy.get(multiEnvSelector.canvasBgFxButton)
        .parentsUntil('[data-cy="global-settings-panel"]')
        .should(($parents) => {
            const anyDisabled = [...$parents].some(
                (p) =>
                    p.classList.contains('disabled') ||
                    window.getComputedStyle(p).pointerEvents === 'none'
            );
            expect(anyDisabled, 'FX button container should be disabled').to.be.true;
        });
    cy.get(multiEnvSelector.appSlugInput).should('not.be.disabled');
};

export const verifyInspectorMenuNoDelete = () => {
    cy.get(multiEnvSelector.inspectorButtonAria).click();
    cy.wait(500);
    cy.get(multiEnvSelector.inspectorComponentsNode).should('be.visible').click();
    cy.wait(300);
    cy.get(multiEnvSelector.inspectorComponentsNode).eq(2).should('be.visible').click();
    cy.wait(300);
    cy.get(multiEnvSelector.inspectorMenuIcon).click({ force: true });
    cy.get(multiEnvSelector.popoverBody).should('be.visible');
    cy.get(multiEnvSelector.anyDeleteInPopover).should('not.exist');
    cy.get(multiEnvSelector.popoverBody).should('not.contain.text', 'Delete');
    cy.forceClickOnCanvas();
};

export const verifyComponentsManagerDisabled = () => {
    cy.get(multiEnvSelector.widgetSearchInput)
        .should(($input) => {
            const isDisabled = $input.is(':disabled');
            const hasPointerNone = $input.css('pointer-events') === 'none';
            const isReadOnly = $input.prop('readonly') === true;
            expect(
                isDisabled || hasPointerNone || isReadOnly,
                'Search input should be disabled or non-interactive'
            ).to.be.true;
        });

    cy.get(multiEnvSelector.draggableBox).first().should(($el) => {
        const draggableAttr = $el.attr('draggable');
        const pointerEvents = $el.css('pointer-events');
        const hasOverlay = $el.closest('[style*="pointer-events: none"]').length > 0;
        expect(
            draggableAttr === 'false' || pointerEvents === 'none' || hasOverlay,
            'Widget should not be draggable or interactive'
        ).to.be.true;
    });
    cy.get(multiEnvSelector.componentsPlusButton).click();
};

export const verifyPageSettingsDisabled = () => {
    cy.get(multiEnvSelector.pagesTabButton).click();
    cy.wait(500);
    cy.contains(multiEnvText.releasedAppText).should('be.visible');

    cy.get(multiEnvSelector.addNewPageButton).should(($btn) => {
        const isDisabledAttr = $btn.is(':disabled');
        const pointerNone = $btn.css('pointer-events') === 'none';
        const opacityLow = parseFloat($btn.css('opacity')) < 0.6;
        expect(
            isDisabledAttr || pointerNone || opacityLow,
            'Add New Page button should be non-interactive or visually disabled'
        ).to.be.true;
    });

    cy.get(multiEnvSelector.pageToggleInput).each(($toggle) => {
        const isDisabled = $toggle.is(':disabled');
        const pointerNone = $toggle.css('pointer-events') === 'none';
        const hasOverlay = $toggle.closest('[style*="pointer-events: none"]').length > 0;
        expect(
            isDisabled || pointerNone || hasOverlay,
            'Toggles should be disabled or have overlay blocking interaction'
        ).to.be.true;
    });

    cy.get(multiEnvSelector.pageTextInput).should(($input) => {
        const isDisabled = $input.is(':disabled');
        const isReadOnly = $input.prop('readonly') === true;
        const pointerNone = $input.css('pointer-events') === 'none';
        const hasOverlay = $input.parents().toArray().some(
            (el) => el.style.pointerEvents === 'none' || el.className.includes('disabled') || el.className.includes('overlay')
        );
        expect(
            isDisabled || isReadOnly || pointerNone || hasOverlay,
            'Title input should be visually or structurally disabled'
        ).to.be.true;
    });
    cy.forceClickOnCanvas();
};

export const verifyComponentInspectorDisabled = () => {
    cy.get(commonWidgetSelector.draggableWidget('button1')).click();
    cy.wait(500);
    cy.contains(multiEnvText.releasedAppText, { timeout: 5000 }).should('be.visible');

    cy.get('input.form-check-input').each(($toggle) => {
        const isDisabled = $toggle.is(':disabled');
        const pointerNone = $toggle.css('pointer-events') === 'none';
        const hasParentDisabled = $toggle.parents().toArray().some(
            (el) =>
                el.style.pointerEvents === 'none' ||
                el.className.includes('disabled') ||
                el.className.includes('overlay')
        );
        expect(isDisabled || pointerNone || hasParentDisabled, 'Toggle should be disabled').to.be.true;
    });

    cy.get(multiEnvSelector.fxButtonAny).each(($fxBtn) => {
        const pointerNone = $fxBtn.css('pointer-events') === 'none';
        const hasDisabledClass = $fxBtn.attr('class')?.includes('disabled');
        const hasParentDisabled = $fxBtn.parents().toArray().some(
            (el) =>
                el.style.pointerEvents === 'none' ||
                el.className.includes('disabled') ||
                el.className.includes('overlay')
        );
        expect(pointerNone || hasDisabledClass || hasParentDisabled, 'fx button should be disabled').to
            .be.true;
    });

    cy.get(multiEnvSelector.codeInputFieldAny).each(($field) => {
        const $container = $field.closest('.codehinter-container, .code-editor-basic-wrapper');
        const $editor = $field.find(multiEnvSelector.codeEditorContent);

        const isDisabled = $field.is(':disabled');
        const isReadOnly = $field.prop('readonly');
        const pointerNone =
            $field.css('pointer-events') === 'none' ||
            $container.css('pointer-events') === 'none';
        const isNotEditable = $editor.attr('contenteditable') === 'false';
        const hasOverlay = $field.parents().toArray().some(
            (el) =>
                el.style.pointerEvents === 'none' ||
                el.className.includes('disabled') ||
                el.className.includes('overlay')
        );
        expect(
            isDisabled || isReadOnly || pointerNone || isNotEditable || hasOverlay,
            'Code editor input should be visually or structurally disabled'
        ).to.be.true;
    });

    cy.get(multiEnvSelector.addEventHandlerButton).should(($btn) => {
        const isDisabledAttr = $btn.is(':disabled');
        const pointerNone = $btn.css('pointer-events') === 'none';
        const opacityLow = parseFloat($btn.css('opacity')) < 0.6;
        const hasDisabledClass = $btn.attr('class')?.includes('disabled');

        expect(
            isDisabledAttr || pointerNone || opacityLow || hasDisabledClass,
            'Add event handler button should be disabled'
        ).to.be.true;
    });

    cy.get(multiEnvSelector.popupButton).each(($popupBtn) => {
        const pointerNone = $popupBtn.css('pointer-events') === 'none';
        const hasParentDisabled = $popupBtn.parents().toArray().some(
            (el) =>
                el.style.pointerEvents === 'none' ||
                el.className.includes('disabled') ||
                el.className.includes('overlay')
        );
        expect(pointerNone || hasParentDisabled, 'Popup button should be disabled').to.be.true;
    });

    cy.get(multiEnvSelector.fieldWrapperAny).each(($wrapper) => {
        const pointerNone = $wrapper.css('pointer-events') === 'none';
        const hasDisabledClass = $wrapper.attr('class')?.includes('disabled');
        const hasParentDisabled = $wrapper.parents().toArray().some(
            (el) =>
                el.style.pointerEvents === 'none' ||
                el.className.includes('disabled') ||
                el.className.includes('overlay')
        );
        expect(pointerNone || hasDisabledClass || hasParentDisabled, 'Field wrapper should be disabled')
            .to.be.true;
    });

    cy.forceClickOnCanvas();
};

