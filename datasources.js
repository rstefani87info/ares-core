/**
 * @author Roberto Stefani
 * @license MIT
 */

import { nanoid } from "nanoid";
import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import { XHRWrapper } from "./xhr.js";
import { getDockletAnnotations } from "./scripts.js";
import { getSHA256Hash } from "./crypto.js";
import * as advancedConsole from "./console.js";

const mapRequestOrResult = function (request) {
  return request;
};
const REQUEST_RUNTIME_CONTEXT_KEY = Symbol("aReS.datasource.requestContext");
let fallbackSessionIdCounter = 0;

function normalizeRequest(request) {
  return request && typeof request === "object" ? request : {};
}

function resolveRequestRuntimeContext(request) {
  const normalizedRequest = normalizeRequest(request);
  const existingContext = normalizedRequest[REQUEST_RUNTIME_CONTEXT_KEY] ?? {};
  const sessionIdCandidate =
    normalizedRequest.session?.id ??
    normalizedRequest.sessionId ??
    normalizedRequest.headers?.["x-session-id"] ??
    existingContext.sessionId;

  const sessionId =
    sessionIdCandidate !== undefined && sessionIdCandidate !== null && `${sessionIdCandidate}`.trim() !== ""
      ? String(sessionIdCandidate)
      : `anonymous-${++fallbackSessionIdCounter}`;

  const context = {
    ...existingContext,
    sessionId,
  };

  normalizedRequest[REQUEST_RUNTIME_CONTEXT_KEY] = context;
  return { request: normalizedRequest, sessionId };
}

function isDatasourceAllowed(aReS, datasourceName, request) {
  if (typeof aReS?.isResourceAllowed !== "function") {
    return true;
  }

  return aReS.isResourceAllowed(datasourceName, request);
}

function getSessionLogLabel(sessionId) {
  return String(sessionId).substring(0, 10) + "...";
}

export const defaultConnectionCallback = (error) => {
  if (error) throw error;
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

class DBConnection {
  constructor(
    connectionParameters,
    datasource,
    sessionId,
    connectionSettingName,
    isProduction = false  
  ) {
    Object.assign(this, connectionParameters);
    this.datasource = datasource;
    this.sessionId = sessionId;
    this.name = connectionSettingName;
    this.isProduction = isProduction;
  }
  async nativeConnect(callback = defaultConnectionCallback) {
    throw new Error(
      "Missing " + this.constructor.name + " nativeConnect implementation!"
    );
  }
  async setPool() {
    const thisInstance = this;
    this.pool = await thisInstance.datasource.getPool(
      thisInstance.connectionSettingName,
      () => thisInstance.createPool()
    );
  }
  async createPool(connectionSettingName) {
    throw new Error(
      "Missing " + this.constructor.name + " createPool implementation!"
    );
  }
}

export class SQLDBConnection extends DBConnection {
  constructor(
    connectionParameters,
    datasource,
    sessionId,
    connectionSettingName,
    isProduction = false
  ) {
    super(connectionParameters, datasource, sessionId, connectionSettingName, isProduction);
  }

  insert(type, parameters) {
    const fields = [];
    const values = [];
    const newParams = [];
    Object.keys(parameters).forEach((key) => {
      fields.push(key);
      const newValue = this.checkInnerQuery(parameters[key]);
      values.push(newValue);
      if (newValue === "?") newParams.push(parameters[key]);
    });
    const command =
      "INSERT INTO " +
      type +
      " (" +
      fields.join(",") +
      ") VALUES (" +
      values.join(",") +
      ")";
    return {
      command,
      parameters: newParams,
    };
  }

  update(type, parameters) {
    const fields = [];
    const newParams = [];

    // Genera la parte SET della query
    Object.keys(parameters.values).forEach((key) => {
      const newValue = this.checkInnerQuery(parameters.values[key]);
      fields.push(`${key}=${newValue}`);
      if (newValue === "?") newParams.push(parameters.values[key]);
    });

    let command = `UPDATE ${type} SET ${fields.join(",")}`;

    // Gestione della clausola WHERE
    if (parameters.filter) {
      command += " WHERE ";
      if (typeof parameters.filter === "object") {
        command += Object.entries(parameters.filter)
          .map(([key, value]) => {
            const newValue = this.checkInnerQuery(value);
            if (newValue === "?") newParams.push(value);
            return `${key}=${newValue}`;
          })
          .join(" AND ");
      } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
        const filter = this.filterBy(...parameters.filter);
        command += filter.command;
        newParams.push(...filter.parameters);
      } else if (typeof parameters.filter === "string") {
        command += parameters.filter;
      }
    }

    return {
      command,
      parameters: newParams,
    };
  }

  delete(type, parameters) {
    let command = `DELETE FROM ${type}`;
    return executeFilteredAction(command, parameters);
  }

  executeFilteredAction(command, parameters) {
    const newParams = [];
    if (parameters.filter) {
      command += " WHERE ";
      if (typeof parameters.filter === "object") {
        command += Object.entries(parameters.filter)
          .map(([key, value]) => {
            const newValue = this.checkInnerQuery(value);
            if (newValue === "?") newParams.push(value);
            return `${key}=${newValue}`;
          })
          .join(" AND ");
      } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
        const filter = this.filterBy(...parameters.filter);
        command += filter.command;
        newParams.push(...filter.parameters);
      } else if (typeof parameters.filter === "string") {
        command += parameters.filter;
      }
    }
    return {
      command,
      parameters: newParams,
    };
  }

  filterBy(...filters) {
    let groups = 0;
    const newParams = [];
    const command = filters
      .map((x) => {
        let ret = "x.expression";
        if (x.expression.match(/(\s\n\r){1,}BETWEEN(\s\n\r)*$/gi)) {
          newParams.push(
            this.checkInnerQuery(x.value[0]),
            this.checkInnerQuery(x.value[1])
          );
          ret += " BETWEEN ? AND ?";
        } else if (x.expression.match(/(\s\n\r){1,}IN(\s\n\r)*$/gi)) {
          newParams.push(x.value);
          ret += Array.isArray(x.value)
            ? (x.value.length > 1 ? " (" : " ") +
              x.value.map(this.checkInnerQuery).join(",") +
              (x.value.length > 1 ? ")" : "")
            : ("(" + this.checkInnerQuery(x.value) + ")")
                .replace(/^\(\(/g, "(")
                .replace(/\)\)$/g, ")");
        } else {
          newParams.push(this.checkInnerQuery(x));
          ret = x.expression + "?";
        }
        if (x.startGroup) {
          groups++;
          ret = " ( " + ret;
        }
        if (x.endGroup) {
          groups--;
          ret = ret + " ) ";
        }
        return ret;
      })
      .join(" ");
    return { command, parameters: newParams };
  }

  checkInnerQuery(parameter) {
    if (parameter && typeof parameter === "object" && "query" in parameter) {
      return "(" + parameter.query + ")";
    }
    return "?";
  }

  handleAnnotationTransformations(command, parameters) {
    let dockletMatch;
    let newParameters = [];
    const dockletRegex = /\/\*\*([\s\S]*?)\*\//;

    while ((dockletMatch = command.match(dockletRegex))) {
      const fullMatch = dockletMatch[0];
      const dockletContent = dockletMatch[1];
      const annotations = getDockletAnnotations(dockletContent);
      let generatedCommand = "";

      annotations.forEach((x) => {
        if (this[x.annotation] && typeof this[x.annotation] === "function") {
          const resolvedAnnotation = this[x.annotation](parameters);
          newParameters.push(...resolvedAnnotation.parameters);
          generatedCommand += (resolvedAnnotation?.command ?? "") + "\n";
        }
      });

      // Replace with single-star comment to avoid infinite matching
      command = command.replace(
        fullMatch,
        "/* [PROCESSED] " + dockletContent + " */\n" + generatedCommand
      );
    }
    if (newParameters.length === 0) newParameters = parameters;
    return {
      command,
      parameters: newParameters,
    };
  }
  async _executeNativeQueryAsync(command, params, mapper, req) {
    const newCommand = this.handleAnnotationTransformations(command, params);
    return await this.executeNativeQueryAsync(
      newCommand.command,
      newCommand.parameters
    );
  }
}

