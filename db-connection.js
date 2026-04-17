export const defaultConnectionCallback = (error) => {
  if (error) throw error;
};

export class DBConnection {
  constructor(
    connectionParameters,
    datasource,
    sessionId,
    connectionSettingName,
    isProduction = false
  ) {
    Object.assign(this, connectionParameters);
    this.datasource = datasource;
    this.sessionId = sessionId;
    this.name = connectionSettingName;
    this.isProduction = isProduction;
  }

  async nativeConnect(callback = defaultConnectionCallback) {
    throw new Error(
      "Missing " + this.constructor.name + " nativeConnect implementation!"
    );
  }

  async setPool() {
    const thisInstance = this;
    this.pool = await thisInstance.datasource.getPool(
      thisInstance.connectionSettingName,
      () => thisInstance.createPool()
    );
  }

  async createPool(connectionSettingName) {
    throw new Error(
      "Missing " + this.constructor.name + " createPool implementation!"
    );
  }
}
