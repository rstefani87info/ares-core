class XHRWrapper {
    constructor(baseURL, token) {
      this.baseURL = baseURL;
      this.token = token;
    }
  
    static objectToQueryString(obj) {
      return Object.keys(obj)
        .filter((key) => obj[key] !== undefined && obj[key] !== null)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
    }
  
    getXHR(method, url, data = null, options = {}, async = true) {
      const xhr = new XMLHttpRequest();
      const fullUrl = this.baseURL + url + (method === 'GET' && data ? '?' + XHRWrapper.objectToQueryString(data) : '');
      xhr.open(method, fullUrl, async);
  
      // Set headers
      xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (options.headers) {
        Object.keys(options.headers).forEach((key) => {
          xhr.setRequestHeader(key, options.headers[key]);
        });
      }
  
      if (async) {
        return new Promise((resolve, reject) => {
          xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
              } else {
                reject((xhr.response && JSON.parse(xhr.response).message) || 'Something went wrong');
              }
            }
          };
  
          xhr.onerror = () => reject('Something went wrong');
          xhr.send(data ? JSON.stringify(data) : null);
        });
      } else {
        xhr.send(data ? JSON.stringify(data) : null);
        if (xhr.status >= 200 && xhr.status < 300) {
          return JSON.parse(xhr.responseText);
        } else {
          throw new Error((xhr.response && JSON.parse(xhr.response).message) || 'Something went wrong');
        }
      }
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
  