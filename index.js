/**
 * @author Roberto Stefani
 * @license MIT
 * A collection of base utilities of aReS framework.



 */
import * as text from "./text.js";
import * as arrays from "./arrays.js";
import * as crypto from "./crypto.js";
import * as dataDescriptor from "./dataDescriptors.js";
import * as objects from "./objects.js";
import * as permissions from "./permissions.js";
import * as scripts from "./scripts.js";
import * as prototype from "./prototype.js";
import * as files from "@ares/files";
export function getApplicationRoot() {
  return files.getAbsolutePath('./');
}
const core=files.getParent(files.getParent(text.trimInitialRegexp(new URL(import.meta.url).pathname, '/')));
prototype.initPrototypes(core);

const aReS =  {
  arrays: arrays,
  crypto: crypto,
  dataDescriptor: dataDescriptor,
  files: files,
  objects: objects,
  permissions: permissions,
  scripts: scripts,
  prototype: prototype,
  text: text,

};

export default aReS;