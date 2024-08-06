/**
 * @author Roberto Stefani
 * @license MIT
 */
import mysql from "mysql";
import {waitPromise} from "./scripts.js";
import { asyncConsole } from "./console.js";
import { format } from "./dataDescriptors.js";
import {
  isFile,
  getFilesRecursively,
  getParent,
  getFileName,
  fileExists,
  getFileContent,
} from "@ares/files";
import { cloneWithMethods } from "./objects.js";
import { XHRWrapper } from "./xhr.js";
import app from "../../../app.js";



const mapRequestOrResult = function (request) {
  return request;
};
/**
 * @param {Object} aReS - The express framework object
 * @param {string} datasourceName - The name of the database
 * @param {function} onMapperLoaded - The callback when the mapper is loaded
 * @param {boolean} [force=false] - Whether to force the export
 * @return {Object} The exported database
 * 
 * Initialyze datasource objects


 * 
 */
async function loadDatasource(
  aReS,
  datasourceName,
  onMapperLoaded,
  force = false
) {
  datasourceName = datasourceName.toLowerCase();
  aReS.datasourceMap = aReS.datasourceMap ?? {};
  force = force || !datasourceName in aReS.datasourceMap;
  if (force) {
    asyncConsole.log("datasources", 'init db "' + datasourceName + '" {');
    const datasourceRoot = app.datasourcesRoot + "/" + datasourceName;
    aReS.datasourceMap[datasourceName] = new Datasource(
      aReS,
      await import("../../../" + datasourceRoot + "/datasource.js")
    );
    aReS.datasourceMap[datasourceName].datasourceRoot = datasourceRoot;
    aReS.datasourceMap[datasourceName].onMapperLoaded = onMapperLoaded;
    const areLoaded = await aReS.datasourceMap[datasourceName].loadQueryFiles();
    asyncConsole.log("datasources", "}");
  }
  return aReS.datasourceMap[datasourceName];
}

/**
 * @param {Object} aReS - The aRes framework object
 * @param {boolean} [force=true] - Whether to force the export
 * @return {array} The exported databases
 *
 * Initialyze db object
 *
 */
async function initAllDatasources(
  aReS,
  onMapperLoaded = () => {},
  force = true
) {
  const datasourcesRoot = app.datasourcesRoot;
  const files = getFilesRecursively(
    datasourcesRoot,
    /(.*[\/\\]){0,1}datasource\.js/i,
    true
  );
  const array = [];
  for (const file of files) {
    asyncConsole.log("datasources", 'connection file found: "' + file + ";");
    array.push(
      await loadDatasource(
        aReS,
        getFileName(getParent(file)),
        onMapperLoaded,
        force
      )
    );
  }
  asyncConsole.output("datasources");
  return array;
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

const datasources = {
  initAllDatasources: initAllDatasources,
  loadDatasource: loadDatasource,
};
export default datasources;

export class Datasource {
  constructor(aReS, dbConfig) {
    if (typeof dbConfig === "object") Object.assign(this, dbConfig);
    this.aReS = aReS;
    this.extensionRegex =
      /.(sql|url|json|xml|xsl[t]{0,1}|xpath|xquery|nosql\.js|knex\.js)$/i;
    this.sessions = {};
  }

  getDBRoot(dbName) {
    return app.dbRoot + "/" + dbName;
  }

  getConnection(req, mapper, force = false) {
    const ds = this;
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
      const params = mapper.mapParameters(req, this);
      if (wait) return conn.executeQuerySync(command, params, callback);

      if (isTransaction) {
        conn.commity();
      }
      return conn.executeNativeQueryAsync(command, params, callback);
    } catch (err) {
      if (isTransaction) {
        conn.rollback();
      }
    }
  }

  close(req) {
    for (const connection in this.sessions) connection.end();
  }

  getQueryFiles() {
    const qfe = this.queryFileExtensions;
    return getFilesRecursively(this.datasourceRoot, this.extensionRegex, true);
  }

  async loadQueryFiles() {
    for (const file of this.getQueryFiles()) {
      await this.loadQueryFile(file);
    }
    return true;
  }

  async loadQueryFile(file) {
    if (isFile(file)) {
      asyncConsole.log(
        "datasources",
        ' - init mapperCase "' + getFileName(file) + '" {'
      );
      const extension = file.match(this.extensionRegex)[1];
      const queryCompleteFileName = file.replace(this.extensionRegex, "");
      const queryFileName = getFileName(queryCompleteFileName);
      const mapperFile = queryCompleteFileName + ".js";
      asyncConsole.log("datasources", ' - init mapper "' + mapperFile + '"');
      this[queryFileName] = {
        name: queryFileName,
        mappers: fileExists(mapperFile)
          ? (await import("../../../" + mapperFile)).default
          : null,
        query: getFileContent(file),
        mode: extension.toUpperCase(),
      };

      for (const mapper of this[queryFileName].mappers || []) {
        mapper.querySetting = this[queryFileName];
        await this.loadMapper(mapper);
      }
      return true;
    }
    return false;
  }
  async loadMapper(mapper) {
    const db = this;
    if (mapper.querySetting && !mapper.name) {
      mapper.name =
        mapper.querySetting.name +
        "[" +
        mapper.querySetting.mappers.indexOf(mapper) +
        "]";
      mapper.execute = function (request, callback, wait = false) {
        try {
          console.log(
            db.name +
              "[" +
              request.session.id +
              "] : " +
              mapper.querySetting.query
          );
          let params = request.parameters;
          if (mapper.mapParameters) {
            params = format(
              request.parameters,
              mapper.validateParameters(request, this.aReS)
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
            mapper.querySetting.query,
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
                response.queryName = mapper.querySetting.name;
                response.mapperName = mapper.name;
                response.query = mapper.querySetting.query;
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
            queryName: mapper.querySetting.name,
            mapperName: mapper.name,
          });
          console.log(e);
        }
      };
      mapper.querySetting[mapper.name] = mapper;
      if (this.onMapperLoaded && typeof this.onMapperLoaded === "function") {
        await this.onMapperLoaded(this.aReS, mapper, this);
      }
      return true;
    }
    return false;
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

    this.executeNativeQueryAsync(command, params, callback);
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


export class RESTConnection extends DBConnection {

  constructor(connectionParameters, datasource, sessionId, connectionSettingName) {
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
    command= typeof command === 'string' ? JSON.parse(command) : command;
    if(!command instanceof Object) {
      throw new Error('Command must be an object or a stringified object');
    }
    const date = new Date();
    const response = { executionTime: date.getTime(), executionDateTime: date };
    let results = this.xhrWrapper[command['method']](command['url'], ...params).then((res) =>{response.response = res; callback(res,null);}).catch((error) => {
      callback(null, error);
    });
    return results;
  }

  executeQuerySync(command, params, callback) {
    return waitPromise(this.executeNativeQueryAsync(command, params, callback));
  }
     
}
