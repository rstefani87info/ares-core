/**
 * @author Roberto Stefani
 * @license MIT
 */

const BUILTIN_TYPES = {
  string: String,
  number: Number,
  boolean: Boolean,
  array: Array,
  object: Object,
  function: Function,
  date: Date,
  regexp: RegExp,
};

const DEFAULT_SCRIPTS_RUNTIME_CONFIG = Object.freeze({
  allowGlobalTypeLookup: false,
  allowedGlobalTypes: [],
});

const registeredTypes = new Map();
let runtimeScriptsConfig = createScriptsRuntimeConfig();

function createScriptsRuntimeConfig(overrides = {}) {
  return {
    ...DEFAULT_SCRIPTS_RUNTIME_CONFIG,
    ...overrides,
    allowedGlobalTypes: Array.isArray(overrides.allowedGlobalTypes)
      ? [...new Set(overrides.allowedGlobalTypes.map((value) => String(value).trim()).filter(Boolean))]
      : [...DEFAULT_SCRIPTS_RUNTIME_CONFIG.allowedGlobalTypes],
  };
}

export function configureScriptsRuntime(overrides = {}) {
  runtimeScriptsConfig = createScriptsRuntimeConfig(overrides);
  return getScriptsRuntimeConfig();
}

export function getScriptsRuntimeConfig() {
  return {
    ...runtimeScriptsConfig,
    allowedGlobalTypes: [...runtimeScriptsConfig.allowedGlobalTypes],
  };
}

export function resetScriptsRuntime() {
  runtimeScriptsConfig = createScriptsRuntimeConfig();
  registeredTypes.clear();
}

export function registerType(name, type) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) {
    throw new TypeError("registerType requires a non-empty type name");
  }
  if (typeof type !== "function") {
    throw new TypeError(`Registered type "${normalizedName}" must be a constructor or function`);
  }
  registeredTypes.set(normalizedName, type);
  return type;
}

export function unregisterType(name) {
  const normalizedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedName) return false;
  return registeredTypes.delete(normalizedName);
}


/**
 * @prototype {function}
 */
export function getFunctionDocklet(this_function) {
  const fnString = this_function.toString();
  return getDocklet(fnString);
}

/**
 * @prototype {string}
 */
export function getDocklet(this_string) {
  const commentRegex = /\/\*\*([\s\S]*?)\*\//;
  const match = this_string?.match(commentRegex);

  if (match && match[1]) {
    return match[1].trim();
  } else {
    return null;
  }
}

/**
 * @prototype {function}
 * @param {function}
 * @returns {array}
 *
 * Get docklet annotations from function.
 *
 */

export function getFunctionDockletAnnotations(this_function) {
  const s = getFunctionDocklet(this_function) ?? "";
  return getDockletAnnotations(s);
}

