/**
 * @author Roberto Stefani
 * @license MIT
 * @desc {en} A collection of base utilities of aReS framework.
 * @desc {it} Una collezione di utilità base di aReS framework.
 * @desc {es} Una colección de utilitarios base de aReS.
 * @desc {fr} Une collection d'utilitaires de base d'aReS.
 * @desc {de} Eine Sammlung der Grundfunktionen von aReS-Frameworks.
 * @desc {pt} Uma coleção de utilitários base de aReS.
 * @desc {zh} 基础工具集
 * @desc {ru} Коллекция базовых инструментов aReS
 * @desc {ja} aReSフレームワークの基本ユーティリティ
 */
import appSetup from "./../../../app.js";
import * as text from "./text.js";
import * as arrays from "./arrays.js";
import * as crypto from "./crypto.js";
import * as dataDescriptor from "./dataDescriptors.js";
import * as deeplTranslator from "./deeplTranslator.js";
import * as files from "./files.js";
import * as localAi from "./localAI.js";
import * as objects from "./objects.js";
import * as permissions from "./permissions.js";
import * as scripts from "./scripts.js";
import * as prototype from "./prototype.js";
export function getApplicationRoot() {
  return files.getAbsolutePath('./');
}
const core=files.getParent(files.getParent(text.trimInitialRegexp(new URL(import.meta.url).pathname, '/')));
prototype.initPrototypes(core);

const aReS =  {
  arrays: arrays,
  crypto: crypto,
  dataDescriptor: dataDescriptor,
  deeplTranslator: deeplTranslator,
  files: files,
  localAi: localAi,
  objects: objects,
  permissions: permissions,
  scripts: scripts,
  prototype: prototype,
  text: text,
};

export default aReS;