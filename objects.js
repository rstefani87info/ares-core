import moment from 'moment';
import * as fileUtility from '@ares/files';
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
 * @desc {en} Setup a property alias for the object property that match the alias regexp
 * @desc {it} Imposta un alias ad una proprietà che corrisponde ad una regexp 
 * @desc {es} Configurar un alias para una propiedad del objeto que coincida con la expresión regular
 * @desc {pt} Configurar um alias para uma propriedade do objeto que coincida com uma expressão regular
 * @desc {fr} Configurer un alias pour un objet par son regexp




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




 * 
 */
export function requireData(this_file) {
	return JSON.parse(fileUtility.getFileContent(file));
}


/**
 * @desc {en} Creates a deep clone of an object, including all its methods.
 * @desc {it} Crea una copia approfondita di un oggetto, inclusi tutti i suoi metodi.
 * @desc {es} Crea una copia profunda de un objeto, incluyendo todos sus métodos.
 * @desc {pt} Cria uma cópia profunda de um objeto, incluindo todos os seus métodos.
 * @desc {fr} Creer une copie profonde d'un objet, y inclure tous ses methodes.




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
