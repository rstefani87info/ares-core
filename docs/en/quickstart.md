# `@ares/core` Quickstart

## Install

```bash
npm i @ares/core
```

## Minimal bootstrap

```js
import aReSInitialize from "@ares/core";

const aReS = aReSInitialize({
  name: "my-app",
  environments: [],
});
```

Minimum requirements:
- `name` must be a non-empty string.
- `environments` must be an array (it can be empty).

## `isProduction`

`aReS.isProduction` becomes `true` when there is at least one environment with:
- `selected: true`
- `type: "production"` (case-insensitive)

Example:

```js
const aReS = aReSInitialize({
  name: "my-app",
  environments: [{ name: "prod", type: "production", selected: true }],
});
```

## Config and policies (recommended contract)

The bootstrap normalizes two dedicated containers:
- `appSetup.config`: framework runtime configuration
- `appSetup.policies`: application policies (e.g. permissions)

Access helpers:
- `aReS.getConfig("dot.path", fallback?)`
- `aReS.getPolicy("name", fallback?)`

Example:

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

Legacy compatibility:
- `setup.permissions` is normalized into `policies.permissions`
- `setup.enabledGeoCoders` is normalized into `config.geocoders.enabled`

## Logging

The core exposes:
- `aReS.configureLogging(overrides?)`
- `aReS.getLoggingConfig()`

Example:

```js
aReS.configureLogging({
  debug: true,
  diagnostics: true,
});
```

## Scripts runtime

The core exposes:
- `aReS.configureScriptsRuntime(overrides?)`
- `aReS.getScriptsRuntimeConfig()`

Global type lookup is disabled by default. To enable it in a controlled way:

```js
aReS.configureScriptsRuntime({
  allowGlobalTypeLookup: true,
  allowedGlobalTypes: ["MyType"],
});
```

## Extending the runtime with core modules

An includable module must export `aReSInitialize(aReS)`. Examples from the core:

```js
import * as datasourcesModule from "@ares/core/datasources.js";
import * as geographicalModule from "@ares/core/geographical.js";

aReS.include(datasourcesModule);
aReS.include(geographicalModule);
```

## Datasource mapper execution (payload is not necessarily HTTP)

Mappers work on a generic payload that resembles a request object, but it is not HTTP-bound.

Key points:
- the runtime normalizes a `sessionId` even for minimal payloads
- the same shape can come from HTTP or internal calls

See also:
- [Technical Overview](./core.md)
- [Datasources](./datasources.md)
