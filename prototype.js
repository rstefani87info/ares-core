/**
 * @author Roberto Stefani
 */

import {asyncConsole}  from '@ares/core/console.js';
import * as scriptsUtility from './scripts.js';

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
 * @prototype {string}
 * Initializes prototypes for all types declared on function docklet annotations in file.
 * @param  {string} filePath 
 */
export async  function addFileFunctionsToPrototype (filePath)  {
	const functions = await getFunctionsFromFile(filePath);
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
