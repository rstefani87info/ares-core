/**
 * 
 * @param {*} this_string 
 * @returns boolean
 * 
 * 
 * @prototype {string}
 * 
 * @desc {en} Check if a string is a number
 * @desc {it} Controlla se una stringa sia un numero
 * @desc {es} Comprueba si una cadena es un número
 * @desc {fr} Vérifie si une chaîne est un nombre
 * @desc {pt} Verifica se uma string é um número
 * 
 * */

function isNumber(this_string) {
    return !isNaN(parseFloat(this_string)) && isFinite(this_string);
}