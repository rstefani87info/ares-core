# `@ares/core` API Surface Classification

## Purpose

This document defines an operational classification for the modules exposed by `@ares/core`, distinguishing between:

- stable root API;
- stable public subpaths;
- public runtime extension modules;
- transitional modules still used across the workspace but not yet strong enough to be treated as stable APIs;
- internal or experimental modules.

The goal is to prepare a future `exports` map without breaking the aReS packages that already import `core` subpaths directly.

## General Rule

- The `@ares/core` root package exposes bootstrap and the `ARES` class.
- Subpaths should be considered public only when they are explicitly listed in one of the supported categories below.
- `transitional` modules remain importable in the current workspace, but they should not be the default choice for new integrations without further hardening.
- `internal` modules should stay out of a future public `exports` map.

## 1. Stable Root

### `@ares/core`

Stable package entrypoint.

File:

- `index.js`

Expected contract:

- bootstrap through `aReSInitialize(setup, options?)`;
- `ARES` class;
- instance registry;
- `aReS.include(module)` as the main runtime composition mechanism.

## 2. Stable Subpaths

These modules are candidates to be supported as stable public subpaths.

### Pure and mature utilities

- `@ares/core/crypto.js`
- `@ares/core/text.js`
- `@ares/core/url.js`
- `@ares/core/xml.js`
- `@ares/core/regex.js`
- `@ares/core/i18n.js`
- `@ares/core/datesAndTime.js`

Matching files:

- `crypto.js`
- `text.js`
- `url.js`
- `xml.js`
- `regex.js`
- `i18n.js`
- `datesAndTime.js`

Expected properties:

- directly importable functions;
- minimal dependency on the `aReS` runtime state;
- semantics clear enough to be documented as public contract.

## 3. Runtime Extensions

These modules are public, but their contract is mainly oriented around extending the `aReS` runtime through `include()`, or around framework-centric services.

Candidate subpaths:

- `@ares/core/datasources.js`
- `@ares/core/dataDescriptors.js`
- `@ares/core/permissions.js`
- `@ares/core/commandLine.js`
- `@ares/core/geographical.js`

Matching files:

- `datasources.js`
- `dataDescriptors.js`
- `permissions.js`
- `commandLine.js`
- `geographical.js`

Expected properties:

- dependency on the `aReS` context or on framework conventions;
- presence of `aReSInitialize(aReS)` or runtime-oriented classes/services;
- supported public contract, but less generic than pure utility modules.

## 4. Transitional Public

These modules are already used by workspace consumers, so they cannot be removed or hidden abruptly. However, they are not yet ready to be declared stable public APIs without additional hardening.

Subpaths to treat as transitional:

- `@ares/core/console.js`
- `@ares/core/security.js`
- `@ares/core/xhr.js`
- `@ares/core/objects.js`
- `@ares/core/scripts.js`
- `@ares/core/arrays.js`
- `@ares/core/dates.js`
- `@ares/core/trees.js`

Typical reasons for the transitional classification:

- strong coupling with runtime state or application conventions;
- recent bugs or refactors suggesting caution;
- wide API surface that is still not formalized;
- real usage by other aReS packages that requires short-term compatibility.

## 5. Internal Or Experimental

These modules should not be advertised as supported public APIs.

Files:

- `flow.js`
- `prototype.js`
- `errorHandling.js`
- `numbers.js`

Recommended handling:

- keep them out of a future public `exports` map;
- use them only internally or after dedicated stabilization work;
- avoid new direct consumers in the workspace.

## 6. Evidence In The Workspace

The workspace already contains direct imports of `core` subpaths. Examples include:

- `@ares/core/datasources.js`
- `@ares/core/dataDescriptors.js`
- `@ares/core/console.js`
- `@ares/core/security.js`
- `@ares/core/xhr.js`
- `@ares/core/objects.js`
- `@ares/core/scripts`
- `@ares/core/crypto`

This means the classification is not only documentation: any technical restriction on subpaths requires a coordinated migration across the other aReS modules.

## 7. Canonical Import Form

For ESM consistency, the recommended canonical form for documented subpaths is:

```javascript
import { asyncConsole } from "@ares/core/console.js";
import { getSHA256Hash } from "@ares/core/crypto.js";
```

The workspace still contains legacy imports without file extension, such as:

```javascript
import * as crypto from "@ares/core/crypto";
import { getByPropertyPath } from "@ares/core/scripts";
```

These imports should be treated as historical compatibility, not as the target form for new documentation or new integrations.

## 8. Recommended Migration Plan

Suggested order:

1. Document the module classification.
2. Standardize workspace imports toward the canonical form.
3. Verify that no package still depends on `internal` subpaths.
4. Introduce an `exports` map in `package.json`.
5. Gradually deprecate transitional subpaths or legacy extensionless imports.

## 9. Operational Summary

At this stage:

- `index.js` is the stable root contract;
- a subset of utilities and runtime modules can be treated as supported public API;
- some subpaths remain public only in a transitional way for workspace compatibility;
- internal modules should stay outside the future public package contract.

## 10. Separation Between Pure Core And Infrastructure Modules

The current package structure shows two different responsibility families:

- `pure core`: runtime bootstrap, module composition, generic utilities, baseline security, parsing, and application support helpers;
- `infrastructure-coupled modules`: HTTP networking, geocoding, interactive CLI, datasource runtime, and integration with sessions or external drivers.

### Modules To Treat As Pure Core

- `index.js`
- `crypto.js`
- `text.js`
- `url.js`
- `xml.js`
- `regex.js`
- `i18n.js`
- `datesAndTime.js`
- `arrays.js`
- `objects.js`
- `dates.js`
- `trees.js`
- `permissions.js`

These modules are closer to the framework baseline contract or to reusable utilities with limited dependency on host infrastructure.

### Infrastructure-Coupled Modules

- `xhr.js`
- `geographical.js`
- `commandLine.js`
- `datasources.js`
- `dataDescriptors.js`

Main reasons:

- `xhr.js` depends directly on `axios` and models an HTTP client;
- `geographical.js` depends on remote providers and quota-driven integrations, also through `axios`;
- `commandLine.js` binds the package to `stdin`, `stdout`, and interactive Node processes;
- `datasources.js` depends on HTTP session state, native connections, transactions, and external drivers;
- `dataDescriptors.js` is tightly coupled to datasource runtime and application formatting conventions.

### Recommended Architectural Decision

This evaluation suggests:

1. keeping these modules inside `core` for now to preserve workspace compatibility;
2. classifying them as `Runtime Extensions` or `Transitional Public`, not as `pure core`;
3. planning a future extraction into dedicated packages such as `@ares/http`, `@ares/geocoding`, `@ares/cli`, and a separate datasource/runtime package;
4. avoiding new infrastructure-heavy utilities directly inside `@ares/core`.

### Package Contract Impact

In the short term the package can continue exporting these modules, but the documentation should treat them as runtime extensions rather than as the minimum framework foundation.

In practical terms:

- `@ares/core` remains the historical container;
- `pure core` is the contract worth protecting long term;
- infrastructure modules should be treated as separation candidates, not as baseline package responsibilities.
