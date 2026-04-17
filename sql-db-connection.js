import { getDockletAnnotations } from "./scripts.js";
import { DBConnection } from "./db-connection.js";

export class SQLDBConnection extends DBConnection {
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
  }

  insert(type, parameters) {
    const fields = [];
    const values = [];
    const newParams = [];
    Object.keys(parameters).forEach((key) => {
      fields.push(key);
      const newValue = this.checkInnerQuery(parameters[key]);
      values.push(newValue);
      if (newValue === "?") newParams.push(parameters[key]);
    });
    const command =
      "INSERT INTO " +
      type +
      " (" +
      fields.join(",") +
      ") VALUES (" +
      values.join(",") +
      ")";
    return {
      command,
      parameters: newParams,
    };
  }

  update(type, parameters) {
    const fields = [];
    const newParams = [];

    Object.keys(parameters.values).forEach((key) => {
      const newValue = this.checkInnerQuery(parameters.values[key]);
      fields.push(`${key}=${newValue}`);
      if (newValue === "?") newParams.push(parameters.values[key]);
    });

    let command = `UPDATE ${type} SET ${fields.join(",")}`;

    if (parameters.filter) {
      command += " WHERE ";
      if (typeof parameters.filter === "object") {
        command += Object.entries(parameters.filter)
          .map(([key, value]) => {
            const newValue = this.checkInnerQuery(value);
            if (newValue === "?") newParams.push(value);
            return `${key}=${newValue}`;
          })
          .join(" AND ");
      } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
        const filter = this.filterBy(...parameters.filter);
        command += filter.command;
        newParams.push(...filter.parameters);
      } else if (typeof parameters.filter === "string") {
        command += parameters.filter;
      }
    }

    return {
      command,
      parameters: newParams,
    };
  }

  delete(type, parameters) {
    let command = `DELETE FROM ${type}`;
    return this.executeFilteredAction(command, parameters);
  }

  executeFilteredAction(command, parameters) {
    const newParams = [];
    if (parameters.filter) {
      command += " WHERE ";
      if (typeof parameters.filter === "object") {
        command += Object.entries(parameters.filter)
          .map(([key, value]) => {
            const newValue = this.checkInnerQuery(value);
            if (newValue === "?") newParams.push(value);
            return `${key}=${newValue}`;
          })
          .join(" AND ");
      } else if (Array.isArray(parameters.filter) && parameters.filter.length) {
        const filter = this.filterBy(...parameters.filter);
        command += filter.command;
        newParams.push(...filter.parameters);
      } else if (typeof parameters.filter === "string") {
        command += parameters.filter;
      }
    }
    return {
      command,
      parameters: newParams,
    };
  }

  filterBy(...filters) {
    let groups = 0;
    const newParams = [];
    const command = filters
      .map((x) => {
        let ret = "x.expression";
        if (x.expression.match(/(\s\n\r){1,}BETWEEN(\s\n\r)*$/gi)) {
          newParams.push(
            this.checkInnerQuery(x.value[0]),
            this.checkInnerQuery(x.value[1])
          );
          ret += " BETWEEN ? AND ?";
        } else if (x.expression.match(/(\s\n\r){1,}IN(\s\n\r)*$/gi)) {
          newParams.push(x.value);
          ret += Array.isArray(x.value)
            ? (x.value.length > 1 ? " (" : " ") +
              x.value.map(this.checkInnerQuery).join(",") +
              (x.value.length > 1 ? ")" : "")
            : ("(" + this.checkInnerQuery(x.value) + ")")
                .replace(/^\(\(/g, "(")
                .replace(/\)\)$/g, ")");
        } else {
          newParams.push(this.checkInnerQuery(x));
          ret = x.expression + "?";
        }
        if (x.startGroup) {
          groups++;
          ret = " ( " + ret;
        }
        if (x.endGroup) {
          groups--;
          ret = ret + " ) ";
        }
        return ret;
      })
      .join(" ");
    return { command, parameters: newParams };
  }

  checkInnerQuery(parameter) {
    if (parameter && typeof parameter === "object" && "query" in parameter) {
      return "(" + parameter.query + ")";
    }
    return "?";
  }

  handleAnnotationTransformations(command, parameters) {
    let dockletMatch;
    let newParameters = [];
    const dockletRegex = /\/\*\*([\s\S]*?)\*\//;

    while ((dockletMatch = command.match(dockletRegex))) {
      const fullMatch = dockletMatch[0];
      const dockletContent = dockletMatch[1];
      const annotations = getDockletAnnotations(dockletContent);
      let generatedCommand = "";

      annotations.forEach((x) => {
        if (this[x.annotation] && typeof this[x.annotation] === "function") {
          const resolvedAnnotation = this[x.annotation](parameters);
          newParameters.push(...resolvedAnnotation.parameters);
          generatedCommand += (resolvedAnnotation?.command ?? "") + "\n";
        }
      });

      command = command.replace(
        fullMatch,
        "/* [PROCESSED] " + dockletContent + " */\n" + generatedCommand
      );
    }
    if (newParameters.length === 0) newParameters = parameters;
    return {
      command,
      parameters: newParameters,
    };
  }

  async _executeNativeQueryAsync(command, params, mapper, req) {
    const newCommand = this.handleAnnotationTransformations(command, params);
    return await this.executeNativeQueryAsync(
      newCommand.command,
      newCommand.parameters
    );
  }
}
