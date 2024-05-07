/**
 * @author Roberto Stefani
 * @license MIT
 */
import {asyncConsole}  from './console.js';
import { format } from '@ares/core/dataDescriptors.js';
import { isFile,getFilesRecursively,getParent,getFileName,fileExists,getFileContent }  from './files.js';
import { cloneWithMethods } from './objects.js';
import app from '../../../app.js';

const mapRequestOrResult = function (request) { return request; };
export const dbMap = {};
/**
 * @param {Object} aReS - The express framework object
 * @param {string} dbName - The name of the database
 * @param {function} onMapperLoaded - The callback when the mapper is loaded
 * @param {boolean} [force=false] - Whether to force the export
 * @return {Object} The exported database
 * 
 * @desc {en} Initialyze db object
 * @desc {it} Inizializza l'oggetto db
 * @desc {fr} Initialise l'objet db
 * @desc {es} Inicializa el objeto db
 * @desc {de} Initialisiere das Datenbankobjekt
 * @desc {ru} Инициализирует объект db
 * @desc {pt} Inicializa o objeto db
 * @desc {zh} 初始化 db 对象
 * @desc {ja} db オブジェクトを初期化
 * 
 */
async function loadDB(aReS, dbName, onMapperLoaded ,force = false) {

	dbName = dbName.toLowerCase();
	aReS.dbMap = aReS.dbMap ?? {};
	force = force || (!dbName in aReS.dbMap);
	console.log('---',force);
	if (force) {
		asyncConsole.log('db','init db "' + dbName + '" {');
		const dbRoot = app.dbRoot + '/' + dbName;
		aReS.dbMap[dbName] = {...(await import('../../../'+dbRoot + '/db.js'))}; 
		aReS.dbMap[dbName].dbRoot = dbRoot;
		aReS.dbMap[dbName].name = dbName;
		aReS.dbMap[dbName].sessions = {};
		aReS.dbMap[dbName].openConnection = function(req, force = false) {
			if (aReS.permissions.isResourceAllowed(dbName, req )) {
				if (force || !aReS.dbMap[dbName].sessions[req.sessionId]) {
					aReS.dbMap[dbName].sessions[req.sessionId] = aReS.dbMap[dbName].createConnection(aReS.dbMap[dbName].environments[app.isProduction ? 'production' : 'test']);
					aReS.dbMap[dbName].sessions[req.sessionId].connect((err) => {
						if (err) {
							delete aReS.dbMap[dbName].sessions[req.sessionId];
							throw err;
						}
						aReS.dbMap[dbName].sessions[req.sessionId].on('end', () => {
							delete aReS.dbMap[dbName];
						});
					});
				}
				return aReS.dbMap[dbName].sessions[req.sessionId];
			}
			return null;
		};
		aReS.dbMap[dbName].query =  (req,command,mapper,callback,wait=false) => { 
			return aReS.dbMap[dbName].executeNativeQuery(
				aReS.dbMap[dbName].openConnection(req),
				command,
				mapper.mapParameters(req, aReS.dbMap[dbName]),
				callback,
				wait
				)
		};
		aReS.dbMap[dbName].close = function(req) { aReS.dbMap[dbName].sessions[req.sessionId].connection.end(); };
		const files = getFilesRecursively(aReS.dbMap[dbName].dbRoot, /.*\.(url|sql)$/i, true);
		for (const file of files) {
			if (isFile(file)) {
				asyncConsole.log('db',' - init mapperCase "' + getFileName(file) + '" {');
				const queryCompleteFileName = file.replace(/.(sql|url)$/i,'');
				const queryFileName =  getFileName(queryCompleteFileName);
				const mapperFile = queryCompleteFileName + '.js';
				asyncConsole.log('db',' - init mapper "' + JSON.stringify( (await import('../../../'+mapperFile)).default) + '".....');
				aReS.dbMap[dbName][queryFileName] = {
					name: queryFileName,
					mappers: (fileExists(mapperFile) ? (await import('../../../'+mapperFile)).default : null) ,
					query: getFileContent(file),
				};
				
				aReS.dbMap[dbName][queryFileName].mappers?.forEach((mapper, index) => {
					if (!mapper.name) mapper.name = queryFileName+'_'+index;
					aReS.dbMap[dbName][queryFileName][mapper.name] = mapper;
					aReS.dbMap[dbName][queryFileName][mapper.name].execute = function(request,callback,wait=false) {
						try{
							console.log(dbName+'['+request.sessionId+'] : '+aReS.dbMap[dbName][queryFileName].query);
								let params = request.parameters;
								if(mapper.mapParameters){
									params = format( request.parameters, mapper.validateParams(request,aReS));
									if(params['€rror'])throw new Error('Formatting and validation error: '+JSON.stringify(params['€rror']));
									request = cloneWithMethods(request);
									request.parameters = params;
								}
								if (!mapper.mapRequest) mapper.mapRequest = mapRequestOrResult;
								if (!mapper.mapResult) mapper.mapResult = mapRequestOrResult;
								if (!mapper.methods) mapper.methods = '.*';
								const ret = aReS.dbMap[dbName].query(request, aReS.dbMap[dbName][queryFileName].query, mapper,  (response) => {
									if(response.results ){
										if(Array.isArray(response.results)) response.results=response.results.map((row,index) => mapper.mapResult(row,index));
										else response.results=mapper.mapResult(response.results);
									}
									if(!app.isProduction) {
										response.dbName=dbName;
										response.queryName=queryFileName;
										response.mapperName=mapper.name;
										response.query = aReS.dbMap[dbName][queryFileName].query;
										response.params = params;
										asyncConsole.log(dbName+'['+request.sessionId+'] ', JSON.stringify(response));
									}
									if (callback) callback(response);
								},wait);
								if(mapper.postExecute) mapper.postExecute(request, aReS.dbMap[dbName], ret);
								return ret;
						}catch(e){
							callback({error:e, db:dbName, queryName: queryFileName, mapperName:mapper.name});
						}
					};
				})
				
				if(onMapperLoaded && typeof onMapperLoaded === 'function'){
					await onMapperLoaded(aReS, aReS.dbMap[dbName][queryFileName],  aReS.dbMap[dbName]);
				}
			}
		}
		asyncConsole.log('db','}');
	}
	return aReS.dbMap[dbName];
}

/**
 * @param {Object} aReS - The aRes framework object
 * @param {boolean} [force=true] - Whether to force the export
 * @return {array} The exported databases
 * 
 * @desc {en} Initialyze db object
 * @desc {it} Inizializza l'oggetto db
 * @desc {fr} Initialise l'objet db
 * @desc {es} Inicializa el objeto db
 * @desc {de} Initialisiere das Datenbankobjekt
 * @desc {ru} Инициализирует объект db
 * @desc {pt} Inicializa o objeto db
 * @desc {zh} 初始化 db 对象
 * @desc {ja} db オブジェクトを初期化
 * 
 */
async function initAllDB(aReS,onMapperLoaded = ()=>{},  force = true ) {
	const dbRoot =  'db'; ;
	const files = getFilesRecursively(dbRoot, /(.*[\/\\]){0,1}db\.js/i, true);
	const array = [];
	for (const file of files) {
		asyncConsole.log('db','connection file found: "' + file + ';');
		// const db = import(file);
		array.push( await loadDB(aReS,getFileName(getParent(file)), onMapperLoaded, force));
	}
	asyncConsole.output('db');
	return array;
}


const db = { dbMap:dbMap,initAllDB: initAllDB, loadDB:loadDB };
export default db;