/*
 * @prototype {string}
 * @param {string}
 * @returns {array}
 *
 * Get docklet annotations from string.
*/
export function getDockletAnnotations(this_string) {
  if (this_string) {
    const annotations = [];
    var last = { annotation: "commonDescription", description: "" };
    for (const l of this_string.replaceAll(/\r/g, "").split("\n")) {
      var desc = l?.match(/^[\s\/*]*\s*(?<description>.*)/)[0] ?? "";
      var match = l?.match(
        /\*\s*@(?<anno>[\w\|]+)\s*(?<type>\w+)?\s*(?<name>\w+)?\s*(?<note>.*)?/i
      );

      if (match) {
        const { anno, type, name, note } = match.groups;
        last = {
          annotation: anno.trim(),
          type: type?.trim(),
          name: name?.trim(),
          note: note?.trim(),
          toString: function() {
            return (this.annotation === 'commonDescription' ? '':this.annotation + 
            (this.type ? ' {' + this.type : '}') + (this.name ? ' ' + this.name : '') + (this.description ? ' - ' : ''))
            + (this.description ? this.description : '');
          }
        };
        annotations.push(last);
      } else last.description += desc ? "\n" + desc : "";
    }
    return annotations;
  }
  return [];
}

/**
 * @prototype {Function} getParameters
 * @param {function}
 * @returns {array}
 * Get function parameters
 *
 */
export function getFunctionParameters(this_function) {
  if (!(this_function instanceof Function)) return null;
  const fnString = this_function.toString().trim();
  const match =
    fnString.match(/^(?:async\s+)?function(?:\s+\w+)?\s*\((?<params>[\s\S]*?)\)/) ??
    fnString.match(/^(?:async\s*)?\((?<params>[\s\S]*?)\)\s*=>/) ??
    fnString.match(/^(?:async\s*)?(?<params>[A-Za-z_$][\w$]*)\s*=>/);
  const paramsString = match?.groups?.params?.trim() ?? "";
  if (!paramsString) return [];
  return paramsString
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => {
      const paramMatch = token.match(/^(?<multiple>\.\.\.)?(?<name>[A-Za-z_$][\w$]*)(?:\s*=\s*(?<value>[\s\S]+))?$/);
      const { multiple, name, value } = paramMatch?.groups ?? {};
      return {
        name: name ?? token,
        defaultValue: value?.trim(),
        multiple: Boolean(multiple),
        commentLeft: null,
        commentRight: null,
      };
    });
}

/**
 * @prototype {function}
 * @param {function} this_function
 * @param {string} alias
 * @returns {function}
 * Create facade function
 *
 */
export function facade(this_function, alias = null) {
  if (!(this_function instanceof Function)) return null;
  const params = getFunctionParameters(this_function) ?? [];
  const facadeFunction = function (...args) {
    const invocationArgs = [];
    let argIndex = 0;
    for (const param of params) {
      if (/^this_[\w]+$/.test(param.name)) {
        invocationArgs.push(this);
      } else if (param.multiple) {
        invocationArgs.push(...args.slice(argIndex));
        argIndex = args.length;
      } else {
        invocationArgs.push(args[argIndex++]);
      }
    }
    return this_function.apply(this, invocationArgs);
  };
  Object.defineProperty(facadeFunction, "name", {
    value: alias || getFunctionName(this_function) || "facade",
    configurable: true,
  });
  return facadeFunction;
}

/**
 * @prototype {function}
 * @param {function} this_function
 * @param {string} type
 * @param {string} alias
 * @returns {function}
 *
 * Create facade function into prototype
 *
 */
export function facadeOnPrototype(this_function, type, alias = null) {
  const targetType = typeof type === "string" ? getTypeByName(type) : type;
  if (!targetType?.prototype) return null;
  return facadeOnObject(this_function, targetType.prototype, alias);
}

/**
 * @prototype {function}
 * @param {function} this_function
 * @param {object} object
 * @param {string} alias
 * @returns {function}
 *
 * Create facade function into object
 *
 */
export function facadeOnObject(this_function, object, alias = null) {
  const functionName = getFunctionName(this_function);
  if (functionName) {
    const name = alias ? alias : functionName;
    object[name] = facade(this_function, alias);
    return object[name];
  }
  return null;
}

/**
 * @prototype {string} reflect
 * @param {string} this_string
 *
 * Reflecta js type
 *
 */
export function getTypeByName(this_string) {
  if (typeof this_string !== "string" || !this_string.trim()) return null;
  const typeName = this_string.trim();
  const builtinType = BUILTIN_TYPES[typeName.toLowerCase()];
  if (builtinType) return builtinType;

  if (registeredTypes.has(typeName)) {
    return registeredTypes.get(typeName);
  }

  if (!runtimeScriptsConfig.allowGlobalTypeLookup) {
    return null;
  }

  if (
    runtimeScriptsConfig.allowedGlobalTypes.length > 0 &&
    !runtimeScriptsConfig.allowedGlobalTypes.includes(typeName)
  ) {
    return null;
  }

  const globalType = globalThis?.[typeName];
  return typeof globalType === "function" ? globalType : null;
}

/**
 * @prototype {function} getName
 * @param {function} this_function
 * 	@returns {string}
 *
 * Get function name
 */
export function getFunctionName(this_function) {
  if (!(this_function instanceof Function)) return null;
  return this_function.name?.trim() || null;
}

/**
 * Serialize an object to js code
 *
 * @param {string} name
 * @param {object} this_object
 * @param {boolean} quote
 * @param {boolean} jsonAssignation
 * @param {number} indentation
 * @prototype {Object}
 * @prototype {string}
 * @prototype {Number}
 * @prototype {boolean}
 *
 */
export function toJS(
  name,
  this_object,
  quote = false,
  jsonAssignation = true,
  indentation = 0
) {
  const indentationString = "\t".repeat(indentation);
  if (quote) name = `"${name}"`;
  const assignationString = jsonAssignation ? ":" : "=";
  const endLine = jsonAssignation ? ",\n" : ";\n";
  let serializedContent = `${indentationString}${name} ${assignationString} `;
  if (typeof this_object === "function") {
    serializedContent += `${this_object.toString()} `;
  } else if (typeof this_object === "object") {
    serializedContent += `{\n`;
    for (const key in this_object) {
      serializedContent += `${toJS(
        key,
        this_object[key],
        true,
        true,
        indentation + 1
      )}${endLine}`;
    }
    serializedContent += `\n}`;
  } else {
    serializedContent += `${JSON.stringify(this_object)} `;
  }
  serializedContent += `${endLine}`;
  return serializedContent;
}

 export class PropertyPointer {
  constructor(getter,setter) {
    this.getter = getter;
    this.setter = setter;
  }
  get(object) {
    return this.getter(object);
  }
  set (object, value) {
    return this.setter(object, value);
  }
} 

/**
 * @param {function} getter
 * @param {function} setter
 * 
 */
export function getPropertyPointer(getter,setter) {
  return new PropertyPointer(getter,setter);
}

/**
 * Gets a property from an object by a path. The path is a string with . (dot) separated
 * property names. The method returns the property value.
 * @param {object} object
 * @param {string} path
 * @returns {*}
 */
export function getByPropertyPath(object, path) {
  const pathArray = path.split(".");
  let result = object;
  for (let i = 0; i < pathArray.length; i++) {
    if (!result) return undefined;
    result = result[pathArray[i]];
  }
  return result;
}

/**
 * @prototype {function}
 * @param {function} this_function
 * @returns {boolean}
 *
 * Check if a function is async
 */
export function isAsyncFunction(this_function) {
  return this_function.constructor.name === 'AsyncFunction';
}


/**
 * Checks if a given value is a primitive.
 * 
 * @param {*} this_value - The value to check.
 * @returns {boolean} - Returns true if the value is a primitive, otherwise false.
 * 
 * @prototype {function}
 */

export function isPrimitive(this_value) {
  return this_value !== Object(this_value);
}
