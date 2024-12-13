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


/**
 * Generates a random alphanumeric string of a given length.
 *
 * @param {number} length - The length of the string to generate. Defaults to 28.
 * @returns {string} A random alphanumeric string of the specified length.
 */
function generateRandomString(length = 28) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    
    return result;
}

/**
 * Converts a string to kebab case, by default removing all spaces, underscores, 
 * non-word characters and new lines. The conversion is case insensitive.
 * The following characters are kept as is: letters (both lowercase and uppercase), 
 * numbers and underscores.
 * @param {string} this_str - The string to convert.
 * @param {boolean} [ignoreSpaces=false] - Set to true to keep spaces as is.
 * @param {boolean} [ignoreUnderscore=false] - Set to true to keep underscores as is.
 * @param {boolean} [ignoreNonWords=false] - Set to true to keep non-word characters as is.
 * @param {boolean} [ignoreNewLines=false] - Set to true to keep new lines as is.
 * @returns {string} The converted string in kebab case.
 * 
 * @prototype {string}
 */
export function getAsKebabCase(this_str, ignoreSpaces = false , ignoreUnderscore = false, ignoreNonWords = false, ignoreNewLines=false) {
    let ret = this_str.replace (/([a-z0-9]+)([A-Z]+)/g, '$1-$2');
    if(!ignoreSpaces) ret = ret.replace(" ", "-");
    if(!ignoreUnderscore) ret = ret.replace ("_", "-");
    if(!ignoreNonWords) ret = ret.replace(/([^a-zA-Z0-9_])+/g, '-');
    if(!ignoreNewLines) ret = ret.replace(/(\n|\r)+/g, '-');
    return trimRegexp(ret.toLowerCase(), "-");
}

/**
 * Converts a string to snake_case format.
 * 
 * @param {string} this_str - The input string to be converted.
 * @param {boolean} [ignoreSpaces=false] - If true, spaces will not be converted to underscores.
 * @param {boolean} [ignoreDashes=false] - If true, dashes will not be converted to underscores.
 * @param {boolean} [ignoreNonWords=false] - If true, non-word characters (except underscores) will not be converted to underscores.
 * @param {boolean} [ignoreNewLines=false] - If true, new line characters will not be converted to underscores.
 * @returns {string} - The converted string in snake_case.
 * 
 * @prototype {string}
 */
export function getAsSnakeCase(this_str, ignoreSpaces = false , ignoreDashes = false, ignoreNonWords = false, ignoreNewLines=false) {
    let ret = this_str.trim().replace (/([a-z0-9]+)([A-Z]+)/g, '$1_$2');
    if(!ignoreSpaces) ret = ret.replace (/\s+/g, "_");
    if(!ignoreDashes) ret = ret.replace ("-", "_");
    if(!ignoreNonWords) ret = ret.replace(/([^a-zA-Z0-9_])+/g, '_');
    if(!ignoreNewLines) ret = ret.replace(/(\n|\r)+/g, '_');
    return trimRegexp(ret.toLowerCase(), "_");
}
