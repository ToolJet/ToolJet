export const commonEeText = {
    cancelButton: "Cancel",
    saveButton: "Save changes",
    closeButton: "Close",
    defaultWorkspace: "My workspace",
};

export const ssoEeText = {
    statusLabel: "Disabled",
    enabledLabel: "Enabled",
    disabledLabel: "Disabled",
    oidcPageElements: {
        oidcToggleLabel: "OpenID Connect",
        nameLabel: "Name",
        clientIdLabel: "Client ID",
        clientSecretLabel: "Client secretEncrypted",
        encryptedLabel: "Encrypted",
        WellKnownUrlLabel: "Well known URL",
        // redirectUrlLabel: "Redirect URL",
    },
    oidcEnabledToast: "Enabled OpenId SSO",
    oidcDisabledToast: "Disabled OpenId SSO",
    oidcUpdatedToast: "updated SSO configurations",
    testName: "Tooljet OIDC",
    testclientId: "24567098-mklj8t20za1smb2if.apps.googleusercontent.com",
    testclientSecret: "2345-client-id-.apps.googleusercontent.com",
    testWellknownUrl: "google.com",
    oidcSSOText: "Sign in with Tooljet OIDC",

    ldapPageElements: {
        ldapToggleLabel: "LDAP",
        nameLabel: "Name",
        hostLabel: "Host name",
        portLabel: "Port",
        baseDnLabel: "Base DN",
        baseDnHelperText: "Location without UID or CN",
        sslLabel: "SSL",
    },
    ldapSSOText: "Sign in with Tooljet LDAP Auth",
    userNameInputLabel: "Username",
    samlModalElements: {
        toggleLabel: "SAML",
        NameLabel: "Name",
        metaDataLabel: "Identity provider metadata",
        baseDNHelperText:
            "Ensure the Identity provider metadata is in XML format. You can download it from your IdP's site",
        groupAttributeLabel: "Group attribute",
        groupAttributeHelperText:
            "Define attribute for user-to-group mapping based on the IdP",
    },
};
export const eeGroupsText = {
    resourceDs: "Datasources",
    AddDsButton: "Add",
    dsNameHeader: "Datasource name",
};

export const instanceSettingsText = {
    pageTitle: "Settings",
    allUsersTab: "All users",
    manageInstanceSettings: "Manage instance settings",
    typeColumnHeader: "Type",
    workspaceColumnHeader: "Workspaces",
    superAdminType: "instance",
    viewModalTitle: "Workspaces of The Developer",
    archiveAllButton: "Archive All",
    archiveState: "Archive",
    editModalTitle: "Edit user details",
    superAdminToggleLabel: "Super admin",
    allowWorkspaceToggleLabel: "Allow personal workspace",
    allowWorkspaceHelperText:
        "This feature will enable users to create their own workspace",
    saveButton: "Save",
    untitledWorkspace: "Untitled workspace",
};
