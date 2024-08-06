import json2xml from "json2xml";
/**
 * Convert object to xml
 * @param {*} data
 * @param {*} settings
 * @returns
 */
export function toXML(data, settings = {}, format = 'xml') {
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
  const xml = json2xml(jsonData, settings);
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xml, "text/"+format);
  xmlDoc.xpathQuery=(query)=>{
    return xmlDoc.evaluate(query, xmlDoc, null, XPathResult.ANY_TYPE, null);
  };
  return xmlDoc;
}
