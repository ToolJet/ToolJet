import { fake } from "Fixtures/fake";
import { createUser, getAllUsers, getUser, updateUser, createGroup, validateUserInGroup } from 'Support/utils/api';
import { groupsSelector } from "Selectors/manageGroups";
import { commonSelectors } from 'Selectors/common';
import { searchUser, navigateToManageUsers, logout, navigateToManageGroups } from 'Support/utils/common';

describe("API Test", () => {

    const sanitize = (str) => str.toLowerCase().replace(/[^A-Za-z]/g, "");
    let userId;
    const data = {
        firstName: fake.firstName,
        lastName: fake.lastName,
        firstName1: fake.firstName,
        lastName1: fake.lastName,
        email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        email1: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
        workspaceName: sanitize(fake.lastName),
        workspaceSlug: sanitize(fake.lastName),
        workspaceName1: sanitize(fake.firstName),
        workspaceSlug1: sanitize(fake.firstName),
        group1: sanitize(fake.firstName),
        group2: sanitize(fake.firstName),
        group3: sanitize(fake.firstName),
        group4: sanitize(fake.firstName),
        group5: sanitize(fake.firstName)
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
            /*  navigateToManageUsers();
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
              logout();*/
        })
    })

    it.skip('Handles user creation errors', () => {
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

    it("Get all users and by user id", () => {
        navigateToManageUsers();
        let number = 0;
        cy.get('[data-cy="title-users-page"]').invoke('text').then((text) => {
            number = parseInt(text.match(/\d+/)[0], 10);
            cy.log('Number of users:', number);
        });
        getAllUsers().then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.length).to.eq(number);
        });

        getUser(userId).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.name).to.eq(`${data.firstName} ${data.lastName}`);
        });
    });
});
