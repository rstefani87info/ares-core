# Datasource: istanziazione e configurazione

Questa pagina descrive come istanziare un `Datasource` nel runtime `aReS` usando `@ares/core/datasources.js`.

## Concetti

- Un `Datasource` e' un contenitore di:
  - `environments`: configurazione per ambiente (`test` / `production`)
  - `queries`: mappa di query (mapper)
  - sessioni/connessioni runtime (gestite internamente)
- Una "request" per il datasource e' un payload generico simile a una request HTTP, ma non vincolato a HTTP. Il runtime normalizza un `sessionId` anche se assente.

## Abilitare il modulo datasource

```js
import aReSInitialize from "@ares/core";
import * as datasourcesModule from "@ares/core/datasources.js";

const aReS = aReSInitialize({ name: "my-app", environments: [] });
aReS.include(datasourcesModule);
```

L'inclusione aggiunge il metodo:
- `aReS.loadDatasource(datasourceSettings, onMapperLoaded?, force?)`

## Istanziare un datasource

Il modo consigliato e' usare `aReS.loadDatasource()`:

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

Nota:
- `loadDatasource()` crea una istanza `new Datasource(aReS, datasourceSettings)` e carica i mapper da `queries`.

## Configurare `environments`

Struttura:

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

Il runtime sceglie `test` o `production` in base a `aReS.isProduction`.

## Driver: requisiti minimi

Un driver e' un costruttore usato dal runtime per creare una connessione per `sessionId` e `connectionSetting`.

Il runtime si aspetta che l'istanza connessione esponga:
- `setPool()` (eredita da `DBConnection` nel core)
- `nativeConnect(callback?)`
- `_executeNativeQueryAsync(command, params, mapper, payload)`
- opzionali per transazioni: `startTransaction(name)`, `commit(name)`, `rollback(name)`

Esempio minimale (driver finto):

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

## Definire query (mapper)

Ogni entry di `queries` diventa un `DatasourceRequestMapper`.

Campi rilevanti:
- `name`: nome della query (se omesso viene generato)
- `connectionSetting`: quale connection setting usare in `environments`
- `transaction`: se `true`, il runtime prova ad avviare/committare/rollbackare se la connessione supporta transazioni
- `query`: stringa o funzione async che ritorna un comando da eseguire
- `mapParameters(payload, aReS, connection)`: mappa il payload in params per il driver
- `parametersValidationRoles(payload, aReS)`: produce un descriptor per `dataDescriptors.format()`
- `mapResult(result, index, payload, aReS)`: trasforma risultati raw
- `transformToDTO(result, index, payload, aReS)`: trasformazione finale DTO
- `postExecute(payload, datasource, response)`: hook dopo mapping

## Eseguire una query

Due modalita':

1) Chiamare il mapper direttamente:

```js
const res = await datasource.list.execute({ filter: "recent" });
```

2) Chiamare la `Datasource.query()`:

```js
const res = await datasource.query({ filter: "recent" }, "SELECT 1", datasource.list);
```

Il payload viene normalizzato dal runtime (sessionId, transazioni, ecc.) e non deve essere una request HTTP.

## Come il datasource trova ed espone le query

Quando istanzi un datasource tramite `aReS.loadDatasource(...)`, il runtime:
- crea `aReS.datasourceMap[name.toLowerCase()] = new Datasource(...)`
- chiama `datasource.loadQueries()`

`loadQueries()` scorre `datasource.queries` e per ogni entry:
- normalizza `value.name` (usa la key come fallback)
- chiama `datasource.loadQuery(value)`
- crea `datasource[value.name] = new DatasourceRequestMapper(...)`

Quindi:
- le query diventano proprieta' sull'istanza datasource (es. `datasource.list`)
- l'oggetto mapper espone `execute(payload)` per far partire la query

## Flusso di esecuzione di un mapper

`mapper.execute(payload)` segue questi step:
1) prepara `payload.parameters` usando `dataDescriptors.format(payload, validationRoles, datasource)`
2) invoca `datasource.query(payload, mapper.query, mapper)`
3) mappa i risultati con `mapResult` e `transformToDTO` (se presenti)
4) esegue `postExecute(payload, datasource, response)` (se presente)

## Transazioni e query a cascata

Il runtime transazionale vive nel datasource (non nel driver SQL specifico) e funziona anche su payload non-HTTP.

### Quando parte una transazione

Una transazione parte se:
- `mapper.transaction === true` (o `1`)
- e la connessione espone `startTransaction`, `commit`, `rollback`

Il nome transazione e' costruito come:
- `transactionName = mapper.name + "[" + payload.transactionIndex + "]"`

Il runtime mantiene sul payload:
- `payload.transactionIndex` (incrementale)
- `payload.executedTransactionSteps` (lista dei nomi transazione eseguiti)

### Rollback automatici ed eccezioni

All'interno di `datasource.query(...)` esiste un `try/catch` che:
- se `mapper.transaction` e la connessione supporta transazioni, avvia `startTransaction(transactionName)`
- esegue `mapper.mapParameters(...)` e poi `_executeNativeQueryAsync(...)`
- in caso di eccezione durante quel flusso, esegue `rollback(transactionName)` e ritorna `{ "€rror": err }`

Questo significa che il rollback automatico copre:
- errori lanciati da `mapParameters(payload, aReS, connection)`
- errori lanciati dal driver/connessione durante `_executeNativeQueryAsync(...)`

Non copre invece gli errori che avvengono dopo il ritorno da `datasource.query(...)`, cioe' durante:
- `mapResult(result, index, payload, aReS)`
- `transformToDTO(result, index, payload, aReS)`
- `postExecute(payload, datasource, response)`

Se la tua business logic vuole garantire rollback anche per errori in mapping/post-processing, devi spostare tali trasformazioni dentro il layer query/driver (o gestire in modo custom il commit).

### Query a cascata (business logic)

Puoi implementare una business logic "a cascata" orchestrando piu' mapper, riusando lo stesso payload (o un clone) per mantenere:
- stesso `sessionId` (riuso connessione)
- stato transazionale (`transactionIndex` e steps)

Esempio:

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

Nota:
- se vuoi una transazione unica "cross-step", devi assicurarti che il driver colleghi davvero `startTransaction/commit/rollback` alla stessa connessione e che la logica applicativa decida dove committare/rollbackare.

## Esempio: mapper complesso con richiami ad altri mapper

Questo esempio mostra un mapper che:
- valida parametri via `parametersValidationRoles`
- usa `aReS` per accedere a un altro datasource/mapper per derivare informazioni in `mapParameters`
- esegue una query principale
- arricchisce i risultati richiamando un altro mapper in `mapResult`

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

Punti chiave:
- i richiami ad altri mapper nel flusso di business logic sono possibili perche' tutti accettano `payload` e `aReS` come parametri
- per riuso connessione/sessione, riusa lo stesso `sessionId` nel payload
