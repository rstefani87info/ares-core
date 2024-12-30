/**
 * 
 * @param {*} this_string 
 * @returns boolean
 * 
 * 
 * @prototype {string}
 * @prototype {Number}
 * 
 * Check if a string is a number
 * 
 * */
function isNumber(this_any) {
    this_everything=getAsNumber(this_any);
    return !isNaN(this_everything && isFinite(this_everything)+"");
}

/**
 * @param {*} this_any
 * @returns {number}
 * 
 * Cast to number. If the given value is not a number, return NaN.
 * 
 * @prototype {string}
 * @prototype {Number}
 * 
 */
function getAsNumber(this_any) {
    return Number(this_any);
}

/**
 * @param {number} this_any
 * @returns {number}
 * 
 * Return the largest integer less than or equal to a given number.
 * 
 * @prototype {number}
 * 
 * */
function getFloor(this_any){
    Math.floor(getAsNumber(this_any));
}

/**
 * Calculates the arithmetic mean (average).
 * Use when you want to find the central value of a dataset where all values are equally weighted.
 * @param {number[]} arr - Array of numbers.
 * @returns {number|null} - The arithmetic mean or null if the array is empty.
 */
function arithmeticMean(arr) {
    if (arr.length === 0) return null;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculates the weighted mean.
 * Use when some values contribute more to the mean than others (e.g., grades with weights).
 * @param {number[]} values - Array of numbers.
 * @param {number[]} weights - Array of weights corresponding to the values.
 * @returns {number|null} - The weighted mean or null if arrays are empty or of unequal length.
 */
function weightedMean(values, weights) {
    if (values.length !== weights.length || values.length === 0) return null;
    const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    return weightedSum / weightSum;
}

/**
 * Calculates the geometric mean.
 * Use when analyzing growth rates or datasets with multiplicative relationships (e.g., percentages, ratios).
 * @param {number[]} arr - Array of positive numbers.
 * @returns {number|null} - The geometric mean or null if the array is empty or contains non-positive values.
 */
function geometricMean(arr) {
    if (arr.length === 0 || arr.some(val => val <= 0)) return null;
    const product = arr.reduce((prod, val) => prod * val, 1);
    return Math.pow(product, 1 / arr.length);
}

/**
 * Calculates the harmonic mean.
 * Use when dealing with rates or ratios, such as speed, density, or efficiency calculations.
 * @param {number[]} arr - Array of positive numbers.
 * @returns {number|null} - The harmonic mean or null if the array is empty or contains non-positive values.
 */
function harmonicMean(arr) {
    if (arr.length === 0 || arr.some(val => val <= 0)) return null;
    const reciprocalSum = arr.reduce((sum, val) => sum + 1 / val, 0);
    return arr.length / reciprocalSum;
}

/**
 * Calculates the quadratic mean (root mean square).
 * Use when measuring the magnitude of a set of numbers (e.g., deviations, signal strengths).
 * @param {number[]} arr - Array of numbers.
 * @returns {number|null} - The quadratic mean or null if the array is empty.
 */
function quadraticMean(arr) {
    if (arr.length === 0) return null;
    const squareSum = arr.reduce((sum, val) => sum + val * val, 0);
    return Math.sqrt(squareSum / arr.length);
}


