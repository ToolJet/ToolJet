export const apiUpdateProfile = (firstName, lastName) => {
    return cy.getAuthHeaders().then((headers) => {
        return cy.request({
            method: "PATCH",
            url: `${Cypress.env("server_host")}/api/profile`,
            headers: headers,
            body: {
                first_name: firstName,
                last_name: lastName,
            },
            log: false,
        }).then((response) => {
            expect(response.status).to.equal(200);
            Cypress.log({
                name: "Update Profile",
                displayName: "UPDATE PROFILE: ",
                message: `${firstName} ${lastName}: Success`,
            });
            return response;
        });
    });
};