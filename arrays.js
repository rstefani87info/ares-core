/**
 * @prototype {array}
 * @param {array} this_array
 * @param {function} filter
 * @returns {number}
 * Get the index of an element in an array
 *
 */
export function indexOfFilter(this_array, filter) {
  const element = this_array.filter(filter)[0] ?? null;
  if (element) return this_array.indexOf(element);
  return null;
}
