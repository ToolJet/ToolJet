// Core datasources - loaded immediately (top 5 most commonly used)
import Restapi from './packages/restapi/lib/manifest.json'
import Postgresql from './packages/postgresql/lib/manifest.json'
import Mongodb from './packages/mongodb/lib/manifest.json'
import Googlesheets from './packages/googlesheets/lib/manifest.json'
import Airtable from './packages/airtable/lib/manifest.json'

import RestapiOperation from './packages/restapi/lib/operations.json'
import PostgresqlOperation from './packages/postgresql/lib/operations.json'
import MongodbOperation from './packages/mongodb/lib/operations.json'
import GooglesheetsOperation from './packages/googlesheets/lib/operations.json'
import AirtableOperation from './packages/airtable/lib/operations.json'

import restapiSvg from './packages/restapi/lib/icon.svg'
import postgresqlSvg from './packages/postgresql/lib/icon.svg'
import mongodbSvg from './packages/mongodb/lib/icon.svg'
import googlesheetsSvg from './packages/googlesheets/lib/icon.svg'
import airtableSvg from './packages/airtable/lib/icon.svg'

export const coreManifests = {
  Restapi,
  Postgresql,
  Mongodb,
  Googlesheets,
  Airtable,
}

export const coreOperations = {
  Restapi: RestapiOperation,
  Postgresql: PostgresqlOperation,
  Mongodb: MongodbOperation,
  Googlesheets: GooglesheetsOperation,
  Airtable: AirtableOperation,
}

export const coreSvgs = {
  restapi: restapiSvg,
  postgresql: postgresqlSvg,
  mongodb: mongodbSvg,
  googlesheets: googlesheetsSvg,
  airtable: airtableSvg,
}

// Lazy loader for extended datasources (remaining 41)
export async function loadExtendedDatasources() {
  // Dynamically import the full client.js which has all datasources
  const fullClient = await import('./client.js.backup');

  const extendedManifests = {};
  const extendedOperations = {};
  const extendedSvgs = {};

  // Filter out core datasources to get only extended ones
  const coreKeys = ['Restapi', 'Postgresql', 'Mongodb', 'Googlesheets', 'Airtable'];
  const coreSvgKeys = ['restapi', 'postgresql', 'mongodb', 'googlesheets', 'airtable'];

  for (const key in fullClient.allManifests) {
    if (!coreKeys.includes(key)) {
      extendedManifests[key] = fullClient.allManifests[key];
    }
  }

  for (const key in fullClient.allOperations) {
    if (!coreKeys.includes(key)) {
      extendedOperations[key] = fullClient.allOperations[key];
    }
  }

  for (const key in fullClient.allSvgs) {
    if (!coreSvgKeys.includes(key)) {
      extendedSvgs[key] = fullClient.allSvgs[key];
    }
  }

  return {
    manifests: extendedManifests,
    operations: extendedOperations,
    svgs: extendedSvgs,
  };
}

// For backwards compatibility: export allManifests as coreManifests initially
// Components can merge in extended manifests when needed
export const allManifests = coreManifests;
export const allOperations = coreOperations;
export const allSvgs = coreSvgs;
