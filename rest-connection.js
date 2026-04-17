import { XHRWrapper } from "./xhr.js";
import { DBConnection } from "./db-connection.js";

export class RESTConnection extends DBConnection {
  constructor(
    connectionParameters,
    datasource,
    sessionId,
    connectionSettingName,
    isProduction = false
  ) {
    super(
      connectionParameters,
      datasource,
      sessionId,
      connectionSettingName,
      isProduction
    );
    this.networkingConfig =
      this.datasource?.aReS?.getConfig?.("networking.http", {}) ?? {};
    this.xhrWrapper = new XHRWrapper(
      this.host,
      sessionId,
      isProduction,
      this.networkingConfig
    );
  }

  async createPool() {
    return null;
  }

  async nativeConnect(callback) {
    this.xhrWrapper = new XHRWrapper(
      this.host,
      null,
      this.isProduction,
      this.networkingConfig
    );
    return this;
  }

  async _executeNativeQueryAsync(command, params, mapper, req) {
    if (mapper.isJWTSensible && mapper.getRESTApiToken)
      this.xhrWrapper.setToken(
        mapper.getRESTApiToken(req, this.datasource, this.datasource.aReS)
      );
    else if (mapper.isJWTSensible && !mapper.getRESTApiToken)
      throw new Error(
        `For Mapper: ${mapper.name} When a mapper has isJWTSensible = true, it needs to implement getRESTApiToken(req, datasource, aReS) function`
      );
    else this.xhrWrapper.setToken(null);
    return await this.executeNativeQueryAsync(
      { url: command, method: mapper.method },
      params,
      req.options
    );
  }

  async executeNativeQueryAsync(command, params, options = null) {
    command = typeof command === "string" ? JSON.parse(command) : command;
    if (!(command instanceof Object)) {
      throw new Error("Command must be an object or a stringified object");
    }
    const date = new Date();
    const response = {
      executionTime: date.getTime(),
      executionDateTime: date,
    };
    const responseValue = await this.xhrWrapper[
      command.method?.toLowerCase() || "get"
    ](command.url, params, options);
    response.response = responseValue;
    response.status = responseValue.status;
    response.message = responseValue.message;
    response.url = responseValue.url;
    response.results = responseValue.results;
    if (responseValue["€rror"]) {
      response["€rror"] = responseValue["€rror"];
    }
    return response;
  }
}
