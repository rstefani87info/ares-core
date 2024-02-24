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
	if (!OggettoConMetodi.prototype.hasOwnProperty(alias)) {
		Object.defineProperty(OggettoConMetodi.prototype, alias, {
			get: function() {
				return findPropValueByAlias(this, alias);
			},
			set: function(valore) {
				this[findPropKeyByAlias(this, alias)] = valore;
			}
		});
	}
}


const objectDescriptorDefinitions = {

	"string|text": {
		parse: (s) => s + '',
		minLength: (v, m) => m > 0 ? v.length >= m : true,
		maxLength: (v, m) => m > 0 ? v.length <= m : true,
		minValue: (v, m) => m ? v >= m : true,
		maxValue: (v, m) => m ? v <= m : true,
		pattern: (v, p) => {
			if (p) return v.match(p);
			else return true;
		}
	},
	"^(real|double|float)?[ _-]?number|numeric|n|r#|nr|°|double|float|[+-]?\\d+(\\.\\d+)?$": {
		parse: (s) => new Number(s + ""),
		minLength: (v, m) => m > 0 ? ('' + v).length >= m : true,
		maxLength: (v, m) => m > 0 ? ('' + v).length <= m : true,
		minDecimalLength: (v, m) => m > 0 ? ('' + v).split("[.,]").pop().length >= m : true,
		maxDecimalLength: (v, m) => m > 0 ? ('' + v).split("[.,]").pop().length <= m : true,
		minValue: (v, m) => m ? v >= m : true,
		maxValue: (v, m) => m ? v <= m : true,
		format: (v, f) => f ? moment(v, f) : moment(v),
		pattern: (v, p) => {
			if (p) return ('' + v).match(p);
			else return ('' + v).match("\\d+(\\.\\d+)");
		}
	},
	//	"^(natural|integer[\\+]?)?[ _-]?number[\\+]?|numeric[\\+]?|n[\\+]?|n#|nn|1+|\\d+$" : {
	//		
	//	},
	".*date.*": {
		parse: (s, f) => f ? moment(v, f) : moment(v),
		minValue: (v, m, f) => m ? f ? moment(v, f) : moment(v).toDate() >= f ? moment(m, f).toDate() : moment(m).toDate() : true,
		maxValue: (v, m, f) => m ? f ? moment(v, f) : moment(v).toDate() <= f ? moment(m, f).toDate() : moment(m).toDate() : true,
		format: (v, f) => f ? moment(v, f) : moment(v),
		pattern: (v, p) => {
			if (p) return ('' + v).match(p);
			else return true;
		}
	},


};

/**
 * @prototype {Object}  
 */
function format(this_object, descriptor) {
	const ret = {};
	for (const k in this_object) {
		ret[k] = this_object[k];
		const objectDescriptorDefinitionKey = descriptor[k]?.type || null;
		const objectDescriptorDefinition = findPropValueByAlias(objectDescriptorDefinitions, objectDescriptorDefinitionKey);
		if (descriptor.normalization) ret[k] = descriptor.normalization(ret[k]);
		if (!(objectDescriptorDefinition?.minValue(ret[k], descriptor[k].minValue) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minValue'] = true;
		}
		if (!(objectDescriptorDefinition?.maxValue(ret[k], descriptor[k].maxValue) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxValue'] = true;
		}
		if (!(objectDescriptorDefinition?.minLength(ret[k], descriptor[k].minLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minLength'] = true;
		}
		if (!(objectDescriptorDefinition?.maxLength(ret[k], descriptor[k].maxLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxLength'] = true;
		}
		if (!(objectDescriptorDefinition?.minDecimalLength(ret[k], descriptor[k].minDecimalLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['minDecimalLength'] = true;
		}
		if (!(objectDescriptorDefinition?.maxDecimalLength(ret[k], descriptor[k].maxDecimalLength) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['maxDecimalLength'] = true;
		}
		if (!(objectDescriptorDefinition?.pattern(ret[k], descriptor[k].pattern) || null)) {
			if (!ret['€rror']) ret['€rror'] = {};
			ret['€rror'][k]['pattern'] = true;
		}

	}
	return ret;
}

module.exports = {
	validate: validate,
	format: format, findPropKeyByAlias: findPropKeyByAlias,
	findPropValueByAlias: findPropValueByAlias,
	objectDescriptorDefinitions: objectDescriptorDefinitions, 
};