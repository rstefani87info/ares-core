const moment = require('moment');
const numeral = require('numeral');

/**
 * @prototype {Object}  
 */
function findPropKeyByAlias(this_object, alias) {
	for (const k in this_object) {
		if (alias.match(k)) return k;
	}
}
/**
 * @prototype {Object}  
 */
function findPropValueByAlias(this_object, alias) {
	for (const k in this_object) {
		if (alias.match(k)) return this_object[k];
	}
}

/**
 * @prototype {Object}  
 */
function setPropertyAlias(this_object, alias) {
	if (!obj.prototype.hasOwnProperty(alias)) {
		Object.defineProperty(obj.prototype, alias, {
			get: function() {
				return findPropValueByAlias(this, alias);
			},
			set: function(valore) {
				this[findPropKeyByAlias(this, alias)] = valore;
			}
		});
	}
}




module.exports = {
	  findPropKeyByAlias: findPropKeyByAlias,
	findPropValueByAlias: findPropValueByAlias,
	setPropertyAlias:
};