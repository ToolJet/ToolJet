import { fake } from "Fixtures/fake";
import { createUser, getUser, updateUser } from 'Support/utils/api';
import { commonSelectors } from 'Selectors/common';
import { searchUser, navigateToManageUsers, logout, navigateToManageGroups } from 'Support/utils/common';

describe("API Test", () => {
    const sanitize = (str) => str.toLowerCase().replace(/[^A-Za-z]/g, "");
    const data = {
        firstName: fake.firstName,
        lastName: fake.lastName,
        firstName1: fake.firstName,
        lastName1: fake.lastName,
        email: sanitize(fake.email),
        email1: sanitize(fake.email),
        workspaceName: sanitize(fake.lastName),
        workspaceSlug: sanitize(fake.lastName),
        workspaceName1: sanitize(fake.firstName),
        workspaceSlug1: sanitize(fake.firstName)
    };
    it("should create a new user and verify", () => {
        cy.defaultWorkspaceLogin();
        /*  const userData = {
              name: `${data.firstName} ${data.lastName}`,
              email: data.email,
              password: "password",
              status: "active",
              workspaces: [
                  {
                      name: "My workspace",
                      status: "active",
                      groups: [{ name: "all_users" }]
                  }
              ]
          };
  
          createUser(userData).then((response) => {
              expect(response.status).to.eq(201);
              cy.defaultWorkspaceLogin();
              navigateToManageUsers();
              searchUser(data.email);
              cy.contains("td", data.email)
                  .parent()
                  .within(() => {
                      cy.get("td small").should("have.text", "active");
                  });
              cy.logoutApi();
              cy.apiLogin(data.email, "password");
              cy.visit("/my-workspace");
              cy.get(commonSelectors.workspaceName).should("have.text", "My workspace");
              logout();
  
              cy.defaultWorkspaceLogin();
              cy.getCookie("tj_auth_token").then((cookie) => {
                  cy.request({
                      method: "GET",
                      url: `${Cypress.env('API_URL')}/users/all?page=1&searchText=${data.email}&status=`,
                      headers: {
                          "Tj-Workspace-Id": Cypress.env("workspaceId"),
                          Cookie: `tj_auth_token=${cookie.value}`,
                      },
                  }).then((response) => {
                      expect(response.status).to.eq(200);
                      const userId = response.body.users[0].id;
  
                      getUser(userId).then((response) => {
                          expect(response.status).to.eq(200);
                          expect(response.body).to.have.property("name", `${data.firstName} ${data.lastName}`);
                          expect(response.body).to.have.property("email", data.email);
                      });
  
                      const updatedUserData = {
                          name: `${data.lastName} ${data.firstName}`,
                          email: data.email2,
                      };
  
                      updateUser(userId, updatedUserData).then((response) => {
                          expect(response.status).to.eq(200);
                          navigateToManageUsers();
                          searchUser(data.email2);
                          cy.contains("td", data.email2)
                              .parent()
                              .within(() => {
                                  cy.get("td small").should("have.text", "active");
                              });
                          cy.logoutApi();
                          cy.apiLogin(data.email2, "password");
                          cy.visit("/my-workspace");
                          cy.get(commonSelectors.workspaceName).should("have.text", "My workspace");
                          logout();
                      });
                  });
              });
          });*/
    });

    it("should handle negative cases", () => {
        const invalidUserId = "1d8a92b1-4925-4fbf-tool-0jet45d98487";
        const invalidAuthToken = "Basic invalidAuthToken";

        cy.request({
            method: "GET",
            url: `${Cypress.env('API_URL')}/ext/user/${invalidUserId}`,
            headers: {
                Authorization: invalidAuthToken,
                "Content-Type": "application/json",
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(403);
            expect(response.body.message).to.eq("Unauthorized");
        });

        cy.request({
            method: "POST",
            url: `${Cypress.env('API_URL')}/ext/users`,
            body: {
                name: `${data.lastName} ${data.firstName}`,
                email: `${data.email2}`,
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                        groups: [{ name: "all_users" }],
                    },
                ],
            },
            headers: {
                Authorization: Cypress.env('AUTH_TOKEN'),
                "Content-Type": "application/json",
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.message).to.eq("Already exists!");
        });

        cy.request({
            method: "GET",
            url: `${Cypress.env('API_URL')}/ext/user/nonExistingUserId`,
            headers: {
                Authorization: Cypress.env('AUTH_TOKEN'),
                "Content-Type": "application/json",
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.message).to.contain("invalid input syntax for type uuid");
        });

        cy.request({
            method: "POST",
            url: `${Cypress.env('API_URL')}/ext/users`,
            body: {
                name: `${data.firstName} ${data.lastName}`,
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                        groups: [{ name: "all_users" }],
                    },
                ],
            },
            headers: {
                Authorization: Cypress.env('AUTH_TOKEN'),
                "Content-Type": "application/json",
            },
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body.message).to.deep.equal(["email must be an email"]);
        });

        cy.request({
            method: "GET",
            url: `${Cypress.env('API_URL')}/users/all`,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(401);
            expect(response.body.message).to.eq("Unauthorized");
        });
    });

    it.only("create user", () => {

        cy.defaultWorkspaceLogin();
        navigateToManageGroups();

        const createGroup = (groupName) => {
            cy.get(groupsSelector.createNewGroupButton).click();
            cy.clearAndType(groupsSelector.groupNameInput, groupName);
            cy.get(groupsSelector.createGroupButton).click();
        }
        ["group1", "group2"].forEach(createGroup);

        [
            { name: data.workspaceName, slug: data.workspaceSlug, group: "ws1group1" },
            { name: data.workspaceName1, slug: data.workspaceSlug1, group: "ws2group2" }
        ].forEach(({ name, slug, group }) => {
            cy.apiCreateWorkspace(name, slug);
            cy.visit(slug);
            navigateToManageGroups();
            createGroup(group);
        });


        //create user with all valid details
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
                        { name: "group1" },
                        { name: "group2" }
                    ]
                },
                {
                    name: data.workspaceName,
                    status: "active",
                    role: "builder",
                    groups: [{ name: "ws1group1" }]
                },
                {
                    name: data.workspaceName1,
                    status: "archived",
                    role: "admin",
                    groups: [{ name: "ws2group2" }]
                }
            ]
        };

        // Added valid user and logged-in in the workpsace
        createUser(userData).then((response) => {
            expect(response.status).to.eq(201);
            cy.defaultWorkspaceLogin();
            navigateToManageUsers();
            searchUser(data.email);
            cy.contains("td", data.email)
                .parent()
                .within(() => {
                    cy.get("td small").should("have.text", "active");
                });

            cy.get(commonSelectors.manageGroupsOption).click();
            cy.get(groupsSelector.groupLink("end-user")).click();
            cy.get(groupsSelector.usersLink).click();
            cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");

            cy.visit(data.workspaceSlug);
            navigateToManageGroups();
            cy.get(groupsSelector.groupLink("builder")).click();
            cy.get(groupsSelector.usersLink).click();
            cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");

            cy.visit(data.workspaceSlug1);
            navigateToManageGroups();
            cy.get(groupsSelector.groupLink("admin")).click();
            cy.get(groupsSelector.usersLink).click();
            cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");

            cy.logoutApi();

            cy.apiLogin(data.email, "password");
            cy.visit("/my-workspace");
            cy.get(commonSelectors.workspaceName).should("have.text", "My workspace");
            logout();

            //add user with invalid data and verify error
            // const data = {
            //     firstName1: fake.firstName,
            //     lastName1: fake.lastName,
            // };

            cy.defaultWorkspaceLogin();
            userData = {
                name: `${data.firstName} ${data.lastName}`,
                email: data.email,
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                    }
                ]
            }
            createUser(userData).then((response) => {
                expect(response.status).to.eq(422);
                expect(response.body.message).to.eq("Already exists!");
            });

            userData = {
                name: `${data.firstName1} ${data.lastName1}`,
                email: "test@tooljet.com1",
                password: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the test",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                        groups: [{ name: "group1" }]
                    }
                ]
            };

            createUser(userData).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.body.message).to.eq("email must be an email",
                    "password must be shorter than or equal to 100 characters");
            })

            //create and add user in non existing group and non existing workspace
            userData = {
                name: `${data.firstName1} ${data.lastName1}`,
                email: "test@tooljet.com",
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                        groups: [{ name: "Group1" }]
                    }
                ]
            };
            createUser(userData).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.body.message).to.eq("Group permission id or name not found: id undefined, name Group1");
            });

            userData = {
                name: `${data.firstName1} ${data.lastName1}`,
                email: "test@tooljet.com",
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "testws",
                        status: "active"
                    }
                ]
            };
            createUser(userData).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.body.message).to.eq("The workspaces id or name do not exist: id undefined, name testws");
            });



            //conflict permission
            userData = {
                name: `${data.firstName1} ${data.lastName1}`,
                email: `${data.email1}`,
                password: "password",
                status: "active",
                workspaces: [
                    {
                        name: "My workspace",
                        status: "active",
                        groups: [{ name: "builder groups" }]
                    }
                ]
            };
            navigateToManageGroups();
            createGroup("builder groups");
            cy.get(groupsSelector.groupLink("builder groups")).click();
            cy.get(groupsSelector.permissionsLink).click();
            cy.get(groupsSelector.appsCreateCheck).check();
            createUser(userData).then((response) => {
                expect(response.status).to.eq(400);
                expect(response.body.message).to.eq("End-users can only be granted permission to view apps. Kindly change the user role or custom group to continue.");
            })
        })
    })
});