/**
 * @author Roberto Stefani
 * @license MIT
 */

import {createHash} from 'crypto';
/**
 * @prototype {string}
 * @param {string} 
 * 
 * @desc {en} Get MD5 hash
 * @desc {it} Ottieni l'hash MD5
 * @desc {es} Obtener el hash MD5
 * @desc {fr} Obtenez le hachage MD5
 * @desc {de} Liefert den MD5-Hash
 * @desc {pt} Obtenha o hash MD5
 * @desc {zh} 获取MD5哈希
 * @desc {ru} Возвращает MD5-хеш
 * @desc {ja} MD5ハッシュを取得
 * 
 */
export function getMD5Hash(this_string){
	const md5Hash = createHash('md5');
	md5Hash.update(this_string);
	return   md5Hash.digest('hex');
}
