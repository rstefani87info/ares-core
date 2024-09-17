/**
 * @author Roberto Stefani
 * @license MIT
 */

import { v4 as uuidv4 } from "uuid";
import { asyncConsole } from "./console.js";
import { format } from "./dataDescriptors.js";
import { cloneWithMethods } from "./objects.js";
import { XHRWrapper } from "./xhr.js";
import app from "../../../app.js";

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
        if(mapper.transformToDTO  && mapper.transformToDTO instanceof Function) 
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
  }

  getConnection(req, mapper, force = false) {
    if (this.aReS.permissions.isResourceAllowed(this.name, req)) {
      const env = this.environments[app.isProduction ? "production" : "test"];
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
      const params = mapper.mapParameters?mapper.mapParameters(req, this.aReS):{};
      let ret = null;
      if (wait) ret = conn.executeQuerySync(command, params, callback);
      else ret = conn.executeNativeQueryAsync(command, params, callback);
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
          value.name = key;
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
              : mapper.parametersValidationRoles
          );
          console.log('params:',params);
          if (params["€rror"]){
            console.error(params["€rror"]);
            throw new Error(
              "Formatting and validation error: " +
                JSON.stringify(params["€rror"])
            );}
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
        console.log('Ret:',ret);
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

class SQLDBConnection extends DBConnection {}


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

 
