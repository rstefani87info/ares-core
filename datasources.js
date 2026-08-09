/**advancedConsole
 * @author Roberto Stefani
 * @license MIT
 */

import { nanoid } from "nanoid";
import { getSHA256Hash } from "./crypto.js";
import * as advancedConsole from "./console.js";
import { defaultConnectionCallback, DBConnection } from "./db-connection.js";
import { SQLDBConnection } from "./sql-db-connection.js";
import { RESTConnection } from "./rest-connection.js";
import { executeDatasourceRequestMapper } from "./datasource-mapper-executor.js";
import * as datasourceRuntime from "./datasource-runtime.js";

const mapRequestOrResult = function (request) {
  return request;
};

const INTERNAL_DATASOURCE_KEYS = new Set([
  "aReS",
  "sessions",
  "hashKeyMap",
  "idKeyMap",
  "pools",
  "onMapperLoaded",
  "_mapperNames",
]);

function syncExistingMapper(existingMapper, nextMapper) {
  for (const key of Object.keys(existingMapper)) {
    if (!["datasource", "aReS"].includes(key) && !(key in nextMapper)) {
      delete existingMapper[key];
    }
  }

  Object.assign(existingMapper, nextMapper);
  existingMapper.datasource = nextMapper.datasource;
  existingMapper.aReS = nextMapper.aReS;
  existingMapper.disabled = false;
  return existingMapper;
}

function removeStaleDatasourceProperties(datasource, nextSettings) {
  const nextKeys = new Set([
    ...Object.keys(nextSettings ?? {}),
    ...INTERNAL_DATASOURCE_KEYS,
  ]);

  for (const key of Object.keys(datasource)) {
    if (!nextKeys.has(key)) {
      delete datasource[key];
    }
  }
}

/**
 * @param {Object} aReS - The express framework object
 * @param {Object} datasourceSetting - Object representing the datasource description
 * @param {function} onMapperLoaded - The callback when the mapper is loaded
 * @param {boolean} [force=false] - Whether to force the export
 * @return {Object} The exported database
 *
 * Initialyze datasource objects
 *
 */
export async function loadDatasource(
  aReS,
  datasourceSettings,
  onMapperLoaded,
  force = false
) {
  advancedConsole.asyncConsole.log(
    "datasource",
    datasourceSettings
  );
  const datasourceName = datasourceSettings.name.toLowerCase();
  aReS.datasourceMap = aReS.datasourceMap ?? {};
  const datasourceExists = datasourceName in aReS.datasourceMap;
  if (force && datasourceExists) {
    return refreshDatasource(aReS, datasourceSettings, onMapperLoaded);
  }
  if (!datasourceExists) {
    advancedConsole.asyncConsole.log(
      "datasources",
      'init db "' + datasourceName + '" {'
    );
    aReS.datasourceMap[datasourceName] = new Datasource(
      aReS,
      datasourceSettings
    );
    aReS.datasourceMap[datasourceName].onMapperLoaded = onMapperLoaded;
    await aReS.datasourceMap[datasourceName].loadQueries();
    advancedConsole.asyncConsole.log("datasources", "}");
  }
  advancedConsole.asyncConsole.output("datasources");
  return aReS.datasourceMap[datasourceName];
}

export async function refreshDatasource(
  aReS,
  datasourceSettings,
  onMapperLoaded
) {
  const datasourceName = datasourceSettings.name.toLowerCase();
  aReS.datasourceMap = aReS.datasourceMap ?? {};
  const datasource = aReS.datasourceMap[datasourceName];

  if (!datasource) {
    return loadDatasource(aReS, datasourceSettings, onMapperLoaded, false);
  }

  advancedConsole.asyncConsole.log(
    "datasources",
    'refresh db "' + datasourceName + '" {'
  );

  const previousMapperNames = new Set(datasource._mapperNames ?? []);
  datasource.close();
  datasource.sessions = {};
  datasource.pools = {};
  datasource.hashKeyMap = {};
  datasource.idKeyMap = {};
  removeStaleDatasourceProperties(datasource, datasourceSettings);
  Object.assign(datasource, datasourceSettings);
  datasource.aReS = aReS;
  datasource.onMapperLoaded = onMapperLoaded ?? datasource.onMapperLoaded;
  datasource._mapperNames = new Set();
  await datasource.loadQueries({ reload: true });

  for (const mapperName of previousMapperNames) {
    if (!datasource._mapperNames.has(mapperName)) {
      datasource.disableQuery(mapperName);
    }
  }

  advancedConsole.asyncConsole.log("datasources", "}");
  advancedConsole.asyncConsole.output("datasources");
  return datasource;
}

