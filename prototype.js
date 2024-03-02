/**
 * prototype.js
 * @author Roberto Stefani
 */

/**
 * @prototype {string}
 * @desc {en} Initializes prototypes for all types declared on function docklet annotations in files of the given paths recoursively.
 * @desc {it} Inizializza le prototipi per tutti i tipi dichiarati con le annotazioni docklet in tutti i file dei percorsi indicati.
 * @desc {es} Inicializa prototipos para todos los tipos declarados en las anotaciones docklet en los archivos de los caminos indicados recursivamente.
 * @desc {fr} Initialise les prototypes pour tous les types déclarés dans les annotations docklet dans tous les fichiers des chemins indiqués récursivement.
 * @desc {de} Erstellt Prototypen für alle Typen, die in Funktion docklet Annotationen mitgegeben sind, in allen angegebenen Verzeichnissen rekursiv.
 * @desc {pt} Inicializa prototipos para todos os tipos declarados nas anotações docklet nos arquivos dos caminhos indicados recursivamente.
 * @desc {zh} 初始化指定路径下的所有文件中所有函数的 prototype
 * @desc {ru} Инициализирует прототипы для всех типов, объявленных в аннотациях docklet во всех указанных путях рекурсивно
 * @desc {ja} 指定されたパスのすべてのファイルのすべての関数の prototype を初期化
 * @param  {...string} paths 
 */
export function initPrototypes (...paths) {
	const filesUtility = require('./files.js');
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

/**
 * @prototype {string}
 * @desc {en} Initializes prototypes for all types declared on function docklet annotations in file.
 * @desc {it} Inizializza le prototipi per tutti i tipi dichiarati con le annotazioni docklet in file.
 * @desc {es} Inicializa prototipos para todos los tipos declarados en las anotaciones docklet en el archivo.
 * @desc {fr} Initialise les prototypes pour tous les types déclarés dans les annotations docklet dans le fichier.
 * @desc {de} Erstellt Prototypen für alle Typen, die in Funktion docklet Annotationen mitgegeben sind, in dem angegebenen Datei.
 * @desc {pt} Inicializa prototipos para todos os tipos declarados nas anotações docklet no arquivo.
 * @desc {zh} 初始化文件中的所有函数的 prototype.
 * @desc {ja} 指定されたファイルのすべての関数の prototype を初期化.
 * @desc {ru} Инициализирует прототипы для всех типов, объявленных в аннотациях docklet в указанном файле.
 * @param  {string} filePath 
 */
export function addFileFunctionsToPrototype (filePath)  {
	const scriptsUtility = require('./scripts.js');
	const functions = scriptsUtility.getFunctionsFromFile(filePath);
	for (const f of functions) {
		console.log(' - - init prototype for function ' + scriptsUtility.getFunctionName(f) + ' ;');
		var pa = scriptsUtility.getDockletAnnotations(f).filter(x => x.annotation == 'prototype')[0] ?? null;
		if (pa) {
			scriptsUtility.facadeOnPrototype(f, pa.type, pa.name);
		}

	}
};
