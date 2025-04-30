/**
 * @author Roberto Stefani
 * @license MIT
 */

import { nanoid  } from "nanoid";
import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import { XHRWrapper } from "./xhr.js";
import { getDocklet, getDockletAnnotations } from "./scripts.js";
import { getSHA256Hash } from "./crypto.js";

const mapRequestOrResult = function (request) {
  return request;
};

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
  aReS.console.asyncConsole.log("datasource ", JSON.stringify(datasourceSettings));
  const datasourceName = datasourceSettings.name.toLowerCase();
  aReS.datasourceMap = aReS.datasourceMap ?? {};
  force = force || !(datasourceName in aReS.datasourceMap);
  if (force) {
    aReS.console.asyncConsole.log("datasources", 'init db "' + datasourceName + '" {');
    aReS.datasourceMap[datasourceName] = new Datasource(
      aReS,
      datasourceSettings
    );
    aReS.datasourceMap[datasourceName].onMapperLoaded = onMapperLoaded;
    aReS.datasourceMap[datasourceName].loadQueries();
    aReS.console.asyncConsole.log("datasources", "}");
  }
  return aReS.datasourceMap[datasourceName];
}

export function exportAsAresMethod(aReS, mapper, datasource) {
  aReS.console.asyncConsole.log(
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
    aReS.console.asyncConsole.log("datasources", " - }");
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
    if (!typeof this?.mapParameters === 'function' ) this.mapParameters = mapRequestOrResult;
    if (!typeof this?.mapResult === 'function') this.mapResult = mapRequestOrResult;
    if (!typeof this?.onEmptyResult === 'function') this.onEmptyResult = (res)=>{};
    if (!this?.methods) this.methods = "GET";
  }

  async execute(request) {
    console.log(
      "called database: " +
        this.datasource.name +
        "[" +
        request.session.id +
        "] : <<" +
        this.query.toString() +
        ">>"
    );
    let params = {};
    let response = {};
    params = await format(
      request,
      this.parametersValidationRoles instanceof Function? await this.parametersValidationRoles(request, this.aReS): {},
      this.datasource
    );
    if (params["€rror"]) {
      console.error('aReS Error:',params["€rror"]);
      throw new ValidationError(
        "Formatting and validation error: " + JSON.stringify(params["€rror"]),params["€rror"]
      );
    } else {
      request = cloneWithMethods(request);
      request.parameters = params;
      console.log("in query");
      response = typeof this.query === "string" ? await this.datasource.query(
        request,
        this.query,
        this
      ): (typeof this.query === "function" ? await this.query(request, this.aReS): this.query);
      if(!response.results || (Array.isArray(response.results) && response.results.length === 0)){
        this.onEmptyResult(response,request,this.aReS);
      }else if (response.results) {
        if (Array.isArray(response.results) && response.results.length > 0) {
          for(let i=0; i<response.results.length; i++){
            if (this.mapResult && this.mapResult instanceof Function) {
              response.results[i] = await this.mapResult(response.results[i],  i, request,this.aReS);
            }
            if (this.transformToDTO && this.transformToDTO instanceof Function) {
              response.results[i] = await this.transformToDTO(response.results[i], i, request,this.aReS);
            }
          }
        }
        else if(response.mapResult && response.mapResult instanceof Function){
          response.results = await this.mapResult(response.results, 0, request, this.aReS);
          if (this.transformToDTO && this.transformToDTO instanceof Function) {
            response.results = await this.transformToDTO(response.results, 0, request,this.aReS);
          }
        }
      }
    }
    if (this.postExecute && this.postExecute instanceof Function) {
      this.postExecute(request, this.datasource, response);
    }
    
    if (!this.aReS.isProduction()) {
      response.datasourceName = this.datasource.name;
      response.queryName = this.name;
      response.query = this.query;
    }
    
    response.getResultsData = () => {
      if(response?.results?.data?.length > 0){
        if(response.results.data[0]["@type"]==="ares-rest-response"){
          return response.results.data[0].results.results;
        }
        return response.results.data;
      }
      return response.results;
    }
    console.log("Mapped results:", response);

    return response;
  }
}
export class Datasource {
  constructor(aReS, dbConfig) {
    if (typeof dbConfig === "object") Object.assign(this, dbConfig);
    this.aReS = aReS;
    this.sessions = {};
    this.hashKeyMap = {};
    this.idKeyMap = {};
    this.pools={}
  }

