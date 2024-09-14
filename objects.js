//TODO: import numeral from 'numeral';

/**
 * @prototype {Object} 
 * @param {Object} this_object 
 * @param {string} alias
 * 
 * Find property key by alias
 */
export function findPropKeyByAlias(this_object, alias) {
	for (const k in this_object) {
		if (alias.match(k)) return k;
	}
}
/**
 * @prototype {Object}  
 * @param {Object} this_object
 * @param {string} alias
 * 
 * Find property value by alias
 */
export function findPropValueByAlias(this_object, alias) {
	for (const k in this_object) {
		if(typeof k)
		if (alias.match(k)) return this_object[k];
	}
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
			get: function() {
				return findPropValueByAlias(this, alias);
			},
			set: function(value) {
				this[findPropKeyByAlias(this, alias)] = value;
			}
		});
	}

}

/**
 * @prototype {string}
 * @param {string} this_file
 * @returns {Object}
 * 
 * Parse file content as object
 * 
 */
export async function requireData(this_file) {
	return (await import(this_file)).default;
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
  export function fieldsMatch(this_object,other){
	return Object.keys(this_object).every(k => this_object[k] === other[k]);
  }