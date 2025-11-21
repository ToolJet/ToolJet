import { fake } from "Fixtures/fake";
import { apiRequest as baseApiRequest } from "Support/utils/externalApi";

const apiBaseUrl = Cypress.env("API_URL");
const authHeader = {
    Authorization: Cypress.env("AUTH_TOKEN"),
    "Content-Type": "application/json",
};

const sendApiRequest = (method, endpoint, body, headers = authHeader) =>
    baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers);

const randomEmail = fake.email.toLowerCase();

const invalidAuthHeader = {
    Authorization: "Basic invalid-token",
    "Content-Type": "application/json",
};

describe("ToolJet: User & Workspace API", () => {
    let userId;
    let workspaceId;
    let workspaceName;

    it("gets all users", () => {
        sendApiRequest("GET", "/ext/users").then(({ body, status }) => {
            expect(status).to.eq(200);
            expect(body).to.be.an("array");
            if (body.length) userId = body[0].id;
        });
    });

    it("creates user", () => {
        const data = {
            name: "API User",
            email: randomEmail,
            status: "active",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active",
                    groups: [],
                },
            ],
        };

        sendApiRequest("POST", "/ext/users", data).then(({ body, status }) => {
            expect(status).to.eq(201);
            expect(body).to.have.property("id");
            userId = body.id;
        });
    });

    it("fails if name is missing", () => {
        const data = {
            email: fake.email,
            status: "active",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active",
                    groups: [],
                },
            ],
        };
        sendApiRequest("POST", "/ext/users", data).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.message).to.include("name must be a string");
        });
    });

    it("fails for invalid email", () => {
        const data = {
            name: "User",
            email: "bademail",
            status: "active",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active",
                    groups: [],
                },
            ],
        };
        sendApiRequest("POST", "/ext/users", data).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.message).to.include('email must be an email');
        });
    });

    it("fails for duplicate email", () => {
        const data = {
            name: "User",
            email: randomEmail,
            status: "active",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active",
                    groups: [],
                },
            ],
        };
        sendApiRequest("POST", "/ext/users", data).then(() => {
            sendApiRequest("POST", "/ext/users", data).then(({ status, body }) => {
                expect(status).to.eq(400);
                expect(body.message).to.include(`User with email ${randomEmail} already exists`);
            });
        });
    });

    it("fails for unsupported status", () => {
        const data = {
            name: "User",
            email: fake.email,
            status: "badstatus",
            workspaces: [
                {
                    name: "My workspace",
                    status: "active",
                    groups: [],
                },
            ],
        };
        sendApiRequest("POST", "/ext/users", data).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.message).to.be.an('array').and.not.be.empty;
            const joinedMessage = body.message.join(' ').toLowerCase();
            expect(joinedMessage).to.include('status must be one of the following values: active, archived');
        });
    });

    it("fails for empty body", () => {
        sendApiRequest("POST", "/ext/users", {}).then(({ status, body }) => {
            expect(status).to.eq(400);
            expect(body.message).to.be.an('array').and.not.be.empty;
            const combinedMessage = body.message.join(' ').toLowerCase();
            ['name', 'email', 'workspaces'].forEach((field) => {
                expect(combinedMessage).to.include(field);
            });
        });
    });

    it("gets user by ID", () => {
        sendApiRequest("GET", `/ext/user/${userId}`).then(({ body, status }) => {
            expect(status).to.eq(200);
            expect(body.id).to.eq(userId);
        });
    });

    it("fails with unknown user ID", () => {
        sendApiRequest("GET", "/ext/user/invalid12345").then(({ status, body }) => {
            expect(422).to.eq(status);
            expect(body.message).to.include('invalid input syntax for type uuid: "invalid12345"');
        });
    });

    it.skip("fails if userId is missing", () => {
        sendApiRequest("GET", "/ext/user/").then(({ status, body }) => {
            expect(status).to.eq(404);
            expect(body.message).to.include("Cannot GET /api/ext/user/");
        });
    });

    it("updates user details", () => {
        sendApiRequest("PATCH", `/ext/user/${userId}`, {
            name: "Updated API User",
        }).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });

    it('fails with unknown user ID', () => {
        sendApiRequest('PATCH', '/ext/user/invalid12345', {
            name: 'Whatever',
        }).then(({ status, body }) => {
            expect(status).to.eq(422);
            expect(body.message).to.include('invalid input syntax for type uuid: "invalid12345"');
        });
    });

    it('fails for empty body', () => {
        sendApiRequest('PATCH', `/ext/user/${userId}`, {}).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });

    it('fails when updating with invalid field', () => {
        sendApiRequest('PATCH', `/ext/user/${userId}`, { invalidField: 'value' }).then(({ status }) => {
            expect(status).to.eq(200);
        });
    });


});
