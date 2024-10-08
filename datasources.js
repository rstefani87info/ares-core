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
import app from "../../../app.js";
import aReS from "./index.js";
import { getSHA256Hash } from "./crypto.js";

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
  aReS[datasource.name + "_" + mapper.querySetting.name + "_" + mapper.name] = (
    req,
    res
  ) => {
    mapper.execute(req, (queryResponse) => {
      if (queryResponse.error)
        throw new Error(
          queryResponse.error + ": " + JSON.stringify([req, res])
        );
      else {
        if (mapper.transformToDTO && mapper.transformToDTO instanceof Function)
          queryResponse = mapper.transformToDTO(queryResponse);
        res.json(queryResponse);
      }
    });
  };
  asyncConsole.log("datasources", " - }");
}

export class Datasource {
  constructor(aReS, dbConfig) {
    if (typeof dbConfig === "object") Object.assign(this, dbConfig);
    this.aReS = aReS;
    this.sessions = {};
    this.hashKeyMap = {};
    this.idKeyMap = {};
  }

  getConnection(req, mapper, force = false) {
    if (this.aReS.permissions.isResourceAllowed(this.name, req)) {
      const env = this.environments[this.aReS.isProduction() ? "production" : "test"];
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
      this.sessions[req.session.id][mapper.connectionSetting].isOpen = true;
      return this.sessions[req.session.id][mapper.connectionSetting];
    }
    return null;
  }

  async query(req, command, mapper, callback, wait = false) {
    const conn = await this.getConnection(req, mapper);
    const isTransaction =
      (mapper.transaction === true || mapper.transaction === 1) &&
      conn.startTransaction &&
      conn.commit &&
      conn.rollback;
    if (isTransaction) {
      conn.startTransaction(mapper.$name);
    }
    try {
      const params = mapper.mapParameters
        ? mapper.mapParameters(req, this.aReS)
        : {};
      let ret = null;
      if (wait) ret = conn._executeQuerySync(command, params, callback);
      else ret = conn._executeNativeQueryAsync(command, params, callback);
      if (isTransaction) {
        conn.commit();
      }
      return ret;
    } catch (err) {
      console.error(err);
      if (isTransaction) {
        conn.rollback();
      }
    }
  }

  getKeyHash(key){
    if(!this.idKeyMap[key]){
      const hash = getSHA256Hash(key);
      this.hashKeyMap = {hash:key};
      this.idKeyMap = {key:hash};
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
      this[queryObject.name] = queryObject;
      await this.loadMapper(this[queryObject.name]);
      return true;
    }
    return false;
  }
  async loadMapper(mapper) {
    const db = this;
    if (!mapper.name) mapper.name = uuidv4();

    mapper.execute = function (request, callback, wait = false) {
      try {
        console.log(db.name + "[" + request.session.id + "] : " + mapper.query);
        let params = {};
        if (mapper.mapParameters) {
          params = format(
            request,
            typeof mapper.parametersValidationRoles === "function"
              ? mapper.parametersValidationRoles(request, this.aReS)
              : mapper.parametersValidationRoles,
              this
          );
          console.log("params:", params);
          if (params["€rror"]) {
            console.error(params["€rror"]);
            throw new Error(
              "Formatting and validation error: " +
                JSON.stringify(params["€rror"])
            );
          }
          request = cloneWithMethods(request);
          request.parameters = params;
        }
        console.log("in query");
        if (!mapper.mapRequest) mapper.mapRequest = mapRequestOrResult;
        if (!mapper.mapResult) mapper.mapResult = mapRequestOrResult;
        if (!mapper.methods) mapper.methods = ".*";
        const ret = db.query(
          request,
          mapper.query,
          mapper,
          (response) => {
            if (response.results) {
              if (Array.isArray(response.results))
                response.results = response.results.map((row, index) =>
                  mapper.mapResult(row, index)
                );
              else response.results = mapper.mapResult(response.results);
            }
            if (!app.isProduction) {
              response.dbName = db.name;
              response.queryName = mapper.name;
              response.query = mapper.query;
              response.params = params;
              console.log(
                db.name + "[" + request.session.id + "] ",
                JSON.stringify(response)
              );
            }
            if (callback) callback(response);
          },
          wait
        );
        console.log("Ret:", ret);
        if (mapper.postExecute) mapper.postExecute(request, this, ret);
        return ret;
      } catch (e) {
        callback({
          error: e,
          db: db.name,
          queryName: mapper.name,
        });
        console.error(e);
      }
    };
    if (this.onMapperLoaded && typeof this.onMapperLoaded === "function") {
      await this.onMapperLoaded(this.aReS, mapper, this);
    }
    return true;
  }
}

class DBConnection {
  static pool;
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
}

