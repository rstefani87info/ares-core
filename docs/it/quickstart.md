# Quickstart `@ares/core`

## Installazione

```bash
npm i @ares/core
```

## Bootstrap minimo

```js
import aReSInitialize from "@ares/core";

const aReS = aReSInitialize({
  name: "my-app",
  environments: [],
});
```

Requisiti minimi:
- `name` deve essere una stringa non vuota.
- `environments` e' un array (puo' essere vuoto).

## `isProduction`

`aReS.isProduction` diventa `true` quando esiste almeno un environment con:
- `selected: true`
- `type: "production"` (case-insensitive)

Esempio:

```js
const aReS = aReSInitialize({
  name: "my-app",
  environments: [{ name: "prod", type: "production", selected: true }],
});
```

## Config e policy (contratto consigliato)

Il bootstrap normalizza due contenitori dedicati:
- `appSetup.config`: opzioni runtime del framework
- `appSetup.policies`: policy applicative (es. permessi)

Accesso:
- `aReS.getConfig("path.dot", fallback?)`
- `aReS.getPolicy("name", fallback?)`

Esempio:

```js
const aReS = aReSInitialize({
  name: "my-app",
  environments: [],
  config: {
    logging: { debug: false, diagnostics: false },
    geocoders: { enabled: [] },
  },
  policies: {
    permissions: [{ hosts: ["localhost"], allowedResource: ["*"] }],
  },
});
```

Compatibilita' legacy:
- `setup.permissions` viene normalizzato in `policies.permissions`
- `setup.enabledGeoCoders` viene normalizzato in `config.geocoders.enabled`

## Logging

Il core espone:
- `aReS.configureLogging(overrides?)`
- `aReS.getLoggingConfig()`

Esempio:

```js
aReS.configureLogging({
  debug: true,
  diagnostics: true,
});
```

## Scripts runtime

Il core espone:
- `aReS.configureScriptsRuntime(overrides?)`
- `aReS.getScriptsRuntimeConfig()`

Per default il lookup globale dei tipi custom e' disattivato. Per abilitarlo in modo controllato:

```js
aReS.configureScriptsRuntime({
  allowGlobalTypeLookup: true,
  allowedGlobalTypes: ["MyType"],
});
```

## Estendere l'istanza con moduli del core

Un modulo includibile deve esportare `aReSInitialize(aReS)`. Esempi nel core:

```js
import * as datasourcesModule from "@ares/core/datasources.js";
import * as geographicalModule from "@ares/core/geographical.js";

aReS.include(datasourcesModule);
aReS.include(geographicalModule);
```

## Esecuzione mapper datasource (payload non necessariamente HTTP)

I mapper lavorano su un payload generico simile a una request, ma non vincolato a HTTP.

Punti chiave:
- il runtime normalizza un `sessionId` anche se il payload e' minimale
- la stessa shape puo' arrivare da HTTP o da chiamate interne

Vedi anche:
- [Panoramica Tecnica](./core.md)
- [Datasource](./datasources.md)
- [Life Cycle](./life-cycle.md)
