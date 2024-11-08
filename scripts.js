/**
 * @author Roberto Stefani
 * @license MIT
 */


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
  if(!this_function && !this_function instanceof Function) return null;
  const parameters = [];
  const s = f.toString();
  const { params } = s.match(
    /^\s*function\s*\w+\s*\((?<params>.*)\)\s*\{.*$/gm
  ).groups;
  const tokens = params.split(params);
  for (t of tokens) {
    const { commentLeft, multiple, name, value, commentRight } = t.match(
      /(?<commentLeft>\/\*.*\*\/)*\s*(?<multiple>[.]{3}){0,1}\s*(?<name>\w+)\s*(=\s*(?<value>".*"|'.*'|(\w)+))(?<commentRight>\/\*.*\*\/)*\s*/i
    ).groups;
    parameters.push({
      name: name,
      defaultValue: value,
      multiple: multiple,
      commentLeft: commentLeft,
      commentRight: commentRight,
    });
  }
  return parameters;
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
  const functionName = getFunctionName(this_function);
  if (functionName) {
    const params = getFunctionParameters(this_function);
    return new Function(
      "(" +
        params
          .filter((p) => !p.name.match(/^this_[\w]+$/))
          .map(
            (p) =>
              p.commentLeft ??
              "" + " " + p.multiple ??
              "" +
                p.name +
                (p.defaultValue ? "=" + p.defaultValue : "") +
                " " +
                p.commentRight
          )
          .join(",") +
        ")=>" +
        functionName +
        "(" +
        params.join(",") +
        ")"
    );
  }
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
  return facadeOnObject(
    this_function,
    scriptsUtility.getTypeByName(pa.type).prototype,
    alias
  );
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
  return global[this_string] || window[this_string];
}

/**
 * @prototype {function} getName
 * @param {function} this_function
 * 	@returns {string}
 *
 * Get function name
 */
export function getFunctionName(this_function) {
  const f = this_function.toString().match(/function\s*([^\s(]+)\s*\(/);
  return f && f.length > 0 ? f[1] : null;
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
function isAsyncFunction(this_function) {
  return this_function.constructor.name === 'AsyncFunction';
}
