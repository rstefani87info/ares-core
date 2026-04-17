import axios from "axios";
import { warn } from "./console.js";

const DEFAULT_GEOCODER_POLICY = Object.freeze({
  continueOnError: true,
  providerOrder: [],
});

const DEFAULT_GEOCODER_NETWORKING = Object.freeze({
  timeout: 5000,
  retries: 0,
  retryDelayMs: 0,
  retryOnStatuses: [408, 425, 429, 500, 502, 503, 504],
  headers: {},
});

function delay(ms) {
  if (!ms) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePolicy(policy = {}) {
  return {
    ...DEFAULT_GEOCODER_POLICY,
    ...policy,
    providerOrder: Array.isArray(policy.providerOrder)
      ? policy.providerOrder.map((entry) => String(entry).trim()).filter(Boolean)
      : [...DEFAULT_GEOCODER_POLICY.providerOrder],
  };
}

function normalizeNetworkingConfig(config = {}) {
  return {
    ...DEFAULT_GEOCODER_NETWORKING,
    ...config,
    retryOnStatuses: Array.isArray(config.retryOnStatuses)
      ? [...new Set(config.retryOnStatuses.map((value) => Number(value)).filter(Number.isFinite))]
      : [...DEFAULT_GEOCODER_NETWORKING.retryOnStatuses],
    headers: typeof config.headers === "object" && config.headers !== null
      ? { ...config.headers }
      : {},
  };
}

function orderProviders(providers, providerOrder = []) {
  if (!providerOrder.length) return providers;
  const orderMap = new Map(providerOrder.map((name, index) => [name, index]));
  return [...providers].sort((left, right) => {
    const leftIndex = orderMap.has(left.name) ? orderMap.get(left.name) : Number.MAX_SAFE_INTEGER;
    const rightIndex = orderMap.has(right.name) ? orderMap.get(right.name) : Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });
}

function shouldRetryStatus(status, retryOnStatuses = []) {
  return retryOnStatuses.includes(Number(status));
}

export function getGeocoder(aReS, language) {
  aReS.geocoder= aReS.geocoder ?? {};
  aReS.geocoder[language] = aReS.geocoder[language] ?? new Geocoder(aReS,language);
  return aReS.geocoder[language];
}

export function aReSInitialize(aReS){
  aReS.getGeocoder = (language) => getGeocoder(aReS, language);
}

export default aReSInitialize;

class Geocoder{
  constructor(aReS,language){
    this.aReS = aReS;
    this.config = aReS.getConfig?.("geocoders.enabled", []) ?? [];
    this.language = language ?? "en";
    this.networking = normalizeNetworkingConfig(aReS.getConfig?.("geocoders.networking", {}));
    this.policy = normalizePolicy(aReS.getConfig?.("geocoders.policy", {}));
    this.providerUsage = new Map();
  }

  async encode(address) {
    return this.doTillDone("encode", (geocoder, config) => this.getCoordinates(geocoder, address, config.apikey, config));
  }

  async decode({ latitude, latatitude, longitude }) {
    const resolvedLatitude = latitude ?? latatitude;
    return this.doTillDone("decode", (geocoder, config) => this.getAddress(geocoder, { latitude: resolvedLatitude, longitude }, config.apikey, config));
  }

  getProviders(operation = null) {
    const enabledProviders = this.config.filter((providerConfig) => this.isProviderEnabled(providerConfig, operation));
    return orderProviders(enabledProviders, this.policy.providerOrder);
  }

  isProviderEnabled(config, operation = null) {
    if (!config?.name || config.enabled === false) return false;
    if (operation && Array.isArray(config.operations) && !config.operations.includes(operation)) {
      return false;
    }
    return !this.isQuotaExceeded(config);
  }

  isQuotaExceeded(config) {
    const quota = config?.quota;
    if (!quota || typeof quota !== "object") return false;
    if (quota.enabled === false) return false;
    if (quota.exhausted === true) return true;
    const consumed = this.providerUsage.get(config.name) ?? 0;
    if (Number.isFinite(quota.remaining)) {
      return consumed >= Number(quota.remaining);
    }
    if (Number.isFinite(quota.limit)) {
      return consumed >= Number(quota.limit);
    }
    return false;
  }

  registerUsage(config) {
    const current = this.providerUsage.get(config.name) ?? 0;
    this.providerUsage.set(config.name, current + 1);
  }

  buildRequestOptions(config, options = {}) {
    const requestConfig = normalizeNetworkingConfig({
      ...this.networking,
      ...(config?.networking ?? {}),
      ...(options ?? {}),
      headers: {
        ...this.networking.headers,
        ...(config?.networking?.headers ?? {}),
        ...(options?.headers ?? {}),
      },
    });
    const { retries, retryDelayMs, retryOnStatuses, ...axiosOptions } = requestConfig;
    return {
      axiosOptions,
      retries,
      retryDelayMs,
      retryOnStatuses,
    };
  }

  async doTillDone(operation, doAction) {
    for (const config of this.getProviders(operation)) {
      const { name } = config;
      try {
        const geocoder = Geocoders[name];
        if (!geocoder) continue;
        if (typeof geocoder.canCall === "function" && !(await geocoder.canCall(config))) continue;
        const result = await doAction(geocoder, config);
        this.registerUsage(config);
        return result;
      } catch (e) {
        warn(`Geocoder ["${name}"] error:`, e);
        if (this.isQuotaExceeded(config) && config?.quota?.onExceeded === "error") {
          throw e;
        }
        if (!this.policy.continueOnError) {
          throw e;
        }
      }
    }
    return null;
  }

  async doForAll(doAction) {
    let result = null;
    for (const config of this.config) {
      try {
        const geocoder = Geocoders[config.name];
        if (!geocoder) continue;
        const partial = await doAction(geocoder, config);
        if (partial) result = result ? result.concat(partial) : partial;
      } catch (e) {
        warn(`Geocoder ["${config.name}"] error:`, e);
      }
    }
    return result;
  }

  async getInfo(url, providerConfig, options = {}) {
    const requestOptions = this.buildRequestOptions(providerConfig, options);
    for (let attempt = 0; attempt <= requestOptions.retries; attempt++) {
      try {
        const response = await axios.get(url, requestOptions.axiosOptions);
        return response.data;
      } catch (error) {
        const status = error?.response?.status;
        const canRetry =
          attempt < requestOptions.retries &&
          (shouldRetryStatus(status, requestOptions.retryOnStatuses) || Boolean(error?.request));
        if (canRetry) {
          await delay(requestOptions.retryDelayMs);
          continue;
        }
        if (error.response) throw new Error(`HTTP error: ${error.response.status} ${error.response.statusText}`);
        if (error.request) throw new Error("No response received from server.");
        throw new Error(`Error in setting up request: ${error.message}`);
      }
    }
  }

  async getAddress(config,{latitude, longitude}, apikey, providerConfig){
    const url = config.addressInfoURL.replace('{latitude}', latitude).replace('{longitude}', longitude).replace('{apikey}', apikey).replace('{language}', this.language);
    const data = await this.getInfo(url, providerConfig);
    const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [data].filter(Boolean);
    return Promise.all(items.map((info) => config.canonize(info, data)));
  }

  async getCoordinates(config, address, apikey, providerConfig){
    const url = config.coordinatesInfoURL.replace('{address}', encodeURIComponent(address)).replace('{apikey}', apikey).replace('{language}', this.language);
    const data = await this.getInfo(url, providerConfig);
    const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [data].filter(Boolean);
    return Promise.all(items.map((info) => config.canonize(info, data)));
  }
}

export function getCenterCoordinates(...coordinates) {
  const lats = coordinates.map(c => c.latitude);
  const lngs = coordinates.map(c => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  return {latitude: centerLat, longitude: centerLng};
}

export function getDistanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000;
}

export const Geocoders = {

  OpenStreetMap: {
    addressInfoURL: `https://nominatim.openstreetmap.org/reverse?lat={latitude}&lon={longitude}&format=json&accept-language={language}`,
    coordinatesInfoURL: `https://nominatim.openstreetmap.org/search?q={address}&format=json&accept-language={language}`,
    canonize: async (data) => {
      const newData = { ...data, latitude: data.lat, longitude: data.lon };
      delete newData.lat;
      delete newData.lon;
      if (newData.display_name) {
        newData.address = newData.display_name;
        delete newData.display_name;
      }
      return newData;
    },
  },

  GoogleMaps: {
    addressInfoURL: `https://maps.googleapis.com/maps/api/geocode/json?latlng={latitude},{longitude}&key={apikey}&language={language}`,
    coordinatesInfoURL: `https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={apikey}&language={language}`,
    canCall: async (config) => !config.billingAccountID || Boolean(config.apikey),
    canonize: async (data, rawData) => {
      if (rawData?.status === 'OVER_QUERY_LIMIT') throw new Error(`GoogleMaps OVER_QUERY_LIMIT: ${rawData.error_message}`);
      if (rawData?.status && rawData.status !== 'OK') throw new Error(`GoogleMaps ${rawData.status}: ${rawData.error_message || 'Request failed'}`);
      const newData = { ...data, latitude: data.geometry?.location?.lat, longitude: data.geometry?.location?.lng };
      if (newData.formatted_address) {
        newData.address = newData.formatted_address;
        delete newData.formatted_address;
      }
      return newData;
    },
  },
  
  };
  

  
