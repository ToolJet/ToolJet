import { fake } from "Fixtures/fake";
import {
    createUser, getAllUsers, getUser, updateUser, createGroup, validateUserInGroup, updateUserRole,
    getAllWorkspaces, replaceUserWorkspace, replaceUserWorkspacesRelations
} from 'Support/utils/api';
import { groupsSelector } from "Selectors/manageGroups";
import { commonSelectors } from 'Selectors/common';
import { searchUser, navigateToManageUsers, logout, navigateToManageGroups } from 'Support/utils/common';
describe("API Test", () => {

    const sanitize = (str) => str.toLowerCase().replace(/[^A-Za-z]/g, "");
    let userId;
    let workspaceId;
    const data = {
        firstName: fake.firstName,
        lastName: fake.lastName,
        firstName1: fake.firstName,
        lastName1: fake.lastName,
        firstName2: fake.firstName,
        lastName2: fake.lastName,
        email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        email1: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        email2: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        workspaceName: sanitize(fake.lastName),
        workspaceSlug: sanitize(fake.lastName),
        workspaceName1: sanitize(fake.firstName),
        workspaceSlug1: sanitize(fake.firstName),
        group1: sanitize(fake.firstName),
        group2: sanitize(fake.firstName),
        group3: sanitize(fake.firstName),
        group4: sanitize(fake.firstName),
        group5: sanitize(fake.firstName),
        appName: fake.companyName
    };

    //user with all valid details
    const userData = {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: "password",
        status: "active",
        workspaces: [
            {
                name: "My workspace",
                status: "active",
                groups: [
                    { name: data.group1 },
                    { name: data.group2 }
                ]
            },
            {
                name: data.workspaceName,
                status: "active",
                role: "builder",
                groups: [{ name: data.group3 }]
            },
            {
                name: data.workspaceName1,
                status: "archived",
                role: "admin",
                groups: [{ name: data.group4 }]
            }
        ]
    };

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });

    it("Create user with valid details", () => {
        // create multiple groups in different workspaces
        navigateToManageGroups();
        [data.group1, data.group2, data.group5].forEach(createGroup);

        //builder group
        cy.get(groupsSelector.groupLink(data.group5)).click();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).check();

        [
            { name: data.workspaceName, slug: data.workspaceSlug, group: data.group3 },
            { name: data.workspaceName1, slug: data.workspaceSlug1, group: data.group4 }
        ].forEach(({ name, slug, group }) => {
            cy.apiCreateWorkspace(name, slug);
            cy.visit(slug);
            navigateToManageGroups();
            createGroup(group);
        });

        // Added valid user and logged-in in the workpsace
        cy.visit("/my-workspace");
        cy.wait(500);
        createUser(userData).then((response) => {
            expect(response.status).to.eq(201);
            userId = response.body.id;
            workspaceId = response.body.workspaces[0].id;
            navigateToManageUsers();
            searchUser(data.email);
            cy.contains("td", data.email)
                .parent()
                .within(() => {
                    cy.get("td small").should("have.text", "active");
                });

            validateUserInGroup(data.email, "my-workspace", "end-user");
            validateUserInGroup(data.email, data.workspaceSlug, "builder");
            validateUserInGroup(data.email, data.workspaceSlug1, "admin", false);
            cy.apiLogout();

            cy.apiLogin(data.email, "password");
            cy.visit("/my-workspace");
            cy.get(commonSelectors.workspaceName).should("have.text", "My workspace");
            logout();

            //Retrieve all users, a specific user by ID, and all workspaces
            cy.defaultWorkspaceLogin();
            navigateToManageUsers();
            let number = 0;
            cy.get('[data-cy="title-users-page"]').invoke('text').then((text) => {
                number = parseInt(text.match(/\d+/)[0], 10);
            });

            getAllUsers().then((response) => {
                expect(response.status).to.eq(200);
                //expect(response.body.length).to.eq(number); //error due to removal of user from instance
            });

            getUser(userId).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.name).to.eq(`${data.firstName} ${data.lastName}`);
            });

            getAllWorkspaces().then((response) => {
                expect(response.status).to.eq(200);
            });
        });
    });

    it('Handles user creation errors', () => {
        const invalidUserData = [
            { // Duplicate user
                data: { ...userData },
                expectedStatus: 422,
                expectedMessage: 'Already exists!'
            },
            { // Invalid email and long password
                data: {
                    ...userData,
                    name: `${data.firstName1} ${data.lastName1}`,
                    email: 'invalid-email',
                    password: 'a'.repeat(101)
                },
                expectedStatus: 400,
                expectedMessages: ['email must be an email', 'password must be shorter than or equal to 100 characters']
            },
            { // Non-existing group
                data: {
                    ...userData,
                    name: `${data.firstName1} ${data.lastName1}`,
                    email: `${data.email1}`,
                    workspaces: [{ name: 'My workspace', status: 'active', groups: [{ name: 'NonExistingGroup' }] }]
                },
                expectedStatus: 400,
                expectedMessage: 'Group permission id or name not found:'
            },
            { // Non-existing workspace
                data: {
                    ...userData,
                    name: `${data.firstName1} ${data.lastName1}`,
                    email: `${data.email1}`,
                    workspaces: [{ name: 'NonExistingWorkspace', status: 'active' }]
                },
                expectedStatus: 400,
                expectedMessage: 'The workspaces id or name do not exist:'
            }
        ];

        invalidUserData.forEach(({ data, expectedStatus, expectedMessages, expectedMessage }) => {
            createUser(data).then((response) => {
                expect(response.status).to.eq(expectedStatus);
                if (expectedMessages) {
                    expectedMessages.forEach(msg => expect(response.body.message).to.include(msg));
                } else {
                    expect(response.body.message).to.include(expectedMessage);
                }
            });
        });
        //Conflict permission
        const enduserData = {
            ...userData,
            name: `${data.firstName1} ${data.lastName1}`,
            email: `${data.email1}`,
            workspaces: [{ name: 'My workspace', status: 'active', groups: [{ name: data.group5 }] }]
        }
        createUser(enduserData).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body.message.title).to.include("Conflicting permissions");
        })
    });

    it("Update user details and workspaces relations", () => {
        const updatedUserData = {
            name: `${data.firstName1} ${data.lastName1}`,
            email: data.email1,
            password: "updatedpassword"
        }
        updateUser(userId, updatedUserData).then((response) => {
            expect(response.status).to.eq(200);
        })
        cy.apiLogout();
        cy.apiLogin(updatedUserData.email, updatedUserData.password);
        cy.apiLogout();

        // Replace user workspaces relations
        cy.apiLogin();
        validateUserInGroup(updatedUserData.email, "my-workspace", data.group2);
        validateUserInGroup(updatedUserData.email, data.workspaceSlug, data.group3);
        cy.visit(data.workspaceSlug1);
        navigateToManageUsers();
        searchUser(updatedUserData.email);
        cy.contains("td", updatedUserData.email);

        replaceUserWorkspacesRelations(userId, [
            { name: "My workspace", status: "active", role: "end-user", groups: [{ name: data.group1 }] },
            { name: data.workspaceName, status: "active", role: "builder", groups: [] }
        ]).then((response) => {
            expect(response.status).to.eq(200);
        });
        navigateToManageUsers();
        validateUserInGroup(updatedUserData.email, "my-workspace", data.group2, false);
        validateUserInGroup(updatedUserData.email, data.workspaceSlug, data.group3, false);

        cy.visit(data.workspaceSlug1);
        navigateToManageUsers();
        searchUser(updatedUserData.email);
        cy.get('[data-cy="text-no-result-found"]').contains("No result found");
        replaceUserWorkspacesRelations(userId, []).then((response) => {
            expect(response.status).to.eq(200);
        });
        cy.visit("my-workspace");
        navigateToManageUsers();
        searchUser(updatedUserData.email);
        cy.get('[data-cy="text-no-result-found"]').contains("No result found");
    });

    it("update user role", () => {
        const userData2 = {
            name: `${data.firstName} ${data.lastName}`,
            email: data.email,
            password: "password",
            status: "active",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active"
                }
            ]
        }
        let userId1;
        let workspaceId1;
        createUser(userData2).then((response) => {
            expect(response.status).to.eq(201);
            userId1 = response.body.id;
            workspaceId1 = response.body.workspaces[0].id;
            //update role to builder and validate user in builder's group
            updateUserRole(workspaceId1, { newRole: "builder", userId: userId1 })
                .then((response) => {
                    expect(response.status).to.eq(200);
                });
            validateUserInGroup(userData2.email, "my-workspace", "builder");

            //update role to end-user and validate user is removed from builder's group
            updateUserRole(workspaceId1, { newRole: "end-user", userId: userId1 })
                .then((response) => {
                    expect(response.status).to.eq(200);
                });
            validateUserInGroup(userData2.email, "my-workspace", data.group5, false);

            // update role to builders and validate app's owner role can't be updated
            updateUserRole(workspaceId1, { newRole: "builder", userId: userId1 })
                .then((response) => {
                    expect(response.status).to.eq(200);
                });
            cy.apiLogout();
            cy.apiLogin(userData2.email, userData2.password);
            cy.apiCreateApp(data.appName);
            cy.apiLogout();
            cy.defaultWorkspaceLogin();
            updateUserRole(workspaceId1, { newRole: "end-user", userId: userId1 })
                .then((response) => {
                    expect(response.status).to.eq(400);
                    expect(response.body.message.title).to.include("Can not change user role");
                });

        });
    });
    const userData3 = {
        name: `${data.firstName2} ${data.lastName2}`,
        email: data.email2,
        password: "password",
        status: "active",
        workspaces: [
            {
                name: "My workspace",
                status: "active",
                groups: [
                    { name: data.group1 },
                    { name: data.group2 }
                ]
            },
            {
                name: data.workspaceName,
                status: "active",
                role: "builder",
                groups: [{ name: data.group3 }]
            },
            {
                name: data.workspaceName1,
                status: "archived",
                role: "admin",
                groups: [{ name: data.group4 }]
            }
        ]
    };
    it("Replace user workspace", () => {
        let userId1, workspaceId1;
        createUser(userData3).then((response) => {
            expect(response.status).to.eq(201);
            userId1 = response.body.id;
            workspaceId1 = response.body.workspaces[0].id;

            // Helper function to replace user workspace and validate response
            const replaceAndValidate = (payload, expectedStatus = 200) => {
                return replaceUserWorkspace(userId1, workspaceId1, payload).then((response) => {
                    expect(response.status).to.eq(expectedStatus);
                });
            };

            // No change if empty request body
            replaceAndValidate({}).then(() => {
                validateUserInGroup(userData3.email, "my-workspace", data.group1);
                validateUserInGroup(userData3.email, "my-workspace", data.group2);
            });

            // Archive the user and verify status
            replaceAndValidate({ status: "archived" }).then(() => {
                navigateToManageUsers();
                searchUser(userData3.email);
                cy.contains("td", userData3.email)
                    .parent()
                    .within(() => {
                        cy.get("td small").should("have.text", "archived");
                    });
            });

            // Reactivate user and validate groups
            replaceAndValidate({ status: "active" }).then(() => {
                validateUserInGroup(userData3.email, "my-workspace", data.group1);
                validateUserInGroup(userData3.email, "my-workspace", data.group2);
            });

            // Update groups and validate removal
            replaceAndValidate({ groups: [{ name: data.group1 }] }).then(() => {
                validateUserInGroup(userData3.email, "my-workspace", data.group2, false);
            });

            //Empty group array, user removed from groups
            replaceAndValidate({ groups: [] }).then(() => {
                validateUserInGroup(userData3.email, "my-workspace", data.group1, false);
            });

            //Conflict permission
            replaceAndValidate({ groups: [{ name: data.group5 }] }, 400);

            //Add user in groups and validate
            replaceAndValidate({ groups: [{ name: data.group1 }, { name: data.group2 }] });
            validateUserInGroup(userData3.email, "my-workspace", data.group1);
            validateUserInGroup(userData3.email, "my-workspace", data.group2);
        });
    });
});

