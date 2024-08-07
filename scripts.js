
/**
 * @author Roberto Stefani
 * @license MIT
 */

/**
 * @prototype {string}
 */
export async function getFunctionsFromFile(this_string) {
  const file = this_string;
  const script = await import("file://" + import.meta.resolve(file));
  return Object.getOwnPropertyNames(script)
    .map((n) => script[n])
    .filter((x) => typeof x == "function");
}

/**
 * @prototype {function}
 */
export function getDocklet(this_function) {
  const fnString = this_function.toString();
  const commentRegex = /\/\*\*([\s\S]*?)\*\//;
  const match = fnString.match(commentRegex);

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

export function getDockletAnnotations(this_function) {
  const s = getDocklet(this_function) ?? "";
  if (s) {
    const annotations = [];
    var last = { annotation: "commonDescription", description: "" };
    for (const l of s.replaceAll(/\r/g, "").split("\n")) {
      var desc = l.match(/^[\s\/*]*\s*(?<description>.*)/)[0] ?? ""
      var match = l.match(
        /\*\s*@(?<anno>[\w\|]+)\s*(?<type>\w+)?\s*(?<name>\w+)?\s*(?<note>.*)?/i
      );
      
      if (match) {
        const { anno, type, name, note } = match.groups;
        last = {
          annotation: anno.trim(),
          type: type?.trim(),
          name: name?.trim(),
          note: note?.trim(),
        };
        annotations.push(last);
      } else last.description += desc ? "\n" + desc : "";
    }
    return annotations;
  }
  return [];
}

/**
 * @prototype {function} getParameters
 * @param {function}
 * @returns {array}
 * Get function parameters
 *
 */
export function getFunctionParameters(this_function) {
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
