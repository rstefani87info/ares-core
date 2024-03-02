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

const arrayUtilities = require('./array-utilities');
const cryptoUtility = require('./crypto');
const filesUtility = require('./files');
const objectsUtility = require('./objects');
const permissionUtility = require('./permissions');
const scriptsUtility = require('./scripts');
const localAI = require('./localAI');
const deepl = require('./deepl-translator');


module.exports = {
    arrayUtilities,
    filesUtility,
    objectsUtility,
    scriptsUtility,
    permissionUtility,
    cryptoUtility,
    localAI,
    deepl
    
}