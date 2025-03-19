import axios from "axios";

export class XHRWrapper {
  constructor(baseURL, token = null) {
    this.baseURL = baseURL;
    this.token = token;
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
  async getXHR(method, url, data = null, options = {}) {
    const fullUrl = this.baseURL + url;
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...(method.match(/POST|PATCH/i) && {
          "Content-Type": "application/json",
        }),
        ...(options?.headers || {}),
      },
      validateStatus: function (status) {
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
      const response = await axios(config);
      let ret = {
        status: response.status,
        message: response.statusText,
        url: fullUrl,
      };
      ret = Object.assign({}, ret, response.data || (response.status >= 400? { message: response.statusMessage || "Something went wrong" }:null));
      return ret;
    } catch (error) {
      console.error('Error:', error);
      return { "€rror": error.message || "Something went wrong" };
    }
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
      return {
        status: 304, // Not Modified
        message: "No changes detected",
        url: this.baseURL + url,
        data: originalData
      };
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
