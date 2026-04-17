/**
 * @author Roberto Stefani
 * @license MIT
 * A collection of base utilities of aReS framework.
 */

import { configureLogging, getLoggingConfig } from "./console.js";
import { configureScriptsRuntime, getScriptsRuntimeConfig } from "./scripts.js";

const INSTANCE_DUPLICATE_POLICIES = new Set(["throw", "replace", "reuse"]);
const instancesRegistry = new Map();

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clonePlainObject(value) {
    return isPlainObject(value) ? { ...value } : {};
}

function getNestedValue(source, path) {
    if (!path) return source;

    return String(path)
        .split(".")
        .filter(Boolean)
        .reduce((currentValue, key) => {
            if (!isPlainObject(currentValue) && !Array.isArray(currentValue)) {
                return undefined;
            }

            return currentValue[key];
        }, source);
}

function normalizePolicies(setup) {
    const policies = clonePlainObject(setup?.policies);

    if (!("permissions" in policies) && Array.isArray(setup?.permissions)) {
        policies.permissions = [...setup.permissions];
    }

    return policies;
}

function normalizeConfig(setup) {
    const config = clonePlainObject(setup?.config);
    const geocoders = clonePlainObject(config.geocoders);
    const logging = clonePlainObject(config.logging);

    if (!Array.isArray(geocoders.enabled) && Array.isArray(setup?.enabledGeoCoders)) {
        geocoders.enabled = [...setup.enabledGeoCoders];
    }

    if (isPlainObject(setup?.logging)) {
        Object.assign(logging, setup.logging);
    }

    if (Object.keys(geocoders).length > 0) {
        config.geocoders = geocoders;
    }

    if (Object.keys(logging).length > 0) {
        config.logging = logging;
    }

    return config;
}

function normalizeSetup(setup = {}) {
    const normalizedSetup = setup ?? {};
    const name = typeof normalizedSetup.name === "string" ? normalizedSetup.name.trim() : "";

    if (!name) {
        throw new TypeError("aReS bootstrap requires a non-empty setup.name");
    }

    return {
        ...normalizedSetup,
        name,
        environments: Array.isArray(normalizedSetup.environments) ? normalizedSetup.environments.filter(Boolean) : [],
        config: normalizeConfig(normalizedSetup),
        policies: normalizePolicies(normalizedSetup)
    };
}

function normalizeDuplicatePolicy(options = {}) {
    const onDuplicate = options?.onDuplicate ?? "throw";

    if (!INSTANCE_DUPLICATE_POLICIES.has(onDuplicate)) {
        throw new TypeError(`Unsupported onDuplicate policy "${onDuplicate}"`);
    }

    return onDuplicate;
}

export class ARES {
    constructor(setup){
        this.appSetup = setup;
        this.idMap = { idKeyMap:{}, hashKeyMap:{} };
    }

    set appSetup(setup){
        const previousName = this._appSetup?.name;
        const nextSetup = normalizeSetup(setup);

        if (
            previousName &&
            previousName !== nextSetup.name &&
            instancesRegistry.get(previousName) === this
        ) {
            if (instancesRegistry.has(nextSetup.name)) {
                throw new Error(`ARES instance "${nextSetup.name}" already exists`);
            }

            instancesRegistry.delete(previousName);
            instancesRegistry.set(nextSetup.name, this);
        }

        this._appSetup = nextSetup;
    }

    get appSetup() { return this._appSetup; }

    getConfig(path, fallbackValue = undefined) {
        const value = getNestedValue(this._appSetup?.config, path);
        return value === undefined ? fallbackValue : value;
    }

    getPolicy(name, fallbackValue = undefined) {
        const value = getNestedValue(this._appSetup?.policies, name);
        return value === undefined ? fallbackValue : value;
    }

    set idMap(idMap){
        this._idMap = idMap;
    }
   
    get idMap(){
      return this._idMap;
    }

    get isProduction(){
        return this._appSetup.environments.some(
            (x) => x?.selected && typeof x?.type === "string" && x.type.toLowerCase() === "production"
        );
    }

    include(module){
        if (typeof module?.aReSInitialize !== "function") {
            throw new TypeError("Included module must expose aReSInitialize(aReS)");
        }

        return module.aReSInitialize(this);
    }

    static get instances() {
        return Object.freeze(Object.fromEntries(instancesRegistry.entries()));
    }

    static register(instance, options = {}) {
        const onDuplicate = normalizeDuplicatePolicy(options);
        const name = instance?.appSetup?.name;

        if (!name) {
            throw new TypeError("Cannot register an ARES instance without appSetup.name");
        }

        const existingInstance = instancesRegistry.get(name);

        if (!existingInstance) {
            instancesRegistry.set(name, instance);
            return instance;
        }

        if (existingInstance === instance) {
            return instance;
        }

        if (onDuplicate === "reuse") {
            return existingInstance;
        }

        if (onDuplicate === "replace") {
            instancesRegistry.set(name, instance);
            return instance;
        }

        throw new Error(`ARES instance "${name}" already exists`);
    }
    
    static getInstance(name){
        return instancesRegistry.get(name);
    }
}

export default function aReSInitialize(setup, options = {}){
    const aReS = new ARES(setup);
    aReS.configureLogging = (overrides = {}) =>
        configureLogging({ ...aReS.getConfig("logging", {}), ...overrides });
    aReS.getLoggingConfig = () => getLoggingConfig();
    aReS.configureLogging();
    aReS.configureScriptsRuntime = (overrides = {}) =>
        configureScriptsRuntime({ ...aReS.getConfig("scripts", {}), ...overrides });
    aReS.getScriptsRuntimeConfig = () => getScriptsRuntimeConfig();
    aReS.configureScriptsRuntime();
    return ARES.register(aReS, options);
}



