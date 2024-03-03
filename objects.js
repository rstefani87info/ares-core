import moment from 'moment';
import * as fileUtility from './files.js';
//TODO: import numeral from 'numeral';

/**
 * @prototype {Object} 
 * @param {Object} this_object 
 * @param {string} alias
 * 
 * @desc {en} Find property key by alias
 * @desc {it} Trova la chiave di un oggetto
 * @desc {es} Encontrar la llave de un objeto
 * @desc {pt} Encontrar la llave de un objeto
 * @desc {fr} Trouver la clef d'un objet
 * @desc {de} Finden der Eigenschaftskey
 * @desc {ja} プロパティキーを検索する
 * @desc {zh} 查找属性
 * @desc {ru} Поиск ключа свойства
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
 * @desc {en} Find property value by alias
 * @desc {it} Trova il valore di una proprietà tramite un alias
 * @desc {es} Encontrar el valor de una propiedad tramite un alias
 * @desc {pt} Encontrar o valor de uma propriedade por meio de um alias
 * @desc {fr} Trouver la valeur d'un objet par son alias
 * @desc {de} Finden der Eigenschaftswert durch Alias
 * @desc {ja} プロパティ値を検索する 
 * @desc {zh} 查找属性  
 * @desc {ru} Поиск значения свойства по алиасу 
 */
export function findPropValueByAlias(this_object, alias) {
	for (const k in this_object) {
		if (alias.match(k)) return this_object[k];
	}
}

/**
 * @prototype {Object} 
 * @param {Object} this_object
 * @param {string} alias
 * 
 * @desc {en} Setup a property alias for the object property that match the alias regexp
 * @desc {it} Imposta un alias ad una proprietà che corrisponde ad una regexp 
 * @desc {es} Configurar un alias para una propiedad del objeto que coincida con la expresión regular
 * @desc {pt} Configurar um alias para uma propriedade do objeto que coincida com uma expressão regular
 * @desc {fr} Configurer un alias pour un objet par son regexp
 * @desc {de} Setzen der Eigenschaftsalias für ein Objektschlüssel, das dem Alias entspricht
 * @desc {ja} プロパティのエイリアスを設定する
 * @desc {zh} 设置属性别名
 * @desc {ru} Настройка алиаса свойства объекта, которое соответствует
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
 * 
 * @desc {en} Parse file content as object
 * @desc {it} Parsa il contenuto del file come oggetto
 * @desc {es} Parse el contenido del archivo como objeto
 * @desc {pt} Parse o conteúdo do arquivo como objeto
 * @desc {fr} Parse le contenu du fichier comme objet
 * @desc {de} Parsen der Dateiinhalt als Objekt
 * @desc {ja} ファイルの内容をオブジェクトとして解析
 * @desc {zh} 解析文件内容
 * @desc {ru} Разбор содержимого файла как объект
 * 
 */
export function requireData(this_file) {
	return JSON.parse(fileUtility.getFileContent(file));
}