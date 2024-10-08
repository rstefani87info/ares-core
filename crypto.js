/**
 * @author Roberto Stefani
 * @license MIT
 */


import CryptoJS from 'crypto-js';
/**
 * 
 * @param {*} this_val 
 * @param {*} mode 
 * @returns 
 * 
 * Encrypt a string
 * 
 * 
 * @prototype {string}
 * @prototype {Number}
 * 
 */
export function encrypt(this_val, mode){
	const md5Hash = CryptoJS[mode.toUpperCase()](this_val);
	return md5Hash.toString(CryptoJS.enc.Hex);
}
/**
 * @prototype {string}
 * @param {string} 
 * 
 * Get MD5 hash
 * 
 */
export function getMD5Hash(this_string){
	return encrypt(this_string, 'md5');
}

/**
 * 
 * @param {*} this_string 
 * @returns 
 * 
 * Get SHA256 hash
 * 
 * @prototype {string}
 * @prototype {Number}
 * 
 */
export function getSHA256Hash(this_string) {
  return encrypt(this_string, 'sha256');
}