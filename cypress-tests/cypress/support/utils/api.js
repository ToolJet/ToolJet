export const apiRequest = (method, url, body = {}, headers = {}) => {
    return cy.request({
        method,
        url,
        body,
        headers: {
            Authorization: Cypress.env('AUTH_TOKEN'),
            "Content-Type": "application/json",
            ...headers,
        },
    });
};

export const createUser = (userData) => {
    return apiRequest("POST", `${Cypress.env('API_URL')}/ext/users`, userData);
};

export const getUser = (userId) => {
    return apiRequest("GET", `${Cypress.env('API_URL')}/ext/user/${userId}`);
};

export const updateUser = (userId, userData) => {
    return apiRequest("PATCH", `${Cypress.env('API_URL')}/ext/user/${userId}`, userData);
};
