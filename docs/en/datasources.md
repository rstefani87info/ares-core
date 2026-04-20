# Datasources: instantiation and configuration

This page explains how to instantiate a `Datasource` in an `aReS` runtime using `@ares/core/datasources.js`.

## Concepts

- A `Datasource` is a container for:
  - `environments`: per-environment configuration (`test` / `production`)
  - `queries`: a map of query definitions (mappers)
  - runtime sessions/connections (managed internally)
- A datasource "request" is a generic payload that resembles an HTTP request, but it is not HTTP-bound. The runtime normalizes a `sessionId` even when missing.

## Enable the datasource module

```js
import aReSInitialize from "@ares/core";
import * as datasourcesModule from "@ares/core/datasources.js";

const aReS = aReSInitialize({ name: "my-app", environments: [] });
aReS.include(datasourcesModule);
```

Including the module adds:
- `aReS.loadDatasource(datasourceSettings, onMapperLoaded?, force?)`

## Instantiate a datasource

Recommended approach: `aReS.loadDatasource()`:

```js
const datasource = await aReS.loadDatasource(
  {
    name: "Orders",
    environments: {
      test: {
        default: { driver: FakeDriver },
      },
      production: {
        default: { driver: FakeDriver },
      },
    },
    queries: {
      list: {
        name: "list",
        connectionSetting: "default",
        transaction: true,
        query: "SELECT 1",
        mapParameters: async (payload) => ({ filter: payload.filter ?? null }),
      },
    },
  },
  async (aReS, mapper, datasource) => {
    mapper.method = "GET";
  }
);
```

Note:
- `loadDatasource()` creates `new Datasource(aReS, datasourceSettings)` and loads mappers from `queries`.

## Configure `environments`

Structure:

```js
environments: {
  test: {
    <connectionSettingName>: { driver: DriverConstructor, ...driverConfig }
  },
  production: {
    <connectionSettingName>: { driver: DriverConstructor, ...driverConfig }
  }
}
```

The runtime picks `test` vs `production` based on `aReS.isProduction`.

## Driver: minimal requirements

A driver is a constructor used by the runtime to create a connection per `sessionId` and `connectionSetting`.

The runtime expects the connection instance to expose:
- `setPool()` (provided by the core `DBConnection` helper)
- `nativeConnect(callback?)`
- `_executeNativeQueryAsync(command, params, mapper, payload)`
- optional transaction hooks: `startTransaction(name)`, `commit(name)`, `rollback(name)`

Minimal example:

```js
class FakeDriver {
  constructor(connectionParameters, datasource, sessionId, connectionSettingName, isProduction) {
    this.datasource = datasource;
    this.sessionId = sessionId;
    this.connectionSettingName = connectionSettingName;
    this.isProduction = isProduction;
    this.pool = {};
    this.isOpen = true;
  }

  async setPool() {}
  async nativeConnect() { return this; }

  async _executeNativeQueryAsync(command, params, mapper, payload) {
    return { results: [{ ok: true, command, params, mapper: mapper.name }] };
  }
}
```

## Define queries (mappers)

Each entry in `queries` becomes a `DatasourceRequestMapper`.

Relevant fields:
- `name`: query name (auto-generated if missing)
- `connectionSetting`: which connection setting to use in `environments`
- `transaction`: when `true`, the runtime will start/commit/rollback if the connection supports transactions
- `query`: string or async function that returns a command to execute
- `mapParameters(payload, aReS, connection)`: maps the payload into params for the driver
- `parametersValidationRoles(payload, aReS)`: produces a descriptor for `dataDescriptors.format()`
- `mapResult(result, index, payload, aReS)`: transforms raw results
- `transformToDTO(result, index, payload, aReS)`: final DTO transform
- `postExecute(payload, datasource, response)`: hook after mapping

## Execute a query

Two common approaches:

1) Execute the mapper:

```js
const res = await datasource.list.execute({ filter: "recent" });
```

2) Call `Datasource.query()`:

```js
const res = await datasource.query({ filter: "recent" }, "SELECT 1", datasource.list);
```

The payload is normalized by the runtime (sessionId, transactions, etc.) and does not need to be an HTTP request.

## How queries are discovered and exposed

When you instantiate a datasource via `aReS.loadDatasource(...)`, the runtime:
- creates `aReS.datasourceMap[name.toLowerCase()] = new Datasource(...)`
- calls `datasource.loadQueries()`

`loadQueries()` iterates `datasource.queries` and for each entry:
- normalizes `value.name` (uses the object key as fallback)
- calls `datasource.loadQuery(value)`
- creates `datasource[value.name] = new DatasourceRequestMapper(...)`

