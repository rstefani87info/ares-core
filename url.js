import { URL }  from 'url';
/**
 * @desc {en} Resolves a relative URL path relative to a base URL.
 * @desc {it} Risolvi un percorso di URL relativo a un URL di base.
 * @desc {es} Resuelve un camino de URL relativo a una URL base.
 * @desc {fr} Résolution d'un chemin d'URL relatif à une URL de base.
 * @desc {pt} Resolução de um caminho de URL relativo a uma URL base.
 *
 * @param {string} base - The base URL.
 * @param {string} relativePath - The relative URL path.
 * @return {string} The resolved absolute URL.
 * 
 * @prototype {string}
 */
function resolveUrl( relativePath, base) {
    const baseUrl = new URL(base);
    const absoluteUrl = new URL(relativePath, baseUrl);
    return absoluteUrl.href;
}

/**
 * @desc {en} Converts a URL string to a URL object.
 * @desc {it} Converte una stringa di URL in un oggetto URL.
 * @desc {es} Convierte una cadena de URL en un objeto URL.
 * @desc {fr} Convertit une chaîne d'URL en un objet URL.
 * @desc {pt} Converte uma string de URL em um objeto URL.
 * 
 * @param {*} url - The URL to convert to a URL object.
 * @returns 
 */
function toURL( url ) {
    return new URL( url );
}