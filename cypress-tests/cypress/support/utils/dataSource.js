import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";

export const verifyCouldnotConnectWithAlert = (dangerText) => {
  cy.get(postgreSqlSelector.connectionFailedText, {
    timeout: 10000,
  }).verifyVisibleElement("have.text", postgreSqlText.couldNotConnect, {
    timeout: 5000,
  });
  cy.get(postgreSqlSelector.dangerAlertNotSupportSSL)
    .should("be.visible")
    .contains(dangerText);
};


export const resizeQueryPanel=(height='90')=>{
  cy.get('[class="query-pane"]').invoke("css", "height", `calc(${height}%)`);
}

export const query=(operation)=>{
  cy.get(`[data-cy="query-${operation}-button"]`).click()
}

export const verifypreview=(type,data)=>{
  cy.get(`[data-cy="preview-tab-${type}"]`).click()
  cy.get(`[data-cy="preview-${type}-data-container"]`).verifyVisibleElement('contain.text', data)
}

export const addInput=(field,data)=>{
  cy.get(`[data-cy="${field.toLowerCase()}-input-field"]`).clearAndTypeOnCodeMirror(data)
}