So:
- queries become properties on the datasource instance (e.g. `datasource.list`)
- each mapper exposes `execute(payload)` to run the query

## Mapper execution lifecycle

`mapper.execute(payload)` follows these steps:
1) prepares `payload.parameters` via `dataDescriptors.format(payload, validationRoles, datasource)`
2) calls `datasource.query(payload, mapper.query, mapper)`
3) maps results via `mapResult` and `transformToDTO` (if provided)
4) runs `postExecute(payload, datasource, response)` (if provided)

## Transactions and cascading queries

The transaction runtime lives in the datasource layer (not in a specific SQL driver) and also works with non-HTTP payloads.

### When a transaction starts

A transaction starts when:
- `mapper.transaction === true` (or `1`)
- and the connection implements `startTransaction`, `commit`, `rollback`

The transaction name is built as:
- `transactionName = mapper.name + "[" + payload.transactionIndex + "]"`

The runtime stores on the payload:
- `payload.transactionIndex` (incrementing)
- `payload.executedTransactionSteps` (a list of executed transaction names)

### Automatic rollbacks and exceptions

Inside `datasource.query(...)` there is a `try/catch` that:
- if `mapper.transaction` is enabled and the connection supports transactions, calls `startTransaction(transactionName)`
- runs `mapper.mapParameters(...)` and then `_executeNativeQueryAsync(...)`
- on exceptions during that flow, calls `rollback(transactionName)` and returns `{ "€rror": err }`

So the automatic rollback covers:
- errors thrown by `mapParameters(payload, aReS, connection)`
- errors thrown by the driver/connection inside `_executeNativeQueryAsync(...)`

It does not cover errors that happen after `datasource.query(...)` returns, namely during:
- `mapResult(result, index, payload, aReS)`
- `transformToDTO(result, index, payload, aReS)`
- `postExecute(payload, datasource, response)`

If your business logic must guarantee rollback for mapping/post-processing failures, you need to move those transformations into the query/driver layer (or implement a custom commit strategy).

### Cascading queries (business logic)

You can implement a "cascading" business logic by orchestrating multiple mappers and reusing the same payload (or a clone) to keep:
- the same `sessionId` (connection reuse)
- transaction state (`transactionIndex` and steps)

Example:

```js
const payload = { sessionId: "order-123", input: { customerId: 10 } };

const order = await datasource.createOrder.execute(payload);
if (order["€rror"]) throw order["€rror"];

const orderItems = await datasource.createOrderItems.execute({
  ...payload,
  orderId: order.getResultsData()?.[0]?.id,
});
if (orderItems["€rror"]) throw orderItems["€rror"];
```

Note:
- if you want a single cross-step transaction, your driver must bind `startTransaction/commit/rollback` to the same connection and your application must decide where to commit/rollback.

## Example: a complex mapper calling other mappers

This example shows a mapper that:
- validates parameters via `parametersValidationRoles`
- uses `aReS` to access another datasource/mapper to derive information in `mapParameters`
- runs a main query
- enriches results by calling another mapper inside `mapResult`

```js
const mapper = {
  name: "getOrdersWithItems",
  connectionSetting: "default",
  transaction: true,
  methods: "get",
  parametersValidationRoles: async (payload, aReS) => {
    const userId = payload.userId ?? payload.params?.userId ?? payload.query?.userId;
    return {
      userId: {
        required: true,
        type: "number",
        min: 1,
        source: () => userId,
      },
      status: {
        required: false,
        type: "text",
        source: (p) => p.status ?? p.query?.status,
      },
    };
  },
  mapParameters: async (payload, aReS, connection) => {
    const customerDatasource = aReS.datasourceMap?.customers;
    const customer = customerDatasource
      ? await customerDatasource.getCustomerByUserId.execute({
          sessionId: payload.sessionId,
          userId: payload.parameters.userId,
        })
      : null;

    const customerId = customer?.getResultsData?.()?.[0]?.id ?? null;
    return [customerId, payload.parameters.status ?? null];
  },
  query: "SELECT * FROM orders WHERE customer_id = ? AND (? IS NULL OR status = ?)",
  mapResult: async (row, i, payload, aReS) => {
    const itemsDatasource = aReS.datasourceMap?.orders;
    const items = itemsDatasource
      ? await itemsDatasource.getOrderItems.execute({
          sessionId: payload.sessionId,
          orderId: row.id,
        })
      : null;

    return {
      ...row,
      items: items?.getResultsData?.() ?? [],
    };
  },
};
```

Key points:
- calling other mappers inside the flow is possible because all hooks accept `payload` and `aReS`
- reuse the same `sessionId` to reuse sessions/connections
