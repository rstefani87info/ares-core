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

/**
 * Generates a cryptographically secure random byte array of a given length.
 * 
 * @param {number} length
 * @returns {string} a hexadecimal string of the same length as the input
 */
function randomBytes(length) {
	let result = [];
	for (let i = 0; i < length; i++) {
	  result.push(Math.floor(Math.random() * 256));
	}
	return result.map(byte => ('0' + byte.toString(16)).slice(-2)).join('');
} 