  async getPool(id,onCreate){
    this.pools[id] = this.pools[id] ?? await onCreate();
    return this.pools[id];
  }
  async getConnection(req, mapper, force = false) {
    console.log(
      "Datasource: " + this.name + " - connecting: " + mapper.connectionSetting,this.aReS.permissions.isResourceAllowed(this.name, req)
    )
    if (this.aReS.permissions.isResourceAllowed(this.name, req)) {
      const env =
        this.environments[this.aReS.isProduction() ? "production" : "test"];
      const connectionSetting = env[mapper.connectionSetting];
      if (force || !this.sessions[req.session.id]) {
        this.sessions[req.session.id] = this.sessions[req.session.id] ?? {};
      }
      if (force || !this.sessions[req.session.id][mapper.connectionSetting]) {
        
        const driverConstructor = connectionSetting.driver;
        this.sessions[req.session.id][mapper.connectionSetting] =
          new driverConstructor(
            connectionSetting,
            this,
            req.session.id,
            mapper.connectionSetting
          );
        
      }
      if(! this.sessions[req.session.id][
        mapper.connectionSetting
      ].pool) {await this.sessions[req.session.id][
        mapper.connectionSetting
      ].setPool();}
      await this.sessions[req.session.id][
        mapper.connectionSetting
      ].nativeConnect(defaultConnectionCallback);
      this.sessions[req.session.id][mapper.connectionSetting].isOpen = true;
      return this.sessions[req.session.id][mapper.connectionSetting];
    }
    throw new Error('Can not establish connection!');
  }

  async query(
    req,
    command,
    mapper
  ) {
    let connection = this.sessions[req.session.id]? this.sessions[req.session.id][mapper.connectionSetting] : undefined;
    console.log("verifying connection");
    const thisInstance = this;
    if (!connection || !connection.isOpen) {
      connection = await this.getConnection(req, mapper);
      if (!connection.isOpen) {
        console.error("connection is not open");
        throw new Error("connection is not open");
      }
    }
    console.log("verified connection", true);
    const isTransaction =
      (mapper.transaction === true || mapper.transaction === 1) &&
      connection.startTransaction &&
      connection.commit &&
      connection.rollback;
    req.transactionIndex = req.transactionIndex ? req.transactionIndex + 1 : 0;
    req.executedTransactionSteps = req.executedTransactionSteps ?? [];
    const transactionName = mapper.name + "[" + req.transactionIndex + "]";
    req.executedTransactionSteps.push(transactionName);
    if (isTransaction) {
      console.log(
        "called database transaction: " +
          thisInstance.name +
          "[" +
          req.session.id +
          "]"
      );
      connection.startTransaction(transactionName);
    }
    try {
      const params = mapper.mapParameters? await mapper.mapParameters(req, thisInstance.aReS, connection) : {};
      console.log("executing query", command, params);
      const ret = await connection._executeNativeQueryAsync(command, params,mapper,req);
      console.log("query results", ret);
      if (isTransaction) {
        console.log(
          "commit database transaction: " +
            thisInstance.name +
            "[" +
            req.session.id +
            "]"
        );
        connection.commit(transactionName);
      }
      return ret;
    } catch (err) {
      console.error('aReS Error:',err);
      if (isTransaction) {
        console.log(
          "rollback database transaction: " +
            thisInstance.name +
            "[" +
            req.session.id +
            "]"
        );
        connection.rollback(transactionName);
      }
      return { "€rror": err };
    }
  }

