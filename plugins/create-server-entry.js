const { readdirSync, writeFileSync } = require("fs");

const packages = readdirSync("./packages", { withFileTypes: true }).filter(
  (dirent) => dirent.isDirectory() && dirent.name !== "common"
);

const mapImportNameToOldValue = (str) => {
  if (str === "mongo") return "mongodb";
  if (str === "twilioapi") return "twilio";
  if (str === "typesenseapi") return "typesense";
  if (str === "minioapi") return "minio";
  return str;
};

const imports = packages.map(
  (dirent) =>
    `import ${mapImportNameToOldValue(dirent.name)} from './packages/${
      dirent.name
    }/lib'`
);
imports.push([
  "import { QueryError, OAuthUnauthorizedClientError } from './packages/common/lib'",
]);

const outs = `export default {\n${packages
  .map((dirent) => `  ${mapImportNameToOldValue(dirent.name)}`)
  .join(",\n")},
}`;

const content = `
${imports.join("\n")} \n
${outs}\n
export { QueryError, OAuthUnauthorizedClientError }
`;

writeFileSync("server.ts", content);
