const paths = ['../../utility'];
function initPrototypes () {
	const filesUtility = require('./files');
	console.log('init prototype: {');
	for (const path of paths) {
		const files = filesUtility.getFilesRecoursively(path, /^.*\.(js|ts|jsx|tsx)$/i);
		console.log(' - found files ' + files.join(',') + ';');
		for (const file of files) {
			console.log(' - init prototype for file ' + file + ': {');
			addFileFunctionsToPrototype(file);
			console.log(' - }');
		}
	}
	console.log('}');
};

function addFileFunctionsToPrototype (filePath)  {
	const scriptsUtility = require('./scripts');
	const functions = scriptsUtility.getFunctionsFromFile(filePath);
	for (const f of functions) {
		console.log(' - - init prototype for function ' + scriptsUtility.getFunctionName(f) + ' ;');
		var pa = scriptsUtility.getDockletAnnotations(f).filter(x => x.annotation == 'prototype')[0] ?? null;
		if (pa) {
			scriptsUtility.facadeOnPrototype(f, pa.type, pa.name);
		}

	}
};
module.exports = {paths:paths, initPrototypes:initPrototypes, addFileFunctionsToPrototype:addFileFunctionsToPrototype};
