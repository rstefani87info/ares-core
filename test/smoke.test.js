import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import axios from "axios";

import aReSInitialize, { ARES } from "@ares/core";
import { asyncConsole, resetLoggingConfig } from "@ares/core/console.js";
import { format, regexMap } from "@ares/core/dataDescriptors.js";
import { Datasource } from "@ares/core/datasources.js";
import { Geocoders } from "@ares/core/geographical.js";
import { encrypt, decrypt, encryptText } from "@ares/core/security.js";
import {
  configureScriptsRuntime,
  getTypeByName,
  registerType,
  resetScriptsRuntime,
  unregisterType,
} from "@ares/core/scripts.js";
import { XHRWrapper } from "@ares/core/xhr.js";
import * as permissionsModule from "@ares/core/permissions.js";
import * as geographicalModule from "@ares/core/geographical.js";
import { setupPropertyAlias, onPropertyChange } from "@ares/core/objects.js";

function uniqueName(suffix) {
  return `core-smoke-${suffix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

class FakeDatasourceDriver {
  constructor(connectionParameters, datasource, sessionId, connectionSettingName, isProduction) {
    this.connectionParameters = connectionParameters;
    this.datasource = datasource;
    this.sessionId = sessionId;
    this.connectionSettingName = connectionSettingName;
    this.isProduction = isProduction;
    this.startedTransactions = [];
    this.committedTransactions = [];
    this.rolledBackTransactions = [];
  }

  async setPool() {
    this.pool = { ready: true };
    return this.pool;
  }

  async nativeConnect() {
    this.isOpen = true;
    return this;
  }

  startTransaction(name) {
    this.startedTransactions.push(name);
  }

  commit(name) {
    this.committedTransactions.push(name);
  }

  rollback(name) {
    this.rolledBackTransactions.push(name);
  }

  async _executeNativeQueryAsync(command, params, mapper, request) {
    return {
      results: [{ ok: true, command, mapper: mapper.name }],
      meta: {
        params,
        sessionId: this.sessionId,
        requestKeys: Object.keys(request),
      },
    };
  }
}

test("self-referenced exports resolve both canonical and legacy subpaths", async () => {
  const [rootModule, cryptoLegacy, cryptoCanonical, scriptsLegacy, consoleCanonical] = await Promise.all([
    import("@ares/core"),
    import("@ares/core/crypto"),
    import("@ares/core/crypto.js"),
    import("@ares/core/scripts"),
    import("@ares/core/console.js"),
  ]);

  assert.equal(typeof rootModule.default, "function");
  assert.equal(typeof rootModule.ARES, "function");
  assert.equal(typeof cryptoLegacy.getSHA256Hash, "function");
  assert.equal(cryptoLegacy.getSHA256Hash("abc"), cryptoCanonical.getSHA256Hash("abc"));
  assert.equal(typeof scriptsLegacy.getFunctionParameters, "function");
  assert.equal(typeof consoleCanonical.asyncConsole.log, "function");
});

test("bootstrap validates setup and duplicate policies", () => {
  assert.throws(
    () => aReSInitialize({ name: "   ", environments: [] }),
    /setup\.name/
  );

  const baseName = uniqueName("bootstrap");
  const first = aReSInitialize(
    {
      name: ` ${baseName} `,
      environments: [{ selected: true, type: "production" }],
    },
    { onDuplicate: "replace" }
  );

  assert.equal(first.appSetup.name, baseName);
  assert.equal(first.isProduction, true);
  assert.equal(ARES.getInstance(baseName), first);

  const reused = aReSInitialize(
    { name: baseName, environments: [] },
    { onDuplicate: "reuse" }
  );
  assert.equal(reused, first);

  const replaced = aReSInitialize(
    { name: baseName, environments: [] },
    { onDuplicate: "replace" }
  );
  assert.notEqual(replaced, first);
  assert.equal(ARES.getInstance(baseName), replaced);
});

test("permissions runtime module exposes filtering helpers on the aReS instance", () => {
  const aReS = aReSInitialize(
    {
      name: uniqueName("permissions"),
      environments: [],
      permissions: [
        {
          hosts: ["api.local"],
          methods: ["GET"],
          allowedResource: ["users.*"],
          allowOnlyForUserId: ["alice"],
        },
      ],
    },
    { onDuplicate: "replace" }
  );

  aReS.include(permissionsModule);

  assert.equal(typeof aReS.getPermission, "function");
  assert.equal(typeof aReS.isResourceAllowed, "function");
  assert.equal(
    aReS.getPermission({ host: "api.local", userId: "alice", method: "GET" }).length,
    1
  );
  assert.equal(
    aReS.isResourceAllowed("users.list", { host: "api.local", userId: "alice", method: "GET" }),
    true
  );
  assert.equal(
    aReS.isResourceAllowed("users.list", { host: "api.local", userId: "bob", method: "GET" }),
    false
  );
});

test("bootstrap normalizes runtime config and policies behind dedicated accessors", () => {
  const aReS = aReSInitialize(
    {
      name: uniqueName("config"),
      environments: [],
      policies: {
        permissions: [
          {
            hosts: ["internal.local"],
            allowedResource: ["reports.*"],
          },
        ],
      },
      config: {
        geocoders: {
          enabled: [{ name: "OpenStreetMap" }],
        },
      },
    },
    { onDuplicate: "replace" }
  );

  aReS.include(permissionsModule);
  aReS.include(geographicalModule);

  assert.deepEqual(aReS.getPolicy("permissions"), [
    {
      hosts: ["internal.local"],
      allowedResource: ["reports.*"],
    },
  ]);
  assert.deepEqual(aReS.getConfig("geocoders.enabled"), [{ name: "OpenStreetMap" }]);
  assert.equal(
    aReS.isResourceAllowed("reports.list", { host: "internal.local", method: "GET" }),
    true
  );
  assert.deepEqual(aReS.getGeocoder("it").config, [{ name: "OpenStreetMap" }]);
});

test("bootstrap propagates logging config and redacts diagnostic payloads", () => {
  const emitted = [];
  resetLoggingConfig();

  const aReS = aReSInitialize(
    {
      name: uniqueName("logging"),
      environments: [],
      config: {
        logging: {
          diagnostics: true,
          debug: true,
          writer: (level, ...args) => emitted.push({ level, args }),
        },
      },
    },
    { onDuplicate: "replace" }
  );

  asyncConsole.log("datasource", {
    user: "alice",
    password: "super-secret",
    authorization: "Bearer hidden",
    apiKey: "key-123",
  });
  asyncConsole.output("datasource");

  assert.equal(aReS.getLoggingConfig().diagnostics, true);
  assert.equal(aReS.getLoggingConfig().debug, true);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].level, "log");
  assert.match(emitted[0].args[0], /\[datasource\]/);
  assert.match(emitted[0].args[0], /\[REDACTED\]/);
  assert.doesNotMatch(emitted[0].args[0], /super-secret|Bearer hidden|key-123/);

  resetLoggingConfig();
});

test("scripts runtime resolves builtins and requires explicit opt-in for custom global types", () => {
  class WorkspaceOnlyType {}

  resetScriptsRuntime();
  globalThis.WorkspaceOnlyType = WorkspaceOnlyType;

  assert.equal(getTypeByName("string"), String);
  assert.equal(getTypeByName("WorkspaceOnlyType"), null);

  configureScriptsRuntime({
    allowGlobalTypeLookup: true,
    allowedGlobalTypes: ["WorkspaceOnlyType"],
  });
  assert.equal(getTypeByName("WorkspaceOnlyType"), WorkspaceOnlyType);

  delete globalThis.WorkspaceOnlyType;
  resetScriptsRuntime();
});

test("scripts runtime resolves registered custom types without global lookup", () => {
  class RegisteredType {}

  resetScriptsRuntime();
  registerType("RegisteredType", RegisteredType);

  assert.equal(getTypeByName("RegisteredType"), RegisteredType);

  unregisterType("RegisteredType");
  resetScriptsRuntime();
});

test("geocoder uses explicit networking, provider policy and quota configuration", async () => {
  const originalAxiosGet = axios.get;
  const originalPrimary = Geocoders.PrimaryProvider;
  const originalFallback = Geocoders.FallbackProvider;
  const requests = [];

  Geocoders.PrimaryProvider = {
    coordinatesInfoURL: "https://primary.test/search?q={address}&lang={language}",
    addressInfoURL: "https://primary.test/reverse?lat={latitude}&lon={longitude}&lang={language}",
    canonize: async (data) => data,
  };
  Geocoders.FallbackProvider = {
    coordinatesInfoURL: "https://fallback.test/search?q={address}&lang={language}",
    addressInfoURL: "https://fallback.test/reverse?lat={latitude}&lon={longitude}&lang={language}",
    canonize: async (data) => data,
  };

  axios.get = async (url, options = {}) => {
    requests.push({ url, options });
    if (url.startsWith("https://fallback.test")) {
      return { data: [{ provider: "fallback", address: "Rome" }] };
    }
    throw {
      response: { status: 503, statusText: "Service Unavailable" },
      request: {},
    };
  };

  try {
    const aReS = aReSInitialize(
      {
        name: uniqueName("geocoding-policy"),
        environments: [],
        config: {
          geocoders: {
            enabled: [
              { name: "QuotaProvider", quota: { remaining: 0 } },
              { name: "PrimaryProvider" },
              { name: "FallbackProvider" },
            ],
            policy: {
              continueOnError: true,
              providerOrder: ["QuotaProvider", "PrimaryProvider", "FallbackProvider"],
            },
            networking: {
              timeout: 1234,
              retries: 1,
              retryDelayMs: 0,
              headers: {
                "X-Test": "enabled",
              },
            },
          },
        },
      },
      { onDuplicate: "replace" }
    );

    aReS.include(geographicalModule);
    const result = await aReS.getGeocoder("it").encode("Roma");

    assert.deepEqual(result, [{ provider: "fallback", address: "Rome" }]);
    assert.equal(requests.length, 3);
    assert.ok(requests.every((request) => request.options.timeout === 1234));
    assert.ok(requests.every((request) => request.options.headers["X-Test"] === "enabled"));
    assert.equal(requests[0].url.startsWith("https://primary.test"), true);
    assert.equal(requests[2].url.startsWith("https://fallback.test"), true);
  } finally {
    axios.get = originalAxiosGet;
    if (originalPrimary) Geocoders.PrimaryProvider = originalPrimary;
    else delete Geocoders.PrimaryProvider;
    if (originalFallback) Geocoders.FallbackProvider = originalFallback;
    else delete Geocoders.FallbackProvider;
  }
});

test("xhr wrapper applies explicit timeout and retries for transient statuses", async () => {
  const originalAdapter = axios.defaults.adapter;
  const calls = [];

  axios.defaults.adapter = async (config) => {
    calls.push(config);
    if (calls.length === 1) {
      return {
        status: 503,
        statusText: "Service Unavailable",
        data: { ok: false },
        headers: {},
        config,
      };
    }
    return {
      status: 200,
      statusText: "OK",
      data: { ok: true },
      headers: {},
      config,
    };
  };

  try {
    const xhr = new XHRWrapper("https://api.test", null, false, {
      timeout: 4321,
      retries: 1,
      retryDelayMs: 0,
      retryOnStatuses: [503],
    });

    const response = await xhr.get("/users", { page: 1 });

    assert.equal(response.status, 200);
    assert.deepEqual(response.results, { ok: true });
    assert.equal(calls.length, 2);
    assert.ok(calls.every((config) => config.timeout === 4321));
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});

test("data descriptors resolve identity hashes through datasource getHashKey", async () => {
  const aReS = aReSInitialize(
    {
      name: uniqueName("identity"),
      environments: [],
    },
    { onDuplicate: "replace" }
  );

  const datasource = new Datasource(aReS, {
    name: "IdentityDatasource",
    environments: {},
  });

  const originalValue = "users.id";
  const hashedValue = datasource.getKeyHash(originalValue);
  const formatted = await format(
    { identity: hashedValue },
    { identity: { type: regexMap.identity.id } },
    datasource
  );

  assert.equal(formatted.identity, originalValue);
});

test("legacy setup keys are still normalized into runtime config and policies", () => {
  const aReS = aReSInitialize(
    {
      name: uniqueName("legacy-config"),
      environments: [],
      permissions: [
        {
          hosts: ["legacy.local"],
          allowedResource: ["legacy.*"],
        },
      ],
      enabledGeoCoders: [{ name: "GoogleMaps", apikey: "test-key" }],
    },
    { onDuplicate: "replace" }
  );

  assert.deepEqual(aReS.getPolicy("permissions"), [
    {
      hosts: ["legacy.local"],
      allowedResource: ["legacy.*"],
    },
  ]);
  assert.deepEqual(aReS.getConfig("geocoders.enabled"), [
    { name: "GoogleMaps", apikey: "test-key" },
  ]);
});

test("datasource runtime works with minimal requests and without permissions module", async () => {
  const aReS = aReSInitialize(
    {
      name: uniqueName("datasource"),
      environments: [],
    },
    { onDuplicate: "replace" }
  );

  const datasource = new Datasource(aReS, {
    name: "Orders",
    environments: {
      test: {
        default: {
          driver: FakeDatasourceDriver,
        },
      },
      production: {
        default: {
          driver: FakeDatasourceDriver,
        },
      },
    },
  });

  const mapper = {
    name: "list",
    connectionSetting: "default",
    transaction: true,
    mapParameters: async (request) => ({ filter: request.filter ?? null }),
  };
  const request = { filter: "recent" };

  const firstConnection = await datasource.getConnection(request, mapper);
  const secondConnection = await datasource.getConnection(request, mapper);
  const response = await datasource.query(request, "SELECT 1", mapper);

  assert.equal(firstConnection, secondConnection);
  assert.equal(typeof firstConnection.sessionId, "string");
  assert.match(firstConnection.sessionId, /^anonymous-/);
  assert.deepEqual(request.executedTransactionSteps, ["list[0]"]);
  assert.equal(request.transactionIndex, 0);
  assert.deepEqual(firstConnection.startedTransactions, ["list[0]"]);
  assert.deepEqual(firstConnection.committedTransactions, ["list[0]"]);
  assert.deepEqual(firstConnection.rolledBackTransactions, []);
  assert.deepEqual(response.results, [{ ok: true, command: "SELECT 1", mapper: "list" }]);
  assert.equal(response.meta.params.filter, "recent");
  assert.equal(response.meta.sessionId, firstConnection.sessionId);
});

test("security encrypt/decrypt keeps round-trip with dynamic salt", () => {
  const payload = {
    project: "aReS",
    nested: ["alpha", { value: "beta" }],
  };
  const password = "strong-pass-123";

  const encrypted = encrypt(payload, password);
  const decrypted = decrypt(encrypted, password);

  assert.notDeepEqual(encrypted, payload);
  assert.deepEqual(decrypted, payload);
});

test("security decrypt preserves compatibility with legacy static-salt ciphertext", () => {
  const password = "strong-pass-123";
  const legacyKey = crypto.pbkdf2Sync(password, "aReS-salt", 100000, 32, "sha256");
  const legacyEncrypted = encryptText("legacy-value", legacyKey);

  assert.equal(decrypt(legacyEncrypted, password), "legacy-value");
});

test("security decrypt preserves compatibility with legacy encrypted objects", () => {
  const password = "strong-pass-123";
  const legacyKey = crypto.pbkdf2Sync(password, "aReS-salt", 100000, 32, "sha256");
  const encryptedField = encryptText("serviceAccount", legacyKey);
  const encryptedValue = encryptText("legacy-json", legacyKey);

  const legacyPayload = {
    [encryptedField]: encryptedValue,
    "@aReS-encrypted": true,
  };

  assert.deepEqual(decrypt(legacyPayload, password), { serviceAccount: "legacy-json" });
});

test("object aliasing and property change hooks work together without recursion", () => {
  const target = { valueName: 1 };
  const changes = [];

  onPropertyChange(target, "valueName", (value, key, owner, previousValue) => {
    changes.push({ value, key, owner, previousValue });
  });
  setupPropertyAlias(target, "value");

  assert.equal(target.value, 1);
  target.value = 2;

  assert.equal(target.valueName, 2);
  assert.equal(target.value, 2);
  assert.equal(changes.length, 1);
  assert.deepEqual(changes[0], {
    value: 2,
    key: "valueName",
    owner: target,
    previousValue: 1,
  });
});
