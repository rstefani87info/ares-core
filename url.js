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