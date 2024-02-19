import { faker } from "@faker-js/faker";
export let fake = {};

function email() {
  return `${faker.name.firstName()}@example.com`;
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
function fullName() {
  return `${faker.name.firstName()} ${faker.name.lastName()}`;
}
function companyName() {
  const str = faker.company.companyName();
  return str.substring(0, str.indexOf(" ")).replace(/[^a-zA-Z ]/g, "");
}
function widgetName() {
  return faker.name.firstName();
}
function randomSentence() {
  return faker.lorem.sentence();
}

function randomRgba() {
  let rgba = faker.color.rgb({ format: "decimal", includeAlpha: true });
  rgba[rgba.length - 1] = rgba[rgba.length - 1].toPrecision(2) * 100;
  return rgba;
}

function randomRgb() {
  return faker.color.rgb({ format: "decimal" });
}

function boxShadowParam() {
  const paramArray = [
    faker.datatype.number({
      min: -20,
      max: 20,
    }),
    faker.datatype.number({
      min: -20,
      max: 20,
    }),
    faker.datatype.number({
      min: 0,
      max: 20,
    }),
    faker.datatype.number({
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
  return faker.name.firstName();
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

