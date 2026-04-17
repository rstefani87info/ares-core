import axios from "axios";

const DEFAULT_HTTP_RUNTIME_CONFIG = Object.freeze({
  timeout: 0,
  retries: 0,
  retryDelayMs: 0,
  retryOnStatuses: [408, 425, 429, 500, 502, 503, 504],
  headers: {},
});

function delay(ms) {
  if (!ms) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHTTPRuntimeConfig(config = {}) {
  return {
    ...DEFAULT_HTTP_RUNTIME_CONFIG,
    ...config,
    retryOnStatuses: Array.isArray(config.retryOnStatuses)
      ? [...new Set(config.retryOnStatuses.map((value) => Number(value)).filter(Number.isFinite))]
      : [...DEFAULT_HTTP_RUNTIME_CONFIG.retryOnStatuses],
    headers: typeof config.headers === "object" && config.headers !== null
      ? { ...config.headers }
      : {},
  };
}

function shouldRetryStatus(status, retryOnStatuses = []) {
  return retryOnStatuses.includes(Number(status));
}

function buildXHRResponse({ status = 500, message = "Something went wrong", url = null, results = null, error = null }) {
  const response = {
    status,
    message,
    url,
    results,
  };

  if (error) {
    response["€rror"] = error;
  }

  return response;
}

export class XHRWrapper {
  constructor(baseURL, token = null, isProduction = false, runtimeConfig = {}) {
    this.baseURL = baseURL;
    this.token = token;
    this.isProduction = isProduction;
    this.runtimeConfig = normalizeHTTPRuntimeConfig(runtimeConfig);
  }

  static objectToQueryString(obj) {
    return Object.keys(obj)
      .filter((key) => obj[key] !== undefined && obj[key] !== null)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`
      )
      .join("&");
  }

  setToken(token) {
    this.token = token;
  }

  setRuntimeConfig(runtimeConfig = {}) {
    this.runtimeConfig = normalizeHTTPRuntimeConfig(runtimeConfig);
  }

  async getXHR(method, url, data = null, options = {}) {
    const fullUrl = this.baseURL + url;
    const requestRuntimeConfig = normalizeHTTPRuntimeConfig({
      ...this.runtimeConfig,
      ...(options?.networking ?? {}),
      headers: {
        ...this.runtimeConfig.headers,
        ...(options?.networking?.headers ?? {}),
      },
    });
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        ...requestRuntimeConfig.headers,
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...(method.match(/POST|PATCH|PUT/i) && {
          "Content-Type": "application/json",
        }),
        ...(options?.headers || {}),
      },
      timeout: requestRuntimeConfig.timeout,
      validateStatus() {
        return true;
      },
    };

    if (method.match(/GET|DELETE/i) && data) {
      config.params = data;
    }

    if (method.match(/POST|PATCH|PUT/i) && data) {
      config.data = data;
    }

    try {
      for (let attempt = 0; attempt <= requestRuntimeConfig.retries; attempt++) {
        const response = await axios(config);
        if (
          response.status >= 400 &&
          attempt < requestRuntimeConfig.retries &&
          shouldRetryStatus(response.status, requestRuntimeConfig.retryOnStatuses)
        ) {
          await delay(requestRuntimeConfig.retryDelayMs);
          continue;
        }
        const message = response.statusText || (response.status >= 400 ? "Something went wrong" : null);

        return buildXHRResponse({
          status: response.status,
          message,
          url: fullUrl,
          results: response.data,
          error: response.status >= 400 ? message : null,
        });
      }
    } catch (error) {
      if (
        shouldRetryStatus(error?.response?.status, requestRuntimeConfig.retryOnStatuses) &&
        requestRuntimeConfig.retries > 0
      ) {
        for (let attempt = 0; attempt < requestRuntimeConfig.retries; attempt++) {
          await delay(requestRuntimeConfig.retryDelayMs);
          try {
            const response = await axios(config);
            const message = response.statusText || (response.status >= 400 ? "Something went wrong" : null);
            return buildXHRResponse({
              status: response.status,
              message,
              url: fullUrl,
              results: response.data,
              error: response.status >= 400 ? message : null,
            });
          } catch (retryError) {
            error = retryError;
          }
        }
      }
      const baseMessage = error?.response?.statusText || error.message || "Something went wrong";
      const message = this.isProduction || !error?.stack ? baseMessage : `${baseMessage}\n${error.stack}`;

      return buildXHRResponse({
        status: error?.response?.status ?? 500,
        message,
        url: fullUrl,
        results: error?.response?.data ?? null,
        error: message,
      });
    }
    return buildXHRResponse({
      status: 500,
      message: "Something went wrong",
      url: fullUrl,
      results: null,
      error: "Something went wrong",
    });
  }

  async get(url, data, options = {}) {
    return await this.getXHR("GET", url, data, options);
  }

  async post(url, data, options = {}) {
    return await this.getXHR("POST", url, data, options);
  }

  async patch(url, originalData, dataUpload, options = {}) {
    const isDifferent = (original, updated) => {
      if (original === updated) return false;
      if (typeof original !== 'object' || typeof updated !== 'object') return true;
      if (original === null || updated === null) return true;
      
      if (Array.isArray(original) && Array.isArray(updated)) {
        if (original.length !== updated.length) return true;
        return original.some((val, idx) => isDifferent(val, updated[idx]));
      }
      
      const keys = Object.keys(updated);
      return keys.some(key => isDifferent(original[key], updated[key]));
    };
    
    const data = {};
    for (const key in dataUpload) {
      if (
        dataUpload[key] !== undefined &&
        isDifferent(originalData[key], dataUpload[key])
      ) {
        data[key] = dataUpload[key];
      }
    }
    
    if (Object.keys(data).length === 0) {
      return buildXHRResponse({
        status: 304,
        message: "No changes detected",
        url: this.baseURL + url,
        results: originalData,
      });
    }
    
    return await this.getXHR("PATCH", url, data, options);
  }

  async delete(url, data, options = {}) {
    return await this.getXHR("DELETE", url, data, options);
  }

  async put(url, data, options = {}) {
    return await this.getXHR("PUT", url, data, options);
  }
}