export class SQLDBConnection extends DBConnection {
  insert(type, parameters) {
    const fields = [];
    const values = [];
    const newParams =[];
    Object.keys(parameters).forEach((key) => {
      fields.push(key);
      const newValue = this.checkInnerQuery(parameters[key]);
      values.push(newValue);
      if(newValue==='?')newParams.push(parameters[key]);
    })
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
        if (newValue === '?') newParams.push(parameters.values[key]);
    });

    let command = `UPDATE ${type} SET ${fields.join(",")}`;

    // Gestione della clausola WHERE
    if (parameters.filter) {
        command += " WHERE ";
        if (typeof parameters.filter === 'object') {
            command += Object.entries(parameters.filter).map(([key, value]) => {
                const newValue = this.checkInnerQuery(value);
                if (newValue === '?') newParams.push(value);
                return `${key}=${newValue}`;
            }).join(" AND ");
        } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
            const filter = this.filterBy(...parameters.filter);
            command += filter.command;
            newParams.push(...filter.parameters);
        } else if (typeof parameters.filter === 'string') {
            command += parameters.filter;
        }
    }

    return {
        command,
        parameters: newParams,
    };
}

  // update(type, parameters) {
  //   const fields = [];
  //   const newParams =[];
  //   Object.keys(parameters.values).forEach((key) => {
  //     const newValue = this.checkInnerQuery(parameters[key]);
  //     fields.push(key+"="+newValue);
  //     if(newValue==='?')newParams.push(parameters[key]);
  //   })

  //   const command =
  //     "UPDATE " +
  //     type +
  //     " SET " +
  //     fields.join(",") ;
  //   if(parameters.filter) {
  //     command += " WHERE " ;
  //     if(typeof parameters.filter === 'object'){
  //       command += Object.entries(parameters.filter).map(([key, value]) => 
  //       {
  //         const newValue = this.checkInnerQuery(value);
  //         if(newValue==='?')newParams.push(value);
  //         return `${key}=${newValue}`;
  //       }
  //       ).join(" AND ");
  //     }else if(Array.isArray(parameters.filter) && parameters.filter.length){command +=" WHERE " ;
  //       const filter = this.filterBy(...parameters.filter);
  //       command+=filter.command;
  //       newParams.push(...filter.parameters);
  //     }else if (typeof parameters.filter === 'string'){
  //       command+=parameters.filter;
  //     }
  //   }
  //   return {
  //     command,
  //     parameters: newParams,
  //   };
  // }
  delete(type, parameters) {
    const newParams = [];

    let command = `DELETE FROM ${type}`;

    // Gestione della clausola WHERE
    if (parameters.filter) {
        command += " WHERE ";
        if (typeof parameters.filter === 'object') {
            command += Object.entries(parameters.filter).map(([key, value]) => {
                const newValue = this.checkInnerQuery(value);
                if (newValue === '?') newParams.push(value);
                return `${key}=${newValue}`;
            }).join(" AND ");
        } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
            const filter = this.filterBy(...parameters.filter);
            command += filter.command;
            newParams.push(...filter.parameters);
        } else if (typeof parameters.filter === 'string') {
            command += parameters.filter;
        }
    }

    return {
        command,
        parameters: newParams,
    };
}

  // delete(type, parameters) {
  //   const newParams = Object.keys(parameters).map((x) => parameters[x]);
  //   const command =
  //     "DELETE " +
  //     type +
  //     "  WHERE " ;
  //     const filter = this.filterBy(...parameters.filter);
  //     command+=filter.command;
  //     newParams.push(...filter.parameters);
  //   return {
  //     command,
  //     parameters: newParams,
  //   }; 
  // }
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
      return {command, parameters: newParams};
  }

  checkInnerQuery(parameter) {
    if (typeof parameter === "object" && "query" in parameter) {
      return "(" + query + ")";
    }
    return "?";
  }

  handleAnnotationTransformations(command, parameters) {
    let docklet = "";
    const newCommand = [];
    const newParameters = [];
    while ((docklet = getDocklet(command) ?? "") !== "") {
      const annotations = getDockletAnnotations(docklet);
      annotations.forEach((x) => {
        if (this[x.annotation] && typeof this[x.annotation] === "function") {
          const resolvedAnnotation = this[x.annotation](parameters);
          newCommand.push(resolvedAnnotation.command);
          newParameters.join(resolvedAnnotation.parameters);
        } else {
          newCommand.push("/**\n * " + docklet.toString() + "\n*/");
        }
      });
      command = command.replace(docklet, "");
    }
    return {
      command: newCommand.join("\n\n"),
      parameters: newParameters,
    };
  }
  _executeQuerySync(command, params, callback) {
    newCommand = this.handleAnnotationTransformations(command);
    console.debug(
      "executeQuerySync: " + newCommand.command + " " + newCommand.parameters
    )
    return this.executeQuerySync(
      newCommand.command,
      newCommand.parameters,
      callback
    );
  }
  async _executeNativeQueryAsync(command, params, callback) {
    newCommand = this.handleAnnotationTransformations(command);
    return this.executeNativeQueryAsync(
      newCommand.command,
      newCommand.parameters,
      callback
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
    this.xhrWrapper = new XHRWrapper(connectionParameters);
  }

  /**
   * Executes a native query asynchronously. It requires a command object with a (http) 'method'  and (relative) 'url' properties
   *
   * @param {Object|string} command
   * @param {Array} params
   * @param {Function} callback
   * @return {Promise}
   * @throws {Error}
   */
  async executeNativeQueryAsync(command, params, callback) {
    return this.executeQuery(command, params, callback, true);
  }

  executeQuerySync(command, params, callback) {
    return this.executeQuery(command, params, callback, false);
  }

  executeQuery(command, params, callback, async = true) {
    command = typeof command === "string" ? JSON.parse(command) : command;
    if (!(command instanceof Object)) {
      throw new Error("Command must be an object or a stringified object");
    }
    const date = new Date();
    const response = { executionTime: date.getTime(), executionDateTime: date };
    let results = this.xhrWrapper[command["method"]](
      command["url"],
      ...params,
      async
    )
      .then((res) => {
        response.response = res;
        callback(res, null);
      })
      .catch((error) => {
        callback(null, error);
      });
    return results;
  }
}
