/**
 * @desc {en} Trims initial regexp from a string.
 * @desc {it} Rimuove la regexp iniziale da una stringa.
 * @desc {es} Quita la regexp inicial de una cadena.
 * @desc {fr} Supprime la regexp initiale d'une chaîne.

 * @desc {pt} Remove a expressão regular inicial de uma string.




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
 * @desc {en} Trims final regexp from a string.
 * @desc {it} Rimuove la regexp finale da una stringa.
 * @desc {es} Quita la regexp final de una cadena.
 * @desc {fr} Supprime la regexp finale d'une chaîne.

 * @desc {pt} Remove a expressão regular final de uma string.



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
 * @desc {en} Trims initial and final regexp from a string.
 * @desc {it} Rimuove la regexp iniziale e la finale da una stringa.
 * @desc {es} Quita la regexp inicial y final de una cadena.
 * @desc {fr} Supprime la regexp initiale et la finale d'une chaîne.

 * @desc {pt} Remove a expressão regular inicial e final de uma string.



 *  
 */
export function trimRegexp(this_string, regexp) {
    return trimFinalRegexp(trimInitialRegexp(this_string, regexp), regexp) ;
}