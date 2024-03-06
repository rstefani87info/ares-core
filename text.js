/**
 * @desc {en} Trims initial regexp from a string.
 * @desc {it} Rimuove la regexp iniziale da una stringa.
 * @desc {es} Quita la regexp inicial de una cadena.
 * @desc {fr} Supprime la regexp initiale d'une chaîne.
 * @desc {de} Entfernt die initiale RegExp aus einer Zeichenkette.
 * @desc {pt} Remove a expressão regular inicial de uma string.
 * @desc {zh} 从字符串中删除初始的正则表达式
 * @desc {ru} Удаляет из строки начальное регулярное выражение
 * @desc {ja} 文字列から最初の正規表現を削除
 * @desc {zh} 从字符串中删除初始的正则表达式
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
 * @desc {de} Entfernt die finale RegExp aus einer Zeichenkette.
 * @desc {pt} Remove a expressão regular final de uma string.
 * @desc {zh} 从字符串中删除最终的正则表达式
 * @desc {ru} Удаляет из строки конечное регулярное выражение
 * @desc {ja} 文字列から最後の正規表現を削除
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
 * @desc {de} Entfernt die initiale und die finale RegExp aus einer Zeichenkette.
 * @desc {pt} Remove a expressão regular inicial e final de uma string.
 * @desc {zh} 从字符串中删除初始和最终的正则表达式
 * @desc {ru} Удаляет из строки начальное и конечное регулярное выражение
 * @desc {ja} 文字列から最初と最後の正規表現を削除
 *  
 */
export function trimRegexp(this_string, regexp) {
    return trimFinalRegexp(trimInitialRegexp(this_string, regexp), regexp) ;
}