import { fake } from "Fixtures/fake";
import { apiRequest as baseApiRequest } from "Support/utils/externalApi";

const apiBaseUrl = Cypress.env("API_URL");
const authHeader = {
    Authorization: Cypress.env("AUTH_TOKEN"),
    "Content-Type": "application/json",
};

const sendApiRequest = (method, endpoint, body, headers = authHeader) =>
    baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers);

const randomEmail = fake.email;

const invalidAuthHeader = {
    Authorization: "Basic invalid-token",
    "Content-Type": "application/json",
};

describe("ToolJet: User & Workspace API", () => {
    let userId;
    let workspaceId;
    let workspaceName;

    before(() => {
        const data = {
            name: "API User",
            email: randomEmail,
            status: "active",
            workspaces: [
                {
                    "name": "My workspace",
                    "status": "active",
                    "groups": []
                }
            ]
        };
        sendApiRequest("POST", "/ext/users", data).then(({ body, status }) => {
            expect(status).to.eq(201);
            expect(body).to.have.property("id");
            userId = body.id;
        });
    })

    it("gets all workspaces", () => {
        sendApiRequest("GET", "/ext/workspaces").then(({ body, status }) => {
            expect(status).to.eq(200);
            expect(body).to.be.an("array").and.not.be.empty;
            workspaceId = body[0].id;
            workspaceName = body[0].name || "My workspace";
        });
    });

    it("updates user role for workspace", () => {
        sendApiRequest("PUT", `/ext/update-user-role/workspace/${workspaceId}`, {
            newRole: "admin",
            userId,
        }).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });

    it("replaces user workspace relations", () => {
        sendApiRequest("PUT", `/ext/user/${userId}/workspaces`, [
            { id: workspaceId, name: workspaceName, status: "active", groups: [] },
        ]).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });

    it("replaces a specific workspace relation for user", () => {
        sendApiRequest("PATCH", `/ext/user/${userId}/workspace/${workspaceId}`, {
            name: "Renamed Workspace",
            status: "active",
            groups: [],
        }).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });

    it("rejects unauthorized access to user listing", () => {
        sendApiRequest("GET", "/ext/users", undefined, invalidAuthHeader).then(({ status, body }) => {
            expect(status).to.eq(403);
            expect(body.message).to.include("Unauthorized");
        });
    });



    it("rejects role update for invalid workspace", () => {
        sendApiRequest("PUT", `/ext/update-user-role/workspace/${workspaceId}-invalid`, {
            newRole: "admin",
            userId,
        }).then(({ status, body }) => {
            expect(status).to.eq(422);
            expect(body.message).to.include(`invalid input syntax for type uuid: "${workspaceId}-invalid`);
        });
    });

    it("fails to replace workspace relations with conflicting groups", () => {
        sendApiRequest("PUT", `/ext/user/${userId}/workspaces`, [
            {
                id: workspaceId,
                name: workspaceName,
                status: "active",
                groups: [{ name: "NonExisting" }],
            },
        ]).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.message).to.include("Group");
        });
    });
});