  getKeyHash(key) {
    if (!this.idKeyMap[`_${key}`]) {
      const hash = getSHA256Hash(key);
      this.hashKeyMap = { [`_${hash}`]: key};
      this.idKeyMap = { [`_${key}`]: hash };
      return hash;
    }
    return this.idKeyMap[key];
  }

  getHashKey(hash) {
    return this.idKeyMap[`_${hash}`];
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
      this.aReS.console.asyncConsole.log(
        "datasources",
        ' - init mapperCase "' + queryObject.name + '" {'
      );
      this[queryObject.name] = new DatasourceRequestMapper(this.aReS, this, queryObject);
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
    connectionSettingName
  ) {
    Object.assign(this, connectionParameters);
    this.datasource = datasource;
    this.sessionId = sessionId;
    this.name = connectionSettingName;
    
  }
  async nativeConnect(callback = defaultConnectionCallback) {
    throw new Error(
      "Missing " + this.constructor.name + " nativeConnect implementation!"
    );
  }
  async setPool() {
    const thisInstance = this;
    this.pool = await thisInstance.datasource.getPool(thisInstance.connectionSettingName, () => thisInstance.createPool());
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
    connectionSettingName
  ) {
    super(connectionParameters, datasource, sessionId, connectionSettingName);
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
    }
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
    if (typeof parameter === "object" && "query" in parameter) {
      return "(" + query + ")";
    }
    return "?";
  }

  handleAnnotationTransformations(command, parameters) {
    let docklet = "";
    let newParameters = [];
    while ((docklet = getDocklet(command) ?? "") !== "") {
      const annotations = getDockletAnnotations(docklet);
      annotations.forEach((x) => {
        if (this[x.annotation] && typeof this[x.annotation] === "function") {
          const resolvedAnnotation = this[x.annotation](parameters);
          newParameters.push(...resolvedAnnotation.parameters);
        }
        command = command.replace(
          docklet,
          docklet + "\n-- docklet generated\n" + (resolvedAnnotation?.command ??'')
        );
      });
    }
    if(newParameters.length===0) newParameters = parameters;
    console.log("new command:", command);
    return {
      command,
      parameters: newParameters,
    };
  }
  async _executeNativeQueryAsync(command, params, mapper, req) {
    const newCommand = this.handleAnnotationTransformations(command, params);
    console.log("newCommand:", newCommand);
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
    connectionSettingName
  ) {
    super(connectionParameters, datasource, sessionId, connectionSettingName);
    this.xhrWrapper = new XHRWrapper(this.host,sessionId);
  }

  async nativeConnect(callback) {
    this.xhrWrapper = new XHRWrapper(this.host);
    return this;
  }

  async _executeNativeQueryAsync(command, params, mapper, req) {
    if(mapper.isJWTSensible && mapper.getRESTApiToken)
      this.xhrWrapper.setToken(mapper.getRESTApiToken(req,this.datasource,this.datasource.aReS));
    else if(mapper.isJWTSensible && !mapper.getRESTApiToken) throw new Error(`For Mapper: ${mapper.name} When a mapper has isJWTSensible = true, it needs to implement getRESTApiToken(req, datasource, aReS) function`);
    else this.xhrWrapper.setToken(null);
    return await this.executeNativeQueryAsync(
      {url:command, method:mapper.method},
      params, req.options
    );
  }

  async executeNativeQueryAsync(command, params, options=null) {
    command = typeof command === "string" ? JSON.parse(command) : command;
    if (!(command instanceof Object)) {
      throw new Error("Command must be an object or a stringified object");
    }
    const date = new Date();
    const response = { 
      executionTime: date.getTime(), 
      executionDateTime: date,
    };
    const responseValue = await this.xhrWrapper[command.method?.toLowerCase()||'get'](
      command.url,
      params,
      options
    );
    response.response = responseValue;
    response.results = responseValue.results;
    return response;
  }
}
