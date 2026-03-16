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
  return lodash
    .split(Array.from(this_seq).join(delimiter), delimiter)
    .map(subArr => subArr.split(delimiter));
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
  for (const [key, value] of Array.isArray(this_object_or_sequence) ||
  this_object_or_sequence instanceof Iterable
    ? this_object_or_sequence
    : Object.entries(this_object_or_sequence)) {
    arr.push({key, value});
  }
  arr.sort((a, b) => mode(a) - mode(b));
  return arr;
}

/**
 * Converts an array to an object, using the elements of the array as values, and
 * either the provided keys array or the array indices as keys.
 *
 * @param {array} this_array - The array to be converted.
 * @param {array} keys - The array of keys to use. If not provided, the array
 * indices will be used.
 * @return {object} The object with the array values as properties.
 *
 * @prototype {array}
 * @prototype {Iterable}
 */
export function convertArrayToObject(this_array, keys) {
  if (!this_array || this_array.length === 0) return null;
  const isNotArray = typeof keys !== 'array';
  if (isNotArray && keys instanceof Iterable) keys = Array.from(keys);
  else if (isNotArray) keys = this_array.map(x, k => `${k}`);
  const map = {};
  for (let i = 0; i < keys.length; i++) {
    map[keys[i]] = this_array[i] ?? undefined;
  }
  return map
}

/**
 * Determines if the provided data is iterable.
 *
 * @param {any} data - The data to be checked for iterability.
 * @return {function} - A function that checks if a value is non-null
 *                      and has a valid iterator function.
 */

export function isIterable(data) {
  return valore => valore != null && typeof valore[Symbol.iterator] === 'function';
}


export class DynamicArray {
  
  constructor(...sources) {
    this.sources = sources;
    this.arrayOperations = [];
    this.params = [];
  }

  setParam(...params) {
    this.params = params;
    return this;
  }

  filter(filter) {
    this.arrayOperations.push(a=>a.filter(filter));
    return this;
  }

  map(mapper) {
    this.arrayOperations.push(a=>a.map(mapper));
    return this;
  }

  push(pusher) {
    this.arrayOperations.push(a=>a.push(pusher));
    return this;
  }
  async pop() {
    const arr = await this.toArray();
    return arr.pop();
  }
  unshift(unshifter) {
    this.arrayOperations.push(a=>a.unshift(unshifter));
    return this;
  }

  copyWithin(target, start, end) {
    this.arrayOperations.push(a=>a.copyWithin(target, start, end));
    return this;
  }

  
  concat(arrays) {
    this.arrayOperations.push(a=>a.concat(...arrays));
    return this;
  }

 async join(separator) {
    return  (await this.toArray()).join(separator);
  }


  slice(start, end) {
    this.arrayOperations.push(a => a.slice(start, end));
    return this;
  }

  reverse() {
    this.arrayOperations.push(a => a.reverse());
    return this;
  }

  async reduce(reducer, initialValue) {
    const arr = await this.toArray();
    return arr.reduce(reducer, initialValue);
  }

  async forEach(callback) {
    const arr = await this.toArray();
    return arr.forEach(callback);
  }

  async find(predicate) {
    const arr = await this.toArray();
    return arr.find(predicate);
  }

  async findIndex(predicate) {
    const arr = await this.toArray();
    return arr.findIndex(predicate);
  }

  findLast(predicate) {
    this.arrayOperations.push(a => a.findLast(predicate));
    return this;
  }

  findLastIndex(predicate) {
    this.arrayOperations.push(a => a.findLastIndex(predicate));
    return this;
  }

  every(predicate) {
    this.arrayOperations.push(a => a.every(predicate));
    return this;
  }

  some(predicate) {
    this.arrayOperations.push(a => a.some(predicate));
    return this;
  }

  
  includes(element) {
    this.arrayOperations.push(a => a.includes(element));
    return this;
  }

  async indexOf(element) {
    const arr = await this.toArray();
    return arr.indexOf(element);
  }

  async lastIndexOf(element) {
    return (await this.toArray()).lastIndexOf(element);
  }

  
  async flatMap(callback) {
    return (await this.toArray()).flatMap(callback);
  }
  
  flat() {
    this.arrayOperations.push(a => a.flat());
    return this;
  }

  fill(element, start, end) {
    this.arrayOperations.push(a => a.fill(element, start, end));
    return this;
  }

  async first() {
    return (await this.toArray()).at(0);
  }

  async last() {
    return (await this.toArray()).at(-1);
  }
  
  async at(index) {
    return (await this.toArray()).at(index);
  }
  
  sort(comparator) {
    this.arrayOperations.push(a => a.sort(comparator));
    return this;
  }
  
  splice(start, deleteCount, ...items) {
    this.arrayOperations.push(a => a.splice(start, deleteCount, ...items));
    return this;
  }

  keys() {
    this.arrayOperations.push(a => a.keys());
    return this;
  }

  values() {
    this.arrayOperations.push(a => a.values());
    return this;
  }

  entries() {
    this.arrayOperations.push(a => a.entries());
    return this;
  }

  [Symbol.iterator]() {
    let promise = this.toArray();
    let i = 0;
    return {
      next:  () => {
        const arr =  promise;
        if (i < arr.length) {
          return { value: arr[i++], done: false };
        }
        return { done: true };
      }
    };
  }

  // use for await (const item of dynamicArray)
  [Symbol.asyncIterator]() {
    let promise = this.toArray();
    let i = 0;
    return {
      next: async () => {
        const arr = await promise;
        if (i < arr.length) {
          return { value: arr[i++], done: false };
        }
        return { done: true };
      }
    };
  }

  async toArray() {
    let ret = await Promise.all(this.sources.map( x=> {
      if(x instanceof DynamicArray) return x.toArray();
      if(typeof x === "function"){console.debug('FUNCTION::::::', x.toString()); return x(...(this.params??[]))};

      if(isIterable(x)) return Promise.resolve(Array.from(x));
      return x;
    }));
    
    ret=ret?.flat();
    for (const op of this.arrayOperations) {
      const res = op(ret);
      if(Array.isArray(res)) ret = res;
    }
    console.debug('------------ret:', ret);

    return ret;
  }
}