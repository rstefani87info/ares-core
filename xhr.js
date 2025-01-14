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
    const data = {};
    for (const key in dataUpload) {
      if (
        dataUpload[key] !== undefined &&
        dataUpload[key] !== originalData[key]
      ) {
        data[key] = dataUpload[key];
      }
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
