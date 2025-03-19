import { URL }  from 'url';
/**
 * Resolves a relative URL path relative to a base URL.
 *
 * @param {string} base - The base URL.
 * @param {string} relativePath - The relative URL path.
 * @return {string} The resolved absolute URL.
 * 
 * @prototype {string}
 */
export function resolveUrl( relativePath, base) {
    const baseUrl = new URL(base);
    const absoluteUrl = new URL(relativePath, baseUrl);
    return absoluteUrl.href;
}

/**
 * Converts a URL string to a URL object.
 * 
 * @param {*} url - The URL to convert to a URL object.
 * @returns 
 */
export function toURL( url ) {
    return new URL( url );
}

/**
 * Extracts query parameters from a URL into an object.
 * 
 * @param {string} url - The URL to extract query parameters from.
 * @returns {Object} An object containing the query parameters.
 */
export function getQueryParams(url) {
    const urlObj = new URL(url);
    const params = {};
    urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
    });
    return params;
}

/**
 * Adds query parameters to a URL.
 * 
 * @param {string} url - The base URL.
 * @param {Object} params - An object containing the query parameters to add.
 * @returns {string} The URL with added query parameters.
 */
export function addQueryParams(url, params) {
    const urlObj = new URL(url);
    Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.append(key, value);
    });
    return urlObj.href;
}

/**
 * Removes specified query parameters from a URL.
 * 
 * @param {string} url - The URL to modify.
 * @param {string[]} paramsToRemove - Array of parameter names to remove.
 * @returns {string} The URL with specified parameters removed.
 */
export function removeQueryParams(url, paramsToRemove) {
    const urlObj = new URL(url);
    paramsToRemove.forEach(param => {
        urlObj.searchParams.delete(param);
    });
    return urlObj.href;
}

/**
 * Extracts the domain name from a URL.
 * 
 * @param {string} url - The URL to extract the domain from.
 * @returns {string} The domain name.
 */
export function getDomain(url) {
    const urlObj = new URL(url);
    return urlObj.hostname;
}

/**
 * Checks if a URL is valid.
 * 
 * @param {string} url - The URL to validate.
 * @returns {boolean} True if the URL is valid, false otherwise.
 */
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Gets the path segments from a URL as an array.
 * 
 * @param {string} url - The URL to process.
 * @returns {string[]} Array of path segments.
 */
export function getPathSegments(url) {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').filter(segment => segment.length > 0);
}

/**
 * Joins URL segments together, handling slashes appropriately.
 * 
 * @param {...string} segments - URL segments to join.
 * @returns {string} The joined URL.
 */
export function joinUrlSegments(...segments) {
    return segments
        .map(segment => segment.replace(/^\/+|\/+$/g, ''))
        .filter(segment => segment.length > 0)
        .join('/');
}

/**
 * Normalizes a URL by resolving relative paths and removing redundant parts.
 * 
 * @param {string} url - The URL to normalize.
 * @returns {string} The normalized URL.
 */
export function normalizeUrl(url) {
    const urlObj = new URL(url);
    return urlObj.href;
}

/**
 * Extracts the file extension from a URL.
 * 
 * @param {string} url - The URL to process.
 * @returns {string|null} The file extension or null if none exists.
 */
export function getFileExtension(url) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastDotIndex = pathname.lastIndexOf('.');
    
    if (lastDotIndex === -1 || lastDotIndex === pathname.length - 1) {
        return null;
    }
    
    return pathname.slice(lastDotIndex + 1);
}