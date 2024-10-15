import axios from 'axios';

export class XHRWrapper {
    constructor(baseURL, token=null) {
      this.baseURL = baseURL;
      this.token = token;
    }
  
    static objectToQueryString(obj) {
      return Object.keys(obj)
        .filter((key) => obj[key] !== undefined && obj[key] !== null)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
    }
  
    setToken(token) {
      this.token = token;
    }
    getXHR(method, url, data = null, options = {}) {
      const fullUrl = this.baseURL + url; 
      const config = {
        method: method.toLowerCase(),
        url: fullUrl,
        headers: {
          ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
          ...(method.match(/POST|PATCH/i) && { 'Content-Type': 'application/json' }),
          ...(options.headers || {})
        }
      };
    
      // Aggiungere i parametri per GET o DELETE
      if (method.match(/GET|DELETE/i) && data) {
        config.params = data; // Axios gestisce automaticamente la query string
      }
    
      // Aggiungere il body per POST o PATCH
      if (method.match(/POST|PATCH/i) && data) {
        config.data = JSON.stringify(data);
      }
    
      return axios(config)
        .then((response) => {
          return response.data; 
        })
        .catch((error) => {
          if (error.response) {
            return {
              status: error.response.status,
              url: fullUrl,
              response: error.response.data || 'Something went wrong'
            };
          } else {
            return 'Something went wrong';
          }
        });
    }
  
    get(url, data, options = {}, async = true) {
      return this.getXHR('GET', url, data, options, async);
    }
  
    post(url, data, options = {}, async = true) {
      return this.getXHR('POST', url, data, options, async);
    }
  
    patch(url, originalData, dataUpload, options = {}, async = true) {
      const data = {};
      for (const key in dataUpload) {
        if (dataUpload[key] !== undefined && dataUpload[key] !== originalData[key]) {
          data[key] = dataUpload[key];
        }
      }
      return this.getXHR('PATCH', url, data, options, async);
    }
  
    delete(url, data, options = {}, async = true) {
      return this.getXHR('DELETE', url, data, options, async);
    }
  
    put(url, data, options = {}, async = true) {
      return this.getXHR('PUT', url, data, options, async);
    }
  }
  
