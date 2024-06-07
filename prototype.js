/**
 * prototype.js
 * @author Roberto Stefani
 */

import {asyncConsole}  from '@ares/core/console.js';
import * as filesUtility from '@ares/files';
import * as scriptsUtility from './scripts.js';
/**
 * @prototype {string}
 * @desc {en} Initializes prototypes for all types declared on function docklet annotations in files of the given paths recoursively.
 * @desc {it} Inizializza le prototipi per tutti i tipi dichiarati con le annotazioni docklet in tutti i file dei percorsi indicati.
 * @desc {es} Inicializa prototipos para todos los tipos declarados en las anotaciones docklet en los archivos de los caminos indicados recursivamente.
 * @desc {fr} Initialise les prototypes pour tous les types déclarés dans les annotations docklet dans tous les fichiers des chemins indiqués récursivement.

 * @desc {pt} Inicializa prototipos para todos os tipos declarados nas anotações docklet nos arquivos dos caminhos indicados recursivamente.



 * @param  {...string} paths 
 */
export async function initPrototypes (...paths) {
	asyncConsole.log('prototype','init prototype: {');
	for (const path of paths) {
		const files = filesUtility.getFilesRecursively(path, /^.*\.(js|ts|jsx|tsx)$/i);
		for (const file of files) {
			asyncConsole.log('prototype',' - init prototype for file ' + file + ': {');
			 await addFileFunctionsToPrototype(file);
			asyncConsole.log('prototype',' - }');
		}
	}
	asyncConsole.log('prototype','}');
	// asyncConsole.output('prototype');
};

/**
 * @prototype {string}
 * @desc {en} Initializes prototypes for all types declared on function docklet annotations in file.
 * @desc {it} Inizializza le prototipi per tutti i tipi dichiarati con le annotazioni docklet in file.
 * @desc {es} Inicializa prototipos para todos los tipos declarados en las anotaciones docklet en el archivo.
 * @desc {fr} Initialise les prototypes pour tous les types déclarés dans les annotations docklet dans le fichier.

 * @desc {pt} Inicializa prototipos para todos os tipos declarados nas anotações docklet no arquivo.



 * @param  {string} filePath 
 */
export async  function addFileFunctionsToPrototype (filePath)  {
	const functions = await scriptsUtility.getFunctionsFromFile(filePath);
	asyncConsole.log('prototype','- - functions: '+ functions.map(x=> scriptsUtility.getFunctionName(x)) );
	for (const f of functions.filter(x=> x!=null && typeof x === 'function')) {
		asyncConsole.log('prototype',' - - init prototype for function ' + scriptsUtility.getFunctionName(f) + ' ;');
		var pa = scriptsUtility.getDockletAnnotations(f).filter(x => x.annotation == 'prototype')[0] ?? null;
		if (pa) {
			scriptsUtility.facadeOnPrototype(f, pa.type, pa.name);
		}

	}
	return true;
};