export class RESTConnection extends DBConnection {
  constructor(
    connectionParameters,
    datasource,
    sessionId,
    connectionSettingName,
    isProduction = false
  ) {
    super(connectionParameters, datasource, sessionId, connectionSettingName, isProduction);
    this.networkingConfig = this.datasource?.aReS?.getConfig?.("networking.http", {}) ?? {};
    this.xhrWrapper = new XHRWrapper(this.host, sessionId, isProduction, this.networkingConfig);
  }

  async createPool() {
    return null;
  }

  async nativeConnect(callback) {
    this.xhrWrapper = new XHRWrapper(this.host, null, this.isProduction, this.networkingConfig);
    return this;
  }

  async _executeNativeQueryAsync(command, params, mapper, req) {
    if (mapper.isJWTSensible && mapper.getRESTApiToken)
      this.xhrWrapper.setToken(
        mapper.getRESTApiToken(req, this.datasource, this.datasource.aReS)
      );
    else if (mapper.isJWTSensible && !mapper.getRESTApiToken)
      throw new Error(
        `For Mapper: ${mapper.name} When a mapper has isJWTSensible = true, it needs to implement getRESTApiToken(req, datasource, aReS) function`
      );
    else this.xhrWrapper.setToken(null);
    return await this.executeNativeQueryAsync(
      { url: command, method: mapper.method },
      params,
      req.options
    );
  }

  async executeNativeQueryAsync(command, params, options = null) {
    command = typeof command === "string" ? JSON.parse(command) : command;
    if (!(command instanceof Object)) {
      throw new Error("Command must be an object or a stringified object");
    }
    const date = new Date();
    const response = {
      executionTime: date.getTime(),
      executionDateTime: date,
    };
    const responseValue = await this.xhrWrapper[
      command.method?.toLowerCase() || "get"
    ](command.url, params, options);
    response.response = responseValue;
    response.status = responseValue.status;
    response.message = responseValue.message;
    response.url = responseValue.url;
    response.results = responseValue.results;
    if (responseValue["€rror"]) {
      response["€rror"] = responseValue["€rror"];
    }
    return response;
  }
}
