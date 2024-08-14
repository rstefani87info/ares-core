/**
 * @author Roberto Stefani
 * @license MIT
 */

import {createHash} from 'crypto';
/**
 * @prototype {string}
 * @param {string} 
 * 
 * Get MD5 hash
 * 
 */
export function getMD5Hash(this_string){
	const md5Hash = createHash('md5');
	md5Hash.update(this_string);
	return   md5Hash.digest('hex');
}
