/**
 * Trims initial regexp from a string.
 * @param {string} this_string
 * @param {RegExp|string} regexp
 * @returns {string}
 * 
 * @prototype {string}
*/
export function trimInitialRegexp(this_string, regexp) {
    return this_string.replace(new RegExp("^" + (typeof regexp === "RegExp"? regexp.source:regexp)), "");
}

/**
 * Trims final regexp from a string.
 * 
 * @param {string} this_string
 * @param {RegExp|string} regexp
 * @returns {string}
 * 
 * @prototype {string}
 * 
 */
export function trimFinalRegexp(this_string, regexp) {
    return this_string.replace(new RegExp( (typeof regexp === "RegExp"? regexp.source:regexp)+"$"), "");
}

/**
 *
 * @param {string} this_string
 * @param {RegExp|string} regexp
 * @returns {string}
 * 
 * @prototype {string}
 * 
 * Trims initial and final regexp from a string.
 *  
 */
export function trimRegexp(this_string, regexp) {
    return trimFinalRegexp(trimInitialRegexp(this_string, regexp), regexp) ;
}

/**
 * Capitalizes the first letter of a string
 * @param {string} this_string
 * @returns {string}
 * 
 * @prototype {string}
 * 
 */
export function capitalize(this_string) {
    return this_string.charAt(0).toUpperCase() + this_string.slice(1);
}

/**
 * Capitalizes tokens in a string
 * @param {string} this_string
 * @returns {string}
 * 
 * @prototype {string}
 *  
 */
export function capitalizeTokens(this_string) {
    return  s
    .split(/[a-zA-Z]+|[^a-zA-Z]+/gm)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
    .join('');
}



/**
 * Uncapitalizes the first letter of a string
 * @param {string} this_string
 * @returns {string}
 * 
 * @prototype {string}
 * 
 */
export function uncapitalize(this_string) {
    return this_string.charAt(0).toLowerCase() + this_string.slice(1);
}

export const stringTokenizer = /[a-zA-Z]+|[^a-zA-Z]+/gm;
/**
 * Uncapitalizes tokens in a string
 * @param {string} this_string
 * @returns {string}
 * 
 * @prototype {string}
 *  
 */
export function uncapitalizeTokens(this_string) {
    return  s
    .split()
    .map((x) => x.toLowerCase())
    .join('');
}

/**
 * Checks if a string is empty
 * @param {string} this_str
 * @returns {boolean}
 * 
 * @prototype {string}
 * 
 */
export function isEmptyString(this_str) {
    if (this_str === null || this_str === undefined) {
        return true;
    }
    if (typeof this_str !== 'string') {
        return false;
    }
    if (this_str.trim() === '') {
        return true;
    }
    return false;
}

/**
 * returns an array of strings that match a pattern
 * 
 * @param {*} this_str_array 
 * @param {*} pattern 
 * @returns 
 * 
 * @prototype {string}
 * @prototype {array}
 */
export function filterLike(this_str_array, pattern) {
    if(typeof pattern === "string") {
        pattern = new RegExp(pattern);
    }
    return this_str_array.filter((x) => pattern.test(x));
}
