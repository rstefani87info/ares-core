/**
 * @author Roberto Stefani
 * @license MIT
 */
import mysql from "mysql";
const { v4: uuidv4 } = require("uuid");
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
    " - open REST: {" + mapper.name + ":  " + mapper.path
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
      else res.json(queryResponse);
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
        const driverConstructor = drivers[connectionSetting.driver];
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
      const params = mapper.mapParameters(req, this.aReS);
      if (wait) return conn.executeQuerySync(command, params, callback);

      if (isTransaction) {
        conn.commit();
      }
      return conn.executeNativeQueryAsync(command, params, callback);
    } catch (err) {
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
    return this.dbConfig.queries? Object.entries(this.dbConfig.queries).map(([key, value]) => { value.name=key; return thisDatasource.loadQuery(v); }) : [];
  }

  async loadQuery(queryObject) {
    if (typeof queryObject === "object") {
      asyncConsole.log(
        "datasources",
        ' - init mapperCase "' + queryObject.name + '" {'
      );
      this[queryObject.name] = queryObject;
      await this.loadMapper(mapper);
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
          if (params["€rror"])
            throw new Error(
              "Formatting and validation error: " +
                JSON.stringify(params["€rror"])
            );
          request = cloneWithMethods(request);
          request.parameters = params;
        }
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
        if (mapper.postExecute) mapper.postExecute(request, this, ret);
        return ret;
      } catch (e) {
        callback({
          error: e,
          db: db.name,
          queryName: mapper.name,
        });
        console.log(e);
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

class MariaDB extends SQLDBConnection {
  async nativeConnect(callback) {
    if (!MariaDB.pool) MariaDB.pool = mysql.createPool(this);
    const dbConn = this;
    this.connection = this.connection ?? null;
    if (!this.connection) {
      await MariaDB.pool.getConnection((err, conn) => {
        if (err) {
          console.error("Error getting connection:", err);
          return;
        }
        conn.on("end", () => {
          delete dbConn.datasource.sessions[this.sessionId];
        });
        this.connection = conn;
        callback(err);
      });
    }
  }

  nativeDisconnect() {
    this.connection.release((releaseError) => {
      if (releaseError) {
        console.error("Error releasing connection:", releaseError);
        return;
      }
      delete this.datasource.sessions[this.sessionId];
    });
  }

  startTransaction($name) {
    if (!this.transaction) {
      this.connection.beginTransaction((transactionError) => {
        if (transactionError) {
          throw new Error("Error on starting transaction: " + transactionError);
        }
        this.transaction = $name;
      });
    }
  }

  rollback($name) {
    if (this.transaction === $name) {
      this.connection.rollback();
      this.transaction = null;
    }
  }

  commit($name) {
    if (this.transaction === $name) {
      this.connection.commit((commitError) => {
        if (commitError) {
          throw new Error(
            'Error on committing transaction "' + $name + '": ' + commitError
          );
        } else this.transaction = null;
      });
    }
  }

  async executeNativeQueryAsync(command, params, callback) {
    const date = new Date();
    const response = { executionTime: date.getTime(), executionDateTime: date };
    const connectionHandler = this;
    return new Promise(async (resolve, reject) => {
      if (!connectionHandler.connection)
        await connectionHandler.nativeConnect((err) => {
          if (err) {
            console.error("Errore di connessione:", err);
            reject(err);
            return;
          }

          connectionHandler.connection.query(
            command,
            params,
            (error, results, fields) => {
              response.executionTime =
                new Date().getTime() - response.executionTime;
              response.fields = fields;
              response.results = results;
              response.error = error;
              if (!app.isProduction) {
                response.query = command;
                response.params = params;
              }
              callback(response);
              if (error) {
                reject(response);
              } else {
                resolve(response);
              }
            }
          );
        });
    });
  }
  executeQuerySync(command, params, callback) {
    const date = new Date();
    const response = { executionTime: date.getTime(), executionDateTime: date };
    const logName = "executeQuerySync_" + response.executionTime;
    asyncConsole.log(logName, "Waiting for query results:");
    let wait = true;
    this.connection.query(command, params, (error, results, fields) => {
      wait = false;
      response.fields = fields;
      response.results = results;
      response.error = error;
      response.executionTime = new Date().getTime() - response.executionTime;
      callback(response);
    });
    while (wait) {
      asyncConsole.log(logName, ".....");
      setTimeout(() => {}, 100);
    }
    return response;
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

const drivers = {
  mariadb: MariaDB,
  rest: RESTConnection,
  // mysql: MYSQL,
  // mssql: MSSQL,
  // oracle: Oracle,
  // postgres: Postgres,
  // sqlite: SQLite,
  // mongo: Mongo,
  // redis: Redis,
  // couchdb: CouchDB,
  // neo4j: Neo4J
};
