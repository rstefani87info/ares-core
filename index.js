/**
 * @author Roberto Stefani
 * @license MIT
 * A collection of base utilities of aReS framework.
 */
import * as arrays from "./arrays.js";
import * as console from "./console.js";
import * as crypto from "./crypto.js";
import * as dataDescriptor from "./dataDescriptors.js";
import * as datasources from "./datasources.js";
import * as dates from "./dates.js";
import * as geographical from "./geographical.js";
import * as i18n from "./i18n.js";
import * as numbers from "./numbers.js";
import * as objects from "./objects.js";
import * as permissions from "./permissions.js";
import * as prototype from "./prototype.js";
import * as regex from "./regex.js";
import * as scripts from "./scripts.js";
import * as text from "./text.js";
import * as url from "./url.js";
import * as xhr from "./xhr.js";

export function getApplicationRoot() {
  return import.meta.resolve('../../../');
}
const core=files.getParent(files.getParent(text.trimInitialRegexp(new URL(import.meta.url).pathname, '/')));

prototype.initPrototypes(core);

const aReS =  {
  arrays: arrays,
  console: console,
  crypto: crypto,
  dataDescriptor: dataDescriptor,
  datasources: datasources,
  dates: dates,
  geographical: geographical,
  i18n: i18n,
  numbers: numbers,
  objects: objects,
  permissions: permissions,
  prototype: prototype,
  regex: regex,
  scripts: scripts,
  text: text,
  url: url,
  xhr: xhr
};

export default aReS;