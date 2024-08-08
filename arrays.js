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
