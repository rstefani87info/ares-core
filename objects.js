//TODO: cambiare la logica;

/**
 * @prototype {Object}
 * @param {Object} this_object
 * @param {string} alias
 *
 * Find property key by alias
 */
export function findPropKeyByAlias(
  this_object,
  alias,
) {
  if (!this_object || alias == null) return undefined;
  const matcher = alias instanceof RegExp ? alias : new RegExp(String(alias));
  for (const k in this_object) {
    if (matcher.test(k)) {
      return k;
    }
  }
  return undefined;
}
/**
 * @prototype {Object}
 * @param {Object} this_object
 * @param {string} alias
 *
 * Find property value by alias
 */
export function findPropValueByAlias(
  this_object,
  alias
) {
  const key = findPropKeyByAlias(this_object, alias);
  return key !== undefined ? this_object?.[key] : undefined;
}

/**
 * @prototype {Object}
 * @param {Object} this_object
 * @param {string} alias
 *
 * Setup a property alias for the object property that match the alias regexp
 */
export function setupPropertyAlias(this_object, alias) {
  if (!this_object || !alias) return null;
  if (Object.prototype.hasOwnProperty.call(this_object, alias)) {
    return this_object;
  }
  Object.defineProperty(this_object, alias, {
    configurable: true,
    enumerable: false,
    get() {
      return findPropValueByAlias(this, alias);
    },
    set(value) {
      const key = findPropKeyByAlias(this, alias);
      if (key !== undefined) {
        this[key] = value;
      }
    },
  });
  return this_object;
}



/**
 * Creates a deep clone of an object, including all its methods.
 *
 * @param {Object} obj - The object to clone.
 * @return {Object} The cloned object.
 * @prototype {Object}
 */
export function cloneWithMethods(obj) {
  const newObj = Object.create(Object.getPrototypeOf(obj));
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'function') {
        newObj[key] = obj[key].bind(newObj);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  return newObj;
}

/**
 * Compare two objects to see if they are equal based on this_object keys and values
 *
 * @param {Object} this_object
 * @param {Object} other
 * @return {boolean}
 * @prototype {Object}
 */
export function fieldsMatch(this_object, other) {
  return Object.keys(this_object).every(k => this_object[k] === other[k]);
}

export function onPropertyChange(this_object, key, callback) {
  if (!this_object || !key) return null;
  const descriptor = Object.getOwnPropertyDescriptor(this_object, key);
  const originalGetter = descriptor?.get;
  const originalSetter = descriptor?.set;
  let currentValue = descriptor && "value" in descriptor ? descriptor.value : this_object[key];

  Object.defineProperty(this_object, key, {
    configurable: true,
    enumerable: descriptor?.enumerable ?? true,
    get() {
      return originalGetter ? originalGetter.call(this) : currentValue;
    },
    set(value) {
      const previousValue = originalGetter ? originalGetter.call(this) : currentValue;
      if (originalSetter) {
        originalSetter.call(this, value);
      } else {
        currentValue = value;
      }
      if (typeof callback === "function") {
        callback(value, key, this_object, previousValue);
      }
    },
  });
  return this_object;
}

/**
 * Fuse two objects together, combining all their properties. If the objects have properties with the same name, the value of the property in the second object is used.
 * If the value of the property in either object is an object itself, the objects are fused again recursively.
 * @param {Object} this_object - The first object to fuse
 * @param {Object} other - The second object to fuse
 * @return {Object} The fused object
 * @prototype {Object}
 */
export function fuseObjects(this_object, other, ...others){
  const doIt = () => {
    if(!this_object && !other) return null;
    if(!this_object && Array.isArray(other)) return [...other];
    if(!other && Array.isArray(this_object)) return [...this_object];
    if(!this_object && other) return {...other};
    if(!other && this_object) return {...this_object};
    let ret = {};
    if(Array.isArray(this_object) && Array.isArray(other)) return [...this_object,...other];
    if(this_object instanceof Object && other instanceof Object){
      (new Set([...Object.keys(this_object),...Object.keys(other)])).forEach((key) => {
        if( this_object[key]  && this_object[key]  instanceof Object && other[key] && other[key] instanceof Object ){
          ret[key] = fuseObjects(this_object[key] , other[key] );
        }
        else {
          if(this_object.hasOwnProperty(key))ret[key] = this_object[key];
          if(other.hasOwnProperty(key))ret[key] = other[key];
        }
      });
      return ret;
    } 
    return null;
  }

  const results = doIt();
  if(!others || !others.length) return results;
  return fuseObjects(results, ...others);
}
