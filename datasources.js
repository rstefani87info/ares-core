/**
 * @author Roberto Stefani
 * @license MIT
 */

import { v4 as uuidv4 } from "uuid";
import { asyncConsole } from "./console.js";
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
  asyncConsole.log("datasource ", JSON.stringify(datasourceSettings));
  const datasourceName = datasourceSettings.name.toLowerCase();
  aReS.datasourceMap = aReS.datasourceMap ?? {};
  force = force || !(datasourceName in aReS.datasourceMap);
  if (force) {
    asyncConsole.log("datasources", 'init db "' + datasourceName + '" {');
    aReS.datasourceMap[datasourceName] = new Datasource(
      aReS,
      datasourceSettings
    );
    aReS.datasourceMap[datasourceName].onMapperLoaded = onMapperLoaded;
    aReS.datasourceMap[datasourceName].loadQueries();
    asyncConsole.log("datasources", "}");
  }
  return aReS.datasourceMap[datasourceName];
}

export function exportAsAresMethod(aReS, mapper, datasource) {
  asyncConsole.log(
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
  asyncConsole.log("datasources", " - }");
}

export class DatasourceRequestMapper {
  constructor(aReS, datasource, settings) {
    if (typeof settings === "object") Object.assign(this, settings);
    this.datasource = datasource;
    this.aReS = aReS;
    if (!settings.name) this.name = uuidv4();
    if (!this.mapParameters) this.mapParameters = mapRequestOrResult;
    if (!this.mapResult) this.mapResult = mapRequestOrResult;
    if (!this.methods) this.methods = ".*";
  }

  async execute(request) {
    console.log(
      "called database: " +
        this.datasource.name +
        "[" +
        request.session.id +
        "] : <<" +
        this.query +
        ">>"
    );
    let params = {};
    params = await format(
      request,
      this.parametersValidationRoles? await this.parametersValidationRoles(request, this.aReS): {},
      this.datasource
    );
    console.log("params:", params);
    if (params["€rror"]) {
      console.error('aReS Error:',params["€rror"]);
      console.error("Stack trace:", error.stack);
      throw new Error(
        "Formatting and validation error: " + JSON.stringify(params["€rror"])
      );
    }
    request = cloneWithMethods(request);
    request.parameters = params;
    console.log("in query");
    const response = await this.datasource.query(
      request,
      this.query,
      this
    );
    if (response.results) {
      if(this.objectify){
        throw new Error('TODO:  implement me!');
      }
      if (Array.isArray(response.results)) {
        if (this.mapResult && this.mapResult instanceof Function) {
          let i=0;
          for(; i<response.results.length; i++){
            response.results[i] = await this.mapResult(response.results[i], i);
          }
        }
        if (this.transformToDTO && this.transformToDTO instanceof Function) {
          result = await this.transformToDTO(result);
        }
      } else {
        response.results = this.mapResult(response.results);
      }
      
      if (this.postExecute && this.mapResult instanceof Function) {
        this.postExecute(request, this.datasource, response);
      }
    }
    if (!this.aReS.isProduction()) {
      response.datasourceName = this.datasource.name;
      response.queryName = this.name;
      response.query = this.query;
      response.params = params;
      response.session = request.session.id;
      console.log(
        this.datasource.name + "[" + request.session.id + "] ",
        JSON.stringify(response)
      );
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
    const thisInstance = this;
    if (!connection || !connection.isOpen) {
      connection = await this.getConnection(req, mapper);
      if (!connection.isOpen) throw new Error("connection is not open");
    }
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
      const params = await mapper.mapParameters(req, thisInstance.aReS, connection) ;
      console.log("executing query", command, params);
      const ret = await connection._executeNativeQueryAsync(command, params,mapper);
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
      console.error("Stack trace:", err.stack);
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
    if (!this.idKeyMap[key]) {
      const hash = getSHA256Hash(key);
      this.hashKeyMap = { hash: key };
      this.idKeyMap = { key: hash };
      return hash;
    }
    return this.idKeyMap[key];
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
      asyncConsole.log(
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
    const newParams = [];

    let command = `DELETE FROM ${type}`;

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
    const newParameters = [];
    while ((docklet = getDocklet(command) ?? "") !== "") {
      const annotations = getDockletAnnotations(docklet);
      annotations.forEach((x) => {
        if (this[x.annotation] && typeof this[x.annotation] === "function") {
          const resolvedAnnotation = this[x.annotation](parameters);
          newParameters.join(resolvedAnnotation.parameters);
        }
        command = command.replace(
          docklet,
          docklet + "\n-- docklet generated\n" + resolvedAnnotation.command
        );
      });
    }
    console.log("new command:", command);
    return {
      command,
      parameters: newParameters,
    };
  }
  // _executeQuerySync(command, params, callback) {
  //   const newCommand = this.handleAnnotationTransformations(command);
  //   console.debug(
  //     "executeQuerySync: " + newCommand.command + " " + newCommand.parameters
  //   )
  //   return this.executeQuerySync(
  //     newCommand.command,
  //     newCommand.parameters,
  //     callback
  //   );
  // }
  async _executeNativeQueryAsync(command, params, mapper) {
    const newCommand = this.handleAnnotationTransformations(command, params);
    console.log("newCommand:", newCommand);
    return await this.executeNativeQueryAsync(
      newCommand.command,
      newCommand.parameters
      // callback
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
    this.xhrWrapper = new XHRWrapper(this.host,this.sessionId);
    return this;
  }

  async _executeNativeQueryAsync(command, params, mapper) {
    console.log("new command:", command);
    return await this.executeNativeQueryAsync(
      {url:command, method:mapper.method},
      params
    );
  }

  async executeNativeQueryAsync(command, params) {
    command = typeof command === "string" ? JSON.parse(command) : command;
    if (!(command instanceof Object)) {
      throw new Error("Command must be an object or a stringified object");
    }
    const date = new Date();
    const response = { 
      executionTime: date.getTime(), 
      executionDateTime: date,
      data: await this.xhrWrapper[command.method?.toLowerCase()||'get'](
        command.url,
        params
      )
    };
    console.log('response',response);
    return response;
  }
}
