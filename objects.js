//TODO: import numeral from 'numeral';

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
  regexMask = '/^\\s*\\$content\\s*$/im',
) {
  for (const k in this_object) {
    let regexK = null;
    if (typeof k === 'string') regexK = new RegExp(k);
    else if (k instanceof RegExp) regexK = k;
    if (regexK) {
      if (regexMask.includes('$content'))
        regexK = new RegExp(regexMask.replace('$content', regexK.source));
      if (alias.match(regexK)) return k;
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
  alias,
  regexMask = '/^\\s*\\$content\\s*$/im',
) {
  return (
    this_object[findPropKeyByAlias(this_object, alias, regexMask)] ?? undefined
  );
}

/**
 * @prototype {Object}
 * @param {Object} this_object
 * @param {string} alias
 *
 * Setup a property alias for the object property that match the alias regexp
 */
export function setupPropertyAlias(this_object, alias) {
  if (!obj.prototype.hasOwnProperty(alias)) {
    Object.defineProperty(obj.prototype, alias, {
      get: function () {
        return findPropValueByAlias(this, alias);
      },
      set: function (value) {
        this[findPropKeyByAlias(this, alias)] = value;
      },
    });
  }
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
	Object.defineProperty(this_object, key,{
	get: () => this_object[key],
    set: (value) => {
		console.warn('Property Change::', key, value);
		this_object[key] = value;
		if (callback && typeof callback === 'function') {
			callback(value,key,this_object);
		}
    },
  });
}
