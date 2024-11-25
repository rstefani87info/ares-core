import lodash from 'lodash';
/**
 * Get the index of an element in an array
 * 
 * @prototype {array}
 * @param {array} this_array
 * @param {function} filter
 * @returns {number}
 *
 */
export function indexOfFilter(this_array, filter) {
  const element = this_array.filter(filter)[0] ?? null;
  if (element) return this_array.indexOf(element);
  return null;
}

/**
 * Splits an array into subarrays based on a specified delimiter.
 *
 * @param {array} seq - The array to be split.
 * @param {string} delimiter - The delimiter to split the array by.
 * @return {array} An array of subarrays split by the delimiter.
 * 
 * @prototype {array}
 * @prototype {Iterable}
 */
export function splitArray(this_seq, delimiter) {
  return lodash.split(Array.from(this_seq).join(delimiter), delimiter).map(subArr => subArr.split(delimiter));
}



/**
 * Sorts elements from a settings object or array based on a provided mode function.
 *
 * @param {object|array} this_object_or_sequence - The input object or array to be sorted.
 * @param {function} mode - A comparator function that determines the sort order.
 * @return {array} An array of sorted elements, each element is an object with 'id' and 'value'.
 * 
 * @prototype {array}
 * @prototype {Iterable}
 * @prototype {object}
 */
export function getSortedElements(this_object_or_sequence, mode) {
  const arr = [];
  for (const [key, value] of (Array.isArray(this_object_or_sequence) || this_object_or_sequence instanceof Iterable ? this_object_or_sequence : Object.entries(this_object_or_sequence))) {
    arr.push({  key, value });
  }
  arr.sort((a, b) => mode(a) - mode(b));
  return arr;
}