export function aReSInitialize(aReS) {
  aReS.loadDatasource = (datasourceSettings, onMapperLoaded, force = false) =>
    loadDatasource(aReS, datasourceSettings, onMapperLoaded, force);
  aReS.refreshDatasource = (datasourceSettings, onMapperLoaded) =>
    refreshDatasource(aReS, datasourceSettings, onMapperLoaded);
}

export function exportAsAresMethod(aReS, mapper, datasource) {
  advancedConsole.asyncConsole.log(
    "datasources",
    " - open REST: " + mapper.name + ":  " + mapper.path
  );
  aReS[datasource.name + "_" + mapper.querySetting.name + "_" + mapper.name] =
    async (req, res) => {
      let result = await mapper.execute(req);
      if (result["€rror"]) throw new Error(JSON.stringify([result, req, res]));
      else {
        return result;
      }
    };
  advancedConsole.asyncConsole.log("datasources", " - }");
}

export { ValidationError } from "./datasource-errors.js";
export class DatasourceRequestMapper {
  constructor(aReS, datasource, settings) {
    if (typeof settings === "object") Object.assign(this, settings);
    this.datasource = datasource;
    this.aReS = aReS;
    if (!settings.name) this.name = nanoid();
    if (typeof this.mapParameters !== "function")
      this.mapParameters = mapRequestOrResult;
    if (typeof this.mapResult !== "function")
      this.mapResult = mapRequestOrResult;
    if (typeof this.onEmptyResult !== "function")
      this.onEmptyResult = (res) => {};
    if (!this?.methods) this.methods = "GET";
  }

  async execute(request) {
    if (this.disabled) {
      return { "€rror": new Error(`Datasource mapper "${this.name}" is disabled`) };
    }
    advancedConsole.log(
      "datasources",
      ` - execute: ${this.name}:  ${request.path ?? ""}`
    );
    return executeDatasourceRequestMapper(this, request).then((result) => {
      advancedConsole.log(
        "datasources",
        ` - execute: ${this.name}:  ${request.path ?? ""}:`,result['€rror'] ?? `found: ${result.results.length} items`
      );
      return result;
    }).catch((error) => {
      advancedConsole.error(
        "datasources",
        ` - execute: ${this.name}:  ${request.path ?? ""}:`, error
      );
      return error;
    });
  }
}
export class Datasource {
  constructor(aReS, dbConfig) {
    if (typeof dbConfig === "object") Object.assign(this, dbConfig);
    this.aReS = aReS;
    this.sessions = {};
    this.hashKeyMap = {};
    this.idKeyMap = {};
    this.pools = {};
    this._mapperNames = new Set();
  }

  async getPool(id, onCreate) {
    return datasourceRuntime.getPool(this, id, onCreate);
  }
  async getConnection(req, mapper, force = false) {
    return datasourceRuntime.getConnection(this, req, mapper, force);
  }

  async query(req, command, mapper) {
    return datasourceRuntime.query(this, req, command, mapper);
  }

  getKeyHash(key) {
    if (!this.idKeyMap[`_${key}`]) {
      const hash = getSHA256Hash(key);
      this.hashKeyMap[`_${hash}`] = key;
      this.idKeyMap[`_${key}`] = hash;
      return hash;
    }
    return this.idKeyMap[`_${key}`];
  }

  getHashKey(hash) {
    return this.hashKeyMap[`_${hash}`];
  }

  close(req) {
    datasourceRuntime.closeDatasource(this, req);
  }

  async loadQueries(options = {}) {
    const tasks = this.queries
      ? Object.entries(this.queries).map(([key, value]) => {
          value.name = value.name ?? key;
          return this.loadQuery(value, options);
        })
      : [];
    return Promise.all(tasks);
  }

  async loadQuery(queryObject, options = {}) {
    if (typeof queryObject === "object") {
      advancedConsole.asyncConsole.log(
        "datasources",
        ' - init mapperCase "' + queryObject.name + '" {'
      );
      const nextMapper = new DatasourceRequestMapper(
        this.aReS,
        this,
        queryObject
      );
      const isNewMapper = !(this[queryObject.name] instanceof DatasourceRequestMapper);
      this[queryObject.name] = isNewMapper
        ? nextMapper
        : syncExistingMapper(this[queryObject.name], nextMapper);
      this._mapperNames = this._mapperNames ?? new Set();
      this._mapperNames.add(queryObject.name);
      if (
        (isNewMapper || options.forceOnMapperLoaded === true) &&
        this.onMapperLoaded &&
        typeof this.onMapperLoaded === "function"
      ) {
        await this.onMapperLoaded(this.aReS, this[queryObject.name], this);
      }
      return true;
    }
    return false;
  }

  disableQuery(queryName) {
    if (!(this[queryName] instanceof DatasourceRequestMapper)) return false;
    this[queryName].disabled = true;
    this[queryName].query = undefined;
    return true;
  }
}


export { defaultConnectionCallback, DBConnection, SQLDBConnection, RESTConnection };
