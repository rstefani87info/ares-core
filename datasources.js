/**
 * @author Roberto Stefani
 * @license MIT
 */

import { nanoid } from "nanoid";
import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import { getSHA256Hash } from "./crypto.js";
import * as advancedConsole from "./console.js";
import {
  resolveRequestRuntimeContext,
  isDatasourceAllowed,
  getSessionLogLabel,
} from "./datasource-execution-context.js";
import { defaultConnectionCallback, DBConnection } from "./db-connection.js";
import { SQLDBConnection } from "./sql-db-connection.js";
import { RESTConnection } from "./rest-connection.js";

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

export class ValidationError extends Error {
  constructor(message, params) {
    super(message);
    this.name = "ValidationError";
    this.parameters = params;
  }
}
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
    advancedConsole.log(`[DEBUG] execute: start - ${this.name}`);
    const params = await this._prepareParams(request);

    request = cloneWithMethods(request);
    request.parameters = params;
    advancedConsole.log("in query");

    const response = await this._runQuery(request);

    await this._processResponse(response, request);

    if (this.postExecute && this.postExecute instanceof Function) {
      advancedConsole.log(`[DEBUG] execute: postExecute - ${this.name}`);
      this.postExecute(request, this.datasource, response);
    }

    this._addDebugInfo(response);
    this._attachHelpers(response);

    advancedConsole.log("Mapped results:", response);
    advancedConsole.log(`[DEBUG] execute: end - ${this.name}`);

    return response;
  }

  async _prepareParams(request) {
    advancedConsole.log(`[DEBUG] _prepareParams: start - ${this.name}`);
    const validationRoles =
      this.parametersValidationRoles instanceof Function
        ? await this.parametersValidationRoles(request, this.aReS)
        : {};

    const params = await format(request, validationRoles, this.datasource);
    advancedConsole.log(`[DEBUG] _prepareParams: format - ${this.name}`, params);
    if (params["€rror"]) {
      advancedConsole.error("aReS Error:", params["€rror"], request.query);
      throw new ValidationError(
        "Formatting and validation error: " + JSON.stringify(params["€rror"]),
        params["€rror"]
      );
    }
    advancedConsole.log(`[DEBUG] _prepareParams: end - ${this.name}`, params);
    return params;
  }

  async _runQuery(request) {
    advancedConsole.log(`[DEBUG] _runQuery: start - ${this.name}`);
    let response = {results:[]};
    if (typeof this.query === "string") {
      response = await this.datasource.query(request, this.query, this);
    }
    else if (typeof this.query === "function") {
      response = await this.datasource.query(request, await this.query(request,this), this);
    } 
    if (!response) {
      throw new Error("Query returned no response");
    }
    advancedConsole.log(`[DEBUG] _runQuery: end - ${this.name}`, response);
    return response;
  }

  async _processResponse(response, request) {
    advancedConsole.log(`[DEBUG] _processResponse: start - ${this.name}`);
    if (response["€rror"]) {
      advancedConsole.log(`[DEBUG] _processResponse: error found - ${this.name}`);
      return;
    }

    if (
      !response.results ||
      (Array.isArray(response.results) && response.results.length === 0)
    ) {
      advancedConsole.log(`[DEBUG] _processResponse: empty result - ${this.name}`);
      this.onEmptyResult?.(response, request, this.aReS);
      return;
    }

    if (Array.isArray(response.results)) {
      advancedConsole.log(`[DEBUG] _processResponse: mapping array (${response.results.length}) - ${this.name}`);
      for (let i = 0; i < response.results.length; i++) {
        response.results[i] = await this._mapSingleResult(
          response.results[i],
          i,
          request
        );
      }
    } else {
      advancedConsole.log(`[DEBUG] _processResponse: mapping single object - ${this.name}`);
      response.results = await this._mapSingleResult(
        response.results,
        0,
        request
      );
    }
    advancedConsole.log(`[DEBUG] _processResponse: end - ${this.name}`);
  }

  async _mapSingleResult(item, index, request) {
     advancedConsole.log(`[DEBUG] _mapSingleResult: start - ${this.name} [${index}]`);
    let result = item;
    if (this.mapResult && this.mapResult instanceof Function) {
      result = await this.mapResult(result, index, request, this.aReS);
    }
    if (this.transformToDTO && this.transformToDTO instanceof Function) {
      result = await this.transformToDTO(result, index, request, this.aReS);
    }
    return result;
  }

  _addDebugInfo(response) {
    if (!this.aReS.isProduction) {
      response.datasourceName = this.datasource.name;
      response.queryName = this.name;
      response.query = this.query;
    }
  }

  _attachHelpers(response) {
    response.getResultsData = () => {
      if (response?.results?.data?.length > 0) {
        if (response.results.data[0]["@type"] === "ares-rest-response") {
          return response.results.data[0].results.results;
        }
        return response.results.data;
      }
      return response.results;
    };
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
    this.pools[id] = this.pools[id] ?? (await onCreate());
    return this.pools[id];
  }
  async getConnection(req, mapper, force = false) {
    const { request, sessionId } = resolveRequestRuntimeContext(req);
    const canAccessDatasource = isDatasourceAllowed(this.aReS, this.name, request);

    advancedConsole.debug(
      "Datasource: " + this.name + " - connecting: " + mapper.connectionSetting,
      canAccessDatasource
    );
    if (canAccessDatasource) {
      const env =
        this.environments[this.aReS.isProduction ? "production" : "test"];
      const connectionSetting = env[mapper.connectionSetting];
      if (force || !this.sessions[sessionId]) {
        this.sessions[sessionId] = this.sessions[sessionId] ?? {};
      }
      if (force || !this.sessions[sessionId][mapper.connectionSetting]) {
        const driverConstructor = connectionSetting.driver;
        this.sessions[sessionId][mapper.connectionSetting] =
          new driverConstructor(
            connectionSetting,
            this,
            sessionId,
            mapper.connectionSetting,
            this.aReS.isProduction
          );
      }
      if (!this.sessions[sessionId][mapper.connectionSetting].pool) {
        await this.sessions[sessionId][mapper.connectionSetting].setPool();
      }
      await this.sessions[sessionId][
        mapper.connectionSetting
      ].nativeConnect(defaultConnectionCallback);
      this.sessions[sessionId][mapper.connectionSetting].isOpen = true;
      return this.sessions[sessionId][mapper.connectionSetting];
    }
    throw new Error("Can not establish connection!");
  }

  async query(req, command, mapper) {
    const connection = await this._ensureConnection(req, mapper);
    const { isTransaction, transactionName } = this._setupTransaction(
      req,
      mapper,
      connection
    );

    try {
      const ret = await this._executeQuery(req, command, mapper, connection);

      if (isTransaction) {
        this._commitTransaction(req, connection, transactionName);
      }
      return ret;
    } catch (err) {
      advancedConsole.error("aReS Error:", err);
      if (isTransaction) {
        this._rollbackTransaction(req, connection, transactionName);
      }
      return { "€rror": err };
    }
  }

  async _ensureConnection(req, mapper) {
    const { request, sessionId } = resolveRequestRuntimeContext(req);
    let connection = this.sessions[sessionId]
      ? this.sessions[sessionId][mapper.connectionSetting]
      : undefined;
    advancedConsole.debug("verifying connection");

    if (!connection || !connection.isOpen) {
      connection = await this.getConnection(request, mapper);
      if (!connection.isOpen) {
        advancedConsole.error("connection is not open");
        throw new Error("connection is not open");
      }
    }
    advancedConsole.debug("verified connection", true);
    return connection;
  }

  _setupTransaction(req, mapper, connection) {
    const { request, sessionId } = resolveRequestRuntimeContext(req);
    const isTransaction =
      (mapper.transaction === true || mapper.transaction === 1) &&
      connection.startTransaction &&
      connection.commit &&
      connection.rollback;

    request.transactionIndex = request.transactionIndex ? request.transactionIndex + 1 : 0;
    request.executedTransactionSteps = request.executedTransactionSteps ?? [];
    const transactionName = mapper.name + "[" + request.transactionIndex + "]";
    request.executedTransactionSteps.push(transactionName);

    if (isTransaction) {
      advancedConsole.debug(
        "called database transaction: " +
          this.name +
          "[" +
          sessionId +
          "]"
      );
      connection.startTransaction(transactionName);
    }
    return { isTransaction, transactionName };
  }

  async _executeQuery(req, command, mapper, connection) {
    const { request, sessionId } = resolveRequestRuntimeContext(req);
    advancedConsole.debug(
      "executing query: " +
        this.name +
        "[" +
        getSessionLogLabel(sessionId) +
        "]",
      request.params,
      request.parameters
    );
    const params = mapper.mapParameters
      ? await mapper.mapParameters(request, this.aReS, connection)
      : {};
    advancedConsole.debug("executing query with params:", params);
    const ret = await connection._executeNativeQueryAsync(
      command,
      params,
      mapper,
      request
    );
    advancedConsole.debug("query results", ret);
    return ret;
  }

  _commitTransaction(req, connection, transactionName) {
    const { sessionId } = resolveRequestRuntimeContext(req);
    advancedConsole.debug(
      "commit database transaction: " +
        this.name +
        "[" +
        getSessionLogLabel(sessionId) +
        "]"
    );
    connection.commit(transactionName);
  }

  _rollbackTransaction(req, connection, transactionName) {
    const { sessionId } = resolveRequestRuntimeContext(req);
    advancedConsole.debug(
      "rollback database transaction: " +
        this.name +
        "[" +
        getSessionLogLabel(sessionId) +
        "]"
    );
    connection.rollback(transactionName);
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
    for (const sessionId in this.sessions) {
      for (const connName in this.sessions[sessionId]) {
        const conn = this.sessions[sessionId][connName];
        if (conn && conn.isOpen) {
          conn.nativeDisconnect();
        }
      }
    }
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
