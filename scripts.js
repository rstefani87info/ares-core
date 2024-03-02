/**
 * @prototype {string} 
 */
function getFunctionsFromFile(this_string) {
	const filesUtility = require('./files');
	const script = require('../' + this_string.replace(filesUtility.getFileExtension(this_string), ''));
	return Object.getOwnPropertyNames(script).map(n => script[n]).filter(x => typeof x == 'function');
}
/**
 * @prototype {function} 
 */
function getDocklet(this_function) {
	const funzioneString = this_function.toString();
	const commentiRegex = /\/\*\*([\s\S]*?)\*\//;
	const match = funzioneString.match(commentiRegex);

	if (match && match[1]) {
		return match[1].trim();
	} else {
		return null;
	}
}

/**
 * @prototype {function} 
 */
function getDockletAnnotations(this_function) {
	const s = getDocklet(this_function) ?? '';
	if (s) {
		const annotations = [];
		var last = { annotation: 'commonDescription', description: '' };

		for (const l of s.split('\n')) {
			var description = (l.match(/^[\s\/*]*\s*(?<description>.*)/)[0] ?? '').trim();
			var match = l.match(/\*\s*@(?<annotation>\w+)(\s*\{(?<type>([^@]|\s)+)*\}){0,1}(\s+(?<name>\w+)){0,1}([\s\-]+(?<description>[\s\S]*)+){0,}/ig);
			if (match) {
				const { annotation, type, name, description } = match.groups;
				last = {
					annotation: annotation.trim(),
					type: type.trim(),
					name: name.trim(),
					description: description.trim(),
				}
				annotations.push(last);
			}
			else last.description += description ? '\n' + description : '';
		}
		return annotations;
	} return [];
}
/**
 * @prototype {function} getParameters
 */
function getFunctionParameters(this_function) {
	const parameters = [];
	const s = f.toString();
	const { params } = s.match(/^\s*function\s*\w+\s*\((?<params>.*)\)\s*\{.*$/gm).groups;
	const tokens = params.split(params);
	for (t of tokens) {
		const { commentLeft, multiple, name, value, commentRight } = t.match(/(?<commentLeft>\/\*.*\*\/)*\s*(?<multiple>[.]{3}){0,1}\s*(?<name>\w+)\s*(=\s*(?<value>".*"|'.*'|(\w)+))(?<commentRight>\/\*.*\*\/)*\s*/ig).groups;
		parameters.push({ name: name, defaultValue: value, multiple: multiple, commentLeft: commentLeft, commentRight: commentRight });
	}
}
/**
 * @prototype {function}
 */
function facade(this_function, alias = null) {
	const functionName = getFunctionName(this_function);
	if (functionName) {
		const params = getFunctionParameters(this_function);
		return new Function(
			'(' +
			params.filter(p => !p.name.match(/^this_[\w]+$/))
				.map(p => p.commentLeft ?? '' + ' ' + p.multiple ?? '' + p.name + (p.defaultValue ? '=' + p.defaultValue : '') + ' ' + p.commentRight)
				.join(',')
			+ ')=>' + functionName + '(' + params.join(',') + ')'
		);
	}
}
/**
 * @prototype {function}
 */
function facadeOnPrototype(this_function, type, alias = null) {
	facadeOnObject(this_function, scriptsUtility.getTypeByName(pa.type).prototype, alias);
}
/**
 * @prototype {function}
 */
function facadeOnObject(this_function, object, alias = null) {
	const functionName = getFunctionName(this_function);
	if(functionName){
		const name = alias ? alias : functionName;
		object[name] = facade(this_function, alias);
	}
}
/**
 * @prototype {string} reflect
 */
function getTypeByName(this_string) {
	return global[this_string] || window[this_string];
}
/**
 * @prototype {function} getName
 */
function getFunctionName(this_function) {
	const f = this_function.toString().match(/^function\s*([^\s(]+)/);
	return f && f.length > 0 ? f[1] : null;
}


module.exports = {
	getFunctionsFromFile: getFunctionsFromFile, getDocklet: getDocklet,
	getDockletAnnotations: getDockletAnnotations, getFunctionParameters: getFunctionParameters,
	facade: facade, facadeOnPrototype: facadeOnPrototype, facadeOnObject: facadeOnObject,
	getTypeByName: getTypeByName, getFunctionName: getFunctionName
};