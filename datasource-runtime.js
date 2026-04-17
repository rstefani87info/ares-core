import * as advancedConsole from "./console.js";
import {
  resolveRequestRuntimeContext,
  isDatasourceAllowed,
  getSessionLogLabel,
} from "./datasource-execution-context.js";
import { defaultConnectionCallback } from "./db-connection.js";

export async function getPool(datasource, id, onCreate) {
  datasource.pools[id] = datasource.pools[id] ?? (await onCreate());
  return datasource.pools[id];
}

export async function getConnection(datasource, req, mapper, force = false) {
  const { request, sessionId } = resolveRequestRuntimeContext(req);
  const canAccessDatasource = isDatasourceAllowed(datasource.aReS, datasource.name, request);

  advancedConsole.debug(
    "Datasource: " + datasource.name + " - connecting: " + mapper.connectionSetting,
    canAccessDatasource
  );

  if (!canAccessDatasource) {
    throw new Error("Can not establish connection!");
  }

  const env = datasource.environments[datasource.aReS.isProduction ? "production" : "test"];
  const connectionSetting = env[mapper.connectionSetting];

  if (force || !datasource.sessions[sessionId]) {
    datasource.sessions[sessionId] = datasource.sessions[sessionId] ?? {};
  }

  if (force || !datasource.sessions[sessionId][mapper.connectionSetting]) {
    const driverConstructor = connectionSetting.driver;
    datasource.sessions[sessionId][mapper.connectionSetting] = new driverConstructor(
      connectionSetting,
      datasource,
      sessionId,
      mapper.connectionSetting,
      datasource.aReS.isProduction
    );
  }

  const connection = datasource.sessions[sessionId][mapper.connectionSetting];

  if (!connection.pool) {
    await connection.setPool();
  }

  await connection.nativeConnect(defaultConnectionCallback);
  connection.isOpen = true;
  return connection;
}

export async function query(datasource, req, command, mapper) {
  const connection = await ensureConnection(datasource, req, mapper);
  const { isTransaction, transactionName } = setupTransaction(datasource, req, mapper, connection);

  try {
    const ret = await executeQuery(datasource, req, command, mapper, connection);

    if (isTransaction) {
      commitTransaction(datasource, req, connection, transactionName);
    }
    return ret;
  } catch (err) {
    advancedConsole.error("aReS Error:", err);
    if (isTransaction) {
      rollbackTransaction(datasource, req, connection, transactionName);
    }
    return { "€rror": err };
  }
}

export function closeDatasource(datasource) {
  for (const sessionId in datasource.sessions) {
    for (const connName in datasource.sessions[sessionId]) {
      const conn = datasource.sessions[sessionId][connName];
      if (conn && conn.isOpen) {
        conn.nativeDisconnect();
      }
    }
  }
}

async function ensureConnection(datasource, req, mapper) {
  const { request, sessionId } = resolveRequestRuntimeContext(req);
  let connection = datasource.sessions[sessionId]
    ? datasource.sessions[sessionId][mapper.connectionSetting]
    : undefined;

  advancedConsole.debug("verifying connection");

  if (!connection || !connection.isOpen) {
    connection = await getConnection(datasource, request, mapper);
    if (!connection.isOpen) {
      advancedConsole.error("connection is not open");
      throw new Error("connection is not open");
    }
  }

  advancedConsole.debug("verified connection", true);
  return connection;
}

function setupTransaction(datasource, req, mapper, connection) {
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
      "called database transaction: " + datasource.name + "[" + sessionId + "]"
    );
    connection.startTransaction(transactionName);
  }

  return { isTransaction, transactionName };
}

async function executeQuery(datasource, req, command, mapper, connection) {
  const { request, sessionId } = resolveRequestRuntimeContext(req);
  advancedConsole.debug(
    "executing query: " + datasource.name + "[" + getSessionLogLabel(sessionId) + "]",
    request.params,
    request.parameters
  );
  const params = mapper.mapParameters
    ? await mapper.mapParameters(request, datasource.aReS, connection)
    : {};
  advancedConsole.debug("executing query with params:", params);
  const ret = await connection._executeNativeQueryAsync(command, params, mapper, request);
  advancedConsole.debug("query results", ret);
  return ret;
}

function commitTransaction(datasource, req, connection, transactionName) {
  const { sessionId } = resolveRequestRuntimeContext(req);
  advancedConsole.debug(
    "commit database transaction: " + datasource.name + "[" + getSessionLogLabel(sessionId) + "]"
  );
  connection.commit(transactionName);
}

function rollbackTransaction(datasource, req, connection, transactionName) {
  const { sessionId } = resolveRequestRuntimeContext(req);
  advancedConsole.debug(
    "rollback database transaction: " + datasource.name + "[" + getSessionLogLabel(sessionId) + "]"
  );
  connection.rollback(transactionName);
}

