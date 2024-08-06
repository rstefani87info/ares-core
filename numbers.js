/**
 * 
 * @param {*} this_string 
 * @returns boolean
 * 
 * 
 * @prototype {string}
 * 
 * Check if a string is a number
 * 
 * */

function isNumber(this_string) {
    return !isNaN(parseFloat(this_string)) && isFinite(this_string);
}