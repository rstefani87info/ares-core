# @ares/core

## Purpose

The `@ares/core` module is the runtime foundation of the aReS framework. It is not just a bag of helpers: it defines the central `ARES` instance, the application bootstrap flow, and a set of technical modules that can be imported directly or included to extend the runtime.

## What the Package Root Actually Exposes

The main entrypoint is `index.js`.

From the package root you currently get:

- the `ARES` class;
- the default function `aReSInitialize(setup, options?)`;
- instance features such as `include()` and `isProduction`;
- static instance management through `ARES.instances` and `ARES.getInstance(name)`.

The package root does not automatically attach every utility to the `aReS` instance. Most core utilities live in dedicated module files and should be imported explicitly or made available through modules that extend the runtime instance.

## Bootstrap

The minimum bootstrap flow is:

```javascript
import aReSInitialize from '@ares/core';

const aReS = aReSInitialize({
  name: 'my-app',
  environments: []
});
```

This creates a new `ARES` instance with:

- validation of `setup.name`, which must be a non-empty string;
- `appSetup` as the application configuration;
- `idMap` as an internal support structure;
- registration inside the runtime registry.

By default the bootstrap rejects a second instance with the same `name` and throws an error.

```javascript
const aReS = aReSInitialize(
  { name: 'my-app', environments: [] },
  { onDuplicate: 'throw' }
);
```

Supported `onDuplicate` policies are:

- `throw` to fail on duplicate names;
- `replace` to replace the registered instance;
- `reuse` to return the existing instance.

## Main Instance API

### `aReS.appSetup`

Stores the application configuration passed during bootstrap.

### `aReS.idMap`

Keeps a structure containing `idKeyMap` and `hashKeyMap`.

### `aReS.isProduction`

Returns `true` when the configured environments contain a selected environment whose `type` is `production`.

### `aReS.include(module)`

Extends the current instance with a module exporting `aReSInitialize(aReS)`.

```javascript
import aReSInitialize from '@ares/core';
import * as datasourceRuntime from '@ares/core/datasources.js';

const aReS = aReSInitialize({ name: 'my-app', environments: [] });
aReS.include(datasourceRuntime);
```

### `ARES.getInstance(name)`

Returns one of the instances registered in the current runtime.

### `ARES.instances`

Exposes a read-only view of the registered instances, indexed by `name`.

## Module Structure

The `core` package is split across focused files. The main functional areas are:

### Runtime and composition

- `index.js` for bootstrap and instance management;
- `datasources.js` for datasource runtime, request mappers and connections;
- `dataDescriptors.js` for formatting and validation.

### Security and permissions

- `security.js` for encryption and decryption;
- `crypto.js` for hashes and cryptographic helpers;
- `permissions.js` for authorization checks.

### Infrastructure and integration

- `xhr.js` for HTTP requests through a wrapper;
- `commandLine.js` for interactive CLI support;
- `geographical.js` for geocoding and reverse geocoding;
- `console.js` for logging and diagnostics.

### Generic utilities

- `arrays.js`, `objects.js`, `text.js`, `regex.js`, `numbers.js`;
- `dates.js`, `datesAndTime.js`, `url.js`, `xml.js`, `trees.js`;
- `flow.js`, `prototype.js`, `scripts.js`, `errorHandling.js`, `i18n.js`.

## Correct Usage Patterns

There are two main usage patterns in the current codebase.

### 1. Direct utility imports

```javascript
import { capitalize } from '@ares/core/text.js';
import { getSHA256Hash } from '@ares/core/crypto.js';
```

This is the most direct way to use the core utility modules.

### 2. Runtime instance extension

```javascript
import aReSInitialize from '@ares/core';
import * as commandLineModule from '@ares/core/commandLine.js';

const aReS = aReSInitialize({ name: 'my-app', environments: [] });
aReS.include(commandLineModule);

aReS.initCommandLine({});
```

This pattern is used when a module adds services or runtime behaviour to the shared `aReS` instance.

## What Not to Assume

To avoid ambiguity, it is useful to clarify what the module does not provide automatically:

- it does not build a full application by itself;
- it does not auto-attach all utilities to the `aReS` instance;
- it does not yet implement a centralized start/shutdown lifecycle manager;
- it does not replace higher-level modules such as `web` or specific datasource packages.

## Dependencies

The dependencies declared in `package.json` are aligned with the module responsibilities:

- `axios`
- `crypto-js`
- `json2xml`
- `lodash`
- `moment`
- `moment-timezone`
- `nanoid`
- `numeral`

## Related Documents

- `life-cycle.md` in the Italian docs for runtime behaviour analysis;
- `strength.md` in the Italian docs for positioning and differentiators.
