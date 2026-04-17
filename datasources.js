/**
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
  force = force || !(datasourceName in aReS.datasourceMap);
  if (force) {
    advancedConsole.asyncConsole.log(
      "datasources",
      'init db "' + datasourceName + '" {'
    );
    aReS.datasourceMap[datasourceName] = new Datasource(
      aReS,
      datasourceSettings
    );
    aReS.datasourceMap[datasourceName].onMapperLoaded = onMapperLoaded;
    aReS.datasourceMap[datasourceName].loadQueries();
    advancedConsole.asyncConsole.log("datasources", "}");
  }
  return aReS.datasourceMap[datasourceName];
}

export function aReSInitialize(aReS) {
  aReS.loadDatasource = (datasourceSettings, onMapperLoaded, force = false) =>
    loadDatasource(aReS, datasourceSettings, onMapperLoaded, force);
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
    return executeDatasourceRequestMapper(this, request);
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

  loadQueries() {
    const thisDatasource = this;
    return this.queries
      ? Object.entries(this.queries).map(([key, value]) => {
          value.name = value.name ?? key;
          return thisDatasource.loadQuery(value);
        })
      : [];
  }

  async loadQuery(queryObject) {
    if (typeof queryObject === "object") {
      advancedConsole.asyncConsole.log(
        "datasources",
        ' - init mapperCase "' + queryObject.name + '" {'
      );
      this[queryObject.name] = new DatasourceRequestMapper(
        this.aReS,
        this,
        queryObject
      );
      if (this.onMapperLoaded && typeof this.onMapperLoaded === "function") {
        await this.onMapperLoaded(this.aReS, this[queryObject.name], this);
      }
      return true;
    }
    return false;
  }
}


export { defaultConnectionCallback, DBConnection, SQLDBConnection, RESTConnection };
