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
    return this_string
        .split(stringTokenizer)
        .map((x) => x.charAt(0).toLowerCase() + x.slice(1))
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


/**
 * Truncates a string to a specified length and adds an ellipsis if truncated
 * @param {string} this_string - The string to truncate
 * @param {number} maxLength - Maximum length of the string
 * @param {string} [ellipsis='...'] - The ellipsis to add if truncated
 * @returns {string} - The truncated string
 * 
 * @prototype {string}
 */
export function truncate(this_string, maxLength, ellipsis = '...') {
    if (this_string.length <= maxLength) return this_string;
    return this_string.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Pads a string to a specified length with a specified character
 * @param {string} this_string - The string to pad
 * @param {number} length - The target length
 * @param {string} [char=' '] - The character to pad with
 * @param {boolean} [padEnd=true] - If true, pad at the end, otherwise pad at the beginning
 * @returns {string} - The padded string
 * 
 * @prototype {string}
 */
export function pad(this_string, length, char = ' ', padEnd = true) {
    if (this_string.length >= length) return this_string;
    const padding = char.repeat(length - this_string.length);
    return padEnd ? this_string + padding : padding + this_string;
}

/**
 * Removes all HTML tags from a string
 * @param {string} this_string - The string containing HTML
 * @returns {string} - The string with HTML tags removed
 * 
 * @prototype {string}
 */
export function stripHtml(this_string) {
    return this_string.replace(/<[^>]*>/g, '');
}

/**
 * Converts a string to camelCase
 * @param {string} this_string - The string to convert
 * @returns {string} - The camelCase string
 * 
 * @prototype {string}
 */
export function toCamelCase(this_string) {
    return this_string
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase())
        .replace(/\s+|[-_]/g, '');
}

/**
 * Converts a string to PascalCase
 * @param {string} this_string - The string to convert
 * @returns {string} - The PascalCase string
 * 
 * @prototype {string}
 */
export function toPascalCase(this_string) {
    return this_string
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
        .replace(/\s+|[-_]/g, '');
}

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} this_string - The string to escape
 * @returns {string} - The escaped string
 * 
 * @prototype {string}
 */
export function escapeRegExp(this_string) {
    return this_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Counts the occurrences of a substring in a string
 * @param {string} this_string - The string to search in
 * @param {string} substring - The substring to count
 * @param {boolean} [caseSensitive=true] - Whether the search should be case sensitive
 * @returns {number} - The number of occurrences
 * 
 * @prototype {string}
 */
export function countOccurrences(this_string, substring, caseSensitive = true) {
    if (!caseSensitive) {
        this_string = this_string.toLowerCase();
        substring = substring.toLowerCase();
    }
    return (this_string.match(new RegExp(escapeRegExp(substring), 'g')) || []).length;
}

/**
 * Reverses a string
 * @param {string} this_string - The string to reverse
 * @returns {string} - The reversed string
 * 
 * @prototype {string}
 */
export function reverse(this_string) {
    return this_string.split('').reverse().join('');
}

/**
 * Checks if a string is a palindrome (reads the same backward as forward)
 * @param {string} this_string - The string to check
 * @param {boolean} [ignoreSpaces=true] - Whether to ignore spaces
 * @param {boolean} [ignoreCase=true] - Whether to ignore case
 * @returns {boolean} - True if the string is a palindrome
 * 
 * @prototype {string}
 */
export function isPalindrome(this_string, ignoreSpaces = true, ignoreCase = true) {
    let str = this_string;
    if (ignoreSpaces) str = str.replace(/\s+/g, '');
    if (ignoreCase) str = str.toLowerCase();
    return str === reverse(str);
}

/**
 * Formats a string by replacing placeholders with provided values
 * @param {string} this_string - The template string with {placeholders}
 * @param {Object} values - An object with keys matching the placeholders
 * @returns {string} - The formatted string
 * 
 * @prototype {string}
 */
export function format(this_string, values) {
    return this_string.replace(/{(\w+)}/g, (match, key) => 
        values[key] !== undefined ? values[key] : match
    );
}
