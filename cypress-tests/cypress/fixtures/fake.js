import { faker } from "@faker-js/faker";
export let fake = {};

function email() {
  return `${faker.person.firstName()}@example.com`;
}
function password() {
  return faker.internet.password();
}
function firstName() {
  return faker.person.firstName().replace(/[^a-z0-9]/g, "");;
}
function lastName() {
  return faker.person.lastName().replace(/[^a-z0-9]/g, "");;
}
function fullName() {
  return `${faker.person.firstName()} ${faker.person.lastName()}`;
}
function companyName() {
  const str = `${faker.company.name()} ${faker.person.lastName()}`;
  return str.substring(0, str.indexOf(" ")).replace(/[^a-zA-Z ]/g, "");
}
function widgetName() {
  return faker.person.firstName();
}
function randomSentence() {
  return faker.lorem.sentence();
}

function randomRgba() {
  let rgba = faker.color.rgb({ format: "decimal", includeAlpha: true });
  let alpha = rgba[rgba.length - 1].toPrecision(2) * 100;

  alpha = Math.min(Math.max(alpha, 20), 80);
  rgba[rgba.length - 1] = alpha;
  return rgba;
}

function randomRgb() {
  return faker.color.rgb({ format: "decimal" });
}

function boxShadowParam() {
  const paramArray = [
    faker.number.int({
      min: -20,
      max: 20,
    }),
    faker.number.int({
      min: -20,
      max: 20,
    }),
    faker.number.int({
      min: 0,
      max: 20,
    }),
    faker.number.int({
      min: 0,
      max: 20,
    }),
  ];

  return paramArray;
}

function randomRgbaHex() {
  let rgba = faker.color.rgb({ format: "hex", casing: "lower" });
  return rgba;
}

function tableName() {
  return faker.person.firstName();
}

Object.defineProperty(fake, "email", { get: email });
Object.defineProperty(fake, "password", { get: password });
Object.defineProperty(fake, "firstName", { get: firstName });
Object.defineProperty(fake, "lastName", { get: lastName });
Object.defineProperty(fake, "fullName", { get: fullName });
Object.defineProperty(fake, "companyName", { get: companyName });
Object.defineProperty(fake, "widgetName", { get: widgetName });
Object.defineProperty(fake, "randomSentence", { get: randomSentence });
Object.defineProperty(fake, "randomRgba", { get: randomRgba });
Object.defineProperty(fake, "randomRgb", { get: randomRgb });
Object.defineProperty(fake, "boxShadowParam", { get: boxShadowParam });
Object.defineProperty(fake, "randomRgbaHex", { get: randomRgbaHex });
Object.defineProperty(fake, "tableName", { get: tableName });
