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
export default aReS = (() => {
  const { initPrototypes } = require("./prototype");
  // init the prototypes by all functions in this module
  initPrototypes();
  return {
    arrays: require("./arrays"),
    crypto: require("./crypto"),
    "data-descriptor": require("./data-descriptor"),
    "deepl-translator": require("./deepl-translator"),
    files: require("./files"),
    localAi: require("./localAI"),
    objects: require("./objects"),
    permissions: require("./permissions"),
    strings: require("./strings"),
    scripts: require("./scripts"),
    prototype: require("./prototype"),
  };
})();
