import json2xml from "json2xml";
/**
 * Convert object to xml
 * @param {*} this_data
 * @param {*} settings
 * @returns
 * 
 * @prototype {string}
 */
export function toXML(this_data, settings = {}, format = 'xml') {
  const defaultSettings = {
    wrapper: "root",
    indent: "  ",
    attributePrefix: "@",
    format: false,
    ignoreAttributes: false,
    ignoreDeclaration: false,
    ignoreRoot: false,
    compact: false,
    object: true,
  };
  settings = Object.assign({}, defaultSettings, settings);
  const xml = json2xml(this_data, settings);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/"+format);
  xmlDoc.xpathQuery=(query)=>{
    return xmlDoc.evaluate(query, xmlDoc, null, XPathResult.ANY_TYPE, null);
  };
  return xmlDoc;
}

/**
 * Escape XML characters
 * @param {*} this_str
 * @returns
 * 
 * @prototype {string}
 */
export function escapeXMLChar(this_str) {
  return this_str.replace(/[&<>"']/g, (m) => `&#${m.charCodeAt(0)};`);
}