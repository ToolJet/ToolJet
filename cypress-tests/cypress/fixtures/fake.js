import faker from "faker";
export let fake = {};

function email() {
  return `${faker.name.findName()}@example.com`;
}
function password() {
  return faker.internet.password();
}
function firstName() {
  return faker.name.firstName();
}
function lastName() {
  return faker.name.lastName();
}
function companyName() {
  return faker.company.companyName();
}
function widgetName() {
  return faker.name.firstName();
}
function randomSentence() {
  return faker.lorem.sentence();
}

Object.defineProperty(fake, "email", { get: email });
Object.defineProperty(fake, "password", { get: password });
Object.defineProperty(fake, "firstName", { get: firstName });
Object.defineProperty(fake, "lastName", { get: lastName });
Object.defineProperty(fake, "companyName", { get: companyName });
Object.defineProperty(fake, "widgetName", { get: widgetName });
Object.defineProperty(fake, "randomSentence", { get: randomSentence